// 사이트 상태 점검판 글 — 순수 함수 (작업 0105) · 값은 API 가 준 것만 · 이유는 분류 코드를 한국어로
import { kstDate } from "@hav/shared/date";
import { monthDayText as md } from "@hav/shared/format";
import type { SiteStatus, SlotState, StatusRun } from "@hav/shared/status";

export const SLOT_TEXT: Record<SlotState, string> = {
  done: "수집 완료",
  empty: "고시 없음",
  error: "실패",
  missed: "실패",
  "not-needed": "필요 없음",
  upcoming: "예정",
};

const REASON: Record<string, string> = {
  "no-key": "인증키 없음",
  shape: "응답 모양이 다름",
  unit: "단위가 다름",
};
export function reasonText(code: string | null): string | null {
  if (!code) return null;
  if (REASON[code]) return REASON[code];
  if (/^http-\d+$/.test(code)) return `서버 응답 ${code.slice(5)}`;
  if (/^result-\d+$/.test(code)) return "인증 · 한도 오류";
  return code;
}

/** "10월 30일 14:39" (한국 시각) */
export function timeText(iso: string): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${p.month}월 ${p.day}일 ${p.hour}:${p.minute}`;
}

const hm = (iso: string) => new Intl.DateTimeFormat("ko-KR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).format(new Date(iso));

export type Headline = { tone: "ok" | "warn" | "bad" | "rest"; text: string };

/** 맨 위 한 줄 — 오늘 값이 있으면 정상 · 주말은 쉼 · 회차가 놓쳤으면 경고 */
export function headlineOf(s: SiteStatus): Headline {
  if (s.latestDate === s.today) {
    // 오늘 마지막 성공 수집이 예비 출처면 경고 — 화면이 정상으로 보여 4일간 몰랐음 (#128 · 작업 0145)
    const last = s.todayRuns.find((r) => r.status === "ok");
    if (last && last.source !== "koreaexim") return { tone: "warn", text: "오늘 환율은 예비 출처 값입니다 · 수출입은행 값은 아직 없습니다" };
    return { tone: "ok", text: "오늘 환율이 들어왔습니다" };
  }
  if (s.schedule.length === 0) return { tone: "rest", text: `주말이라 고시가 없습니다 · ${s.latestDate ? md(s.latestDate) : "—"} 값` };
  if (s.schedule.some((x) => x.state === "missed" || x.state === "error")) return { tone: "bad", text: `오늘 환율이 아직 없습니다 · 지금은 ${s.latestDate ? md(s.latestDate) : "—"} 값` };
  if (s.schedule.every((x) => x.state === "upcoming")) return { tone: "warn", text: "오늘 환율은 낮 12시에 수집합니다" };
  if (s.schedule.some((x) => x.state === "empty")) return { tone: "warn", text: "오늘은 고시가 없습니다 (공휴일)" };
  return { tone: "warn", text: "오늘 환율을 기다리는 중입니다" };
}

/** "12:00 · 수출입은행 · 22개 통화" · 실패면 이유 */
export function runText(r: StatusRun | null): string {
  if (!r) return "기록 없음";
  const src = r.source === "koreaexim" ? "한국수출입은행" : r.source.includes("frankfurter") ? "예비 출처" : r.source;
  const when = hm(r.at);
  if (r.status === "error") return `${when} · 실패${reasonText(r.reason) ? ` (${reasonText(r.reason)})` : ""}`;
  if (r.status === "empty") return `${when} · 고시 없음`;
  return `${when} · ${src} · ${r.rows}개 통화${r.source !== "koreaexim" && reasonText(r.reason) ? ` (수출입은행: ${reasonText(r.reason)})` : ""}`;
}

/** 마지막 수집이 오늘이 아니면 날짜도 */
export function lastRunText(s: SiteStatus): string {
  const r = s.lastRun;
  if (!r) return "기록 없음";
  const day = kstDate(new Date(r.at));
  return day === s.today ? runText(r) : `${md(day)} ${runText(r)}`;
}

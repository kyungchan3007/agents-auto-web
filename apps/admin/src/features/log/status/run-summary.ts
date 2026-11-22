// 상태판 "오늘 환율 수집" 칸의 짧은 값 — "12:00 성공 · 공식 22개" (작업 0170 · Figma 06) · 값은 API 가 준 마지막 수집 기록만
//   오늘 기록이 아니면 날짜를 앞에 ("11-13 12:00 …") · 실패면 "12:00 실패" · 기록이 없으면 "기록 없음" (지어내지 않음)
import { kstDate } from "@hav/shared/date";
import type { SiteStatus } from "@hav/shared/status";

export function runSummary(s: SiteStatus): string {
  const r = s.lastRun;
  if (!r) return "기록 없음";
  const p = Object.fromEntries(new Intl.DateTimeFormat("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Seoul" }).formatToParts(new Date(r.at)).map((x) => [x.type, x.value]));
  const when = `${p.hour === "24" ? "00" : p.hour}:${p.minute}`;
  const day = kstDate(new Date(r.at)) === s.today ? "" : `${p.month}-${p.day} `;
  if (r.status === "error") return `${day}${when} 실패`;
  if (r.status === "empty") return `${day}${when} 고시 없음`;
  if (r.status === "running") return `${day}${when} 수집 중`;
  const kind = r.source === "koreaexim" ? "공식" : "예비";
  return `${day}${when} 성공 · ${kind} ${r.rows}개`;
}

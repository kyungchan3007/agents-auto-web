// GA4 버튼 클릭 수 (작업 0359) — Data API 응답 → 하루 · 이벤트별 행 → 기간 합 → 저장 SQL · GitHub Actions 가 scripts/ga4-sync.ts 로 부름
//   설치 없이 node 로 바로 도는 스크립트가 가져오는 파일이라 패키지 이름(@hav/*) 가져오기가 없음 — 이벤트 표는 상대 경로로 가져옴 (engagement.ts 와 같음)
//   eventName 만으로 셈(맞춤 측정기준 없음) · 이벤트 표에 없는 이름(page_view 등)은 거름 · 못 받은 값은 지어내지 않고 행을 버림
//   저장: 새 표 없이 team_snapshots(key · body JSON · synced_at)의 키 'ga4-click-events' · 매일 덮어씀
import { CLICK_EVENT_NAMES } from "../../../../../packages/shared/src/domain/click-events.ts";
import { cellsOf, countOf, dayOf } from "./report.ts";

export type ClickRow = { day: string; name: string; count: number; users: number };
export type ClickData = { from: string; to: string; since: string; events: { name: string; count: number; users: number }[] };

const NAMES: readonly string[] = CLICK_EVENT_NAMES;

export function clickRows(apiJson: unknown): ClickRow[] {
  return cellsOf(apiJson, ["date", "eventName"], ["eventCount", "totalUsers"]).flatMap((c) => {
    const day = dayOf(c.date);
    const name = c.eventName;
    const count = countOf(c.eventCount);
    const users = countOf(c.totalUsers);
    return day && name && NAMES.includes(name) && count !== null && users !== null ? [{ day, name, count, users }] : [];
  });
}

/** 이벤트별 합(이벤트 표 순서) · 행이 없으면 null (빈 표를 저장하지 않음) · users 는 날짜별 누른 사람 수의 합 */
export function clickSnapshot(rows: ClickRow[], range: { from: string; to: string }, since: string): ClickData | null {
  if (rows.length === 0) return null;
  const events = NAMES.flatMap((name) => {
    const mine = rows.filter((r) => r.name === name);
    return mine.length ? [{ name, count: mine.reduce((s, r) => s + r.count, 0), users: mine.reduce((s, r) => s + r.users, 0) }] : [];
  });
  return { from: range.from, to: range.to, since, events };
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** 오늘 값으로 덮어씀(INSERT OR REPLACE) · null 이면 줄을 쓰지 않음(지우지도 않음) */
export const clickSql = (data: ClickData | null, syncedAt: string): string => (data ? `INSERT OR REPLACE INTO team_snapshots (key, body, synced_at) VALUES ('ga4-click-events', ${q(JSON.stringify(data))}, ${q(syncedAt)});` : "");

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const isRec = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;

/** 저장된 글 → 데이터 · JSON 이 깨졌거나 모양이 다르면 null */
export function parseClicks(body: string): ClickData | null {
  let j: unknown;
  try {
    j = JSON.parse(body);
  } catch {
    return null;
  }
  if (!isRec(j) || !isDate(j.from) || !isDate(j.to) || !isDate(j.since) || !Array.isArray(j.events)) return null;
  const events: ClickData["events"] = [];
  for (const e of j.events) {
    if (!isRec(e) || typeof e.name !== "string" || !isCount(e.count) || !isCount(e.users)) return null;
    events.push({ name: e.name, count: e.count, users: e.users });
  }
  return { from: j.from, to: j.to, since: j.since, events };
}

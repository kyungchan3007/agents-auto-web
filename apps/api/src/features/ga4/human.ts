// GA4 사람 판별 값 (작업 0374) — Data API 응답 → 날짜별 · 기기 · 국가 → 저장 SQL · 읽기 (순수 함수) · GitHub Actions 가 scripts/ga4-sync.ts 로 부름
//   설치 없이 node 로 바로 도는 스크립트가 가져오는 파일이라 패키지 이름(@hav/*) 가져오기가 없음 — report.ts 는 상대 경로로 가져옴 (clicks.ts 와 같음)
//   참여 세션 · 참여 시간은 받지 못하면 그 칸만 null(0 으로 채우지 않음) · 날짜 · 사용자 · 세션을 못 받은 행은 버림
//   저장: 새 표 없이 team_snapshots(key · body JSON · synced_at)의 키 'ga4-human' · 매일 덮어씀
import { cellsOf, countOf, dayOf, textOf } from "./report.ts";

export type HumanDay = { day: string; users: number; sessions: number; engagedSessions: number | null; engagementSeconds: number | null };
export type HumanGroup = { name: string; users: number; sessions: number; engagedSessions: number | null };
export type HumanData = { from: string; to: string; days: HumanDay[]; devices: HumanGroup[]; countries: HumanGroup[] };

const TOP = 5;
const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
/** 0 이상 숫자 글(소수 허용)만 숫자로 */
const secondsOf = (v: string | null | undefined): number | null => (v && /^\d+(\.\d+)?$/.test(v) && Number.isFinite(Number(v)) ? Number(v) : null);

export function humanRows(apiJson: unknown): HumanDay[] {
  return cellsOf(apiJson, ["date"], ["activeUsers", "sessions"]).flatMap((c) => {
    const day = dayOf(c.date);
    const users = countOf(c.activeUsers);
    const sessions = countOf(c.sessions);
    return day && users !== null && sessions !== null ? [{ day, users, sessions, engagedSessions: countOf(c.engagedSessions), engagementSeconds: secondsOf(c.userEngagementDuration) }] : [];
  });
}

export function breakdownRows(apiJson: unknown, dimension: "deviceCategory" | "country"): HumanGroup[] {
  return cellsOf(apiJson, [dimension], ["activeUsers", "sessions"]).flatMap((c) => {
    const name = textOf(c[dimension]);
    const users = countOf(c.activeUsers);
    const sessions = countOf(c.sessions);
    return name && users !== null && sessions !== null ? [{ name, users, sessions, engagedSessions: countOf(c.engagedSessions) }] : [];
  });
}

/** 같은 이름끼리 합(참여 세션은 하나라도 null 이면 null) · 세션 많은 순 · 같으면 이름 글자순 · 위 5개 */
function top(groups: HumanGroup[]): HumanGroup[] {
  const sum = new Map<string, HumanGroup>();
  for (const g of groups) {
    const cur = sum.get(g.name);
    if (!cur) sum.set(g.name, { ...g });
    else {
      cur.users += g.users;
      cur.sessions += g.sessions;
      cur.engagedSessions = cur.engagedSessions === null || g.engagedSessions === null ? null : cur.engagedSessions + g.engagedSessions;
    }
  }
  return [...sum.values()].sort((a, b) => b.sessions - a.sessions || cmp(a.name, b.name)).slice(0, TOP);
}

/** 저장할 한 장 · 날짜가 없으면 null (빈 표를 저장하지 않음) */
export function humanSnapshot(days: HumanDay[], devices: HumanGroup[], countries: HumanGroup[], range: { from: string; to: string }): HumanData | null {
  if (days.length === 0) return null;
  return { from: range.from, to: range.to, days: [...days].sort((a, b) => cmp(a.day, b.day)), devices: top(devices), countries: top(countries) };
}

const q = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** 오늘 값으로 덮어씀(INSERT OR REPLACE) · null 이면 줄을 쓰지 않음(지우지도 않음) */
export const humanSql = (data: HumanData | null, syncedAt: string): string => (data ? `INSERT OR REPLACE INTO team_snapshots (key, body, synced_at) VALUES ('ga4-human', ${q(JSON.stringify(data))}, ${q(syncedAt)});` : "");

const isDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
const isRec = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isCount = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v >= 0;
const isCountOrNull = (v: unknown): v is number | null => v === null || isCount(v);
const isSeconds = (v: unknown): v is number | null => v === null || (typeof v === "number" && Number.isFinite(v) && v >= 0);

function groupsOf(v: unknown): HumanGroup[] | null {
  if (!Array.isArray(v)) return null;
  const out: HumanGroup[] = [];
  for (const g of v) {
    if (!isRec(g) || typeof g.name !== "string" || !isCount(g.users) || !isCount(g.sessions) || !isCountOrNull(g.engagedSessions)) return null;
    out.push({ name: g.name, users: g.users, sessions: g.sessions, engagedSessions: g.engagedSessions });
  }
  return out;
}

/** 저장된 글 → 데이터 · JSON 이 깨졌거나 모양이 다르면 null */
export function parseHuman(body: string): HumanData | null {
  let j: unknown;
  try {
    j = JSON.parse(body);
  } catch {
    return null;
  }
  if (!isRec(j) || !isDate(j.from) || !isDate(j.to) || !Array.isArray(j.days)) return null;
  const days: HumanDay[] = [];
  for (const d of j.days) {
    if (!isRec(d) || !isDate(d.day) || !isCount(d.users) || !isCount(d.sessions) || !isCountOrNull(d.engagedSessions) || !isSeconds(d.engagementSeconds)) return null;
    days.push({ day: d.day, users: d.users, sessions: d.sessions, engagedSessions: d.engagedSessions, engagementSeconds: d.engagementSeconds });
  }
  const devices = groupsOf(j.devices);
  const countries = groupsOf(j.countries);
  return devices && countries ? { from: j.from, to: j.to, days, devices, countries } : null;
}

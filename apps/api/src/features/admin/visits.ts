// 어드민 접속 기록 (작업 0326) — 토큰 이름별 처음 · 마지막 시각만 저장 (IP · 기기 · 경로는 받지도 저장하지도 않음)
import type { AdminVisits } from "@hav/shared/admin-visits";

const OWNER = "owner";
/** 영문 소문자로 시작 · 소문자 · 숫자 · 하이픈 · 점 · 밑줄 64자 이하 */
const NAME = /^[a-z0-9][a-z0-9._-]{0,63}$/;

export const validVisitName = (name: string): boolean => NAME.test(name);

/** 이름이 처음이면 first_at = last_at = 지금 · 있으면 last_at 만 갱신 — 값은 바인딩 · owner · 모양이 틀린 이름은 쓰지 않고 false */
export async function recordVisit(db: D1Database, name: string, nowIso: string): Promise<boolean> {
  if (name === OWNER || !validVisitName(name)) return false;
  await db
    .prepare("INSERT INTO admin_visits (name, first_at, last_at) VALUES (?1, ?2, ?2) ON CONFLICT(name) DO UPDATE SET last_at = excluded.last_at")
    .bind(name, nowIso)
    .run();
  return true;
}

type VisitRow = { name: string; first_at: string; last_at: string };

/** owner 는 뺌 · 마지막 접속이 최근인 이름부터 */
export function adminVisitsReport(rows: VisitRow[]): AdminVisits {
  const visits = rows
    .filter((r) => r.name !== OWNER)
    .sort((a, b) => (a.last_at < b.last_at ? 1 : a.last_at > b.last_at ? -1 : 0))
    .map((r) => ({ name: r.name, firstAt: r.first_at, lastAt: r.last_at }));
  return { visits };
}

export async function readVisits(db: D1Database): Promise<VisitRow[]> {
  const res = await db.prepare("SELECT name, first_at, last_at FROM admin_visits ORDER BY last_at DESC LIMIT 500").all<VisitRow>();
  return res.results ?? [];
}

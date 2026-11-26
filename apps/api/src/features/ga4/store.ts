// GA4 유입 읽기 — 표가 아직 없으면(마이그레이션 전) 빈 목록으로 (작업 0324) · 쓰기는 GitHub Actions(ga4-sync.yml)
import { gte, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { ga4Daily, ga4Pages, ga4Sources, teamSnapshots } from "../../db/schema";
import type { Ga4DailyRow, Ga4PageRow, Ga4SourceRow } from "./report";

export async function ga4Rows(d1: D1Database, since: string): Promise<{ daily: Ga4DailyRow[]; sources: Ga4SourceRow[]; pages: Ga4PageRow[] }> {
  const db = drizzle(d1);
  try {
    const [daily, sources, pages] = await Promise.all([
      db.select().from(ga4Daily).where(gte(ga4Daily.day, since)),
      db.select().from(ga4Sources).where(gte(ga4Sources.day, since)),
      db.select().from(ga4Pages).where(gte(ga4Pages.day, since)),
    ]);
    return { daily: daily.map((r) => ({ day: r.day, users: r.users, sessions: r.sessions, pageViews: r.pageViews })), sources, pages };
  } catch {
    return { daily: [], sources: [], pages: [] };
  }
}

/**
 * 페이지별 머무름 두 장 + 버튼 클릭 한 장(작업 0359 · ga4-click-events) — 새 표를 만들지 않고 작업 0341 의 team_snapshots(key · body JSON)에 둠 (작업 0349 · 보호 파일을 바꾸지 않기 위해)
 *   ga4-page-engagement: 매일 덮어씀 · ga4-page-engagement-baseline: 처음 한 번만(INSERT OR IGNORE) — 쓰기는 scripts/ga4-sync.ts · 표가 아직 없으면 빈 목록
 */
export async function engagementSnapshots(d1: D1Database): Promise<{ key: string; body: string }[]> {
  try {
    const rows = await drizzle(d1).select().from(teamSnapshots).where(inArray(teamSnapshots.key, ["ga4-page-engagement", "ga4-page-engagement-baseline", "ga4-click-events", "ga4-human"]));
    return rows.map((r) => ({ key: r.key, body: r.body }));
  } catch {
    return [];
  }
}

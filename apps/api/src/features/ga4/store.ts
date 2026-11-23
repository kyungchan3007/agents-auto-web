// GA4 유입 읽기 — 표가 아직 없으면(마이그레이션 전) 빈 목록으로 (작업 0324) · 쓰기는 GitHub Actions(ga4-sync.yml)
import { gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { ga4Daily, ga4Pages, ga4Sources } from "../../db/schema";
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

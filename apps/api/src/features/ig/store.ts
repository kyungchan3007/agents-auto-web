// 인스타 성과 읽기 — 표가 아직 없으면(마이그레이션 전) 빈 목록으로 (작업 0323) · 쓰기는 GitHub Actions(ig-insights.yml)
import { gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { igAccountInsights, igMedia, igMediaInsights } from "../../db/schema";
import type { IgAccountInsightRow, IgMediaInfo, IgMediaInsightRow } from "./summary";

export async function igRows(d1: D1Database, since: string): Promise<{ media: IgMediaInfo[]; mediaInsights: IgMediaInsightRow[]; accountInsights: IgAccountInsightRow[] }> {
  const db = drizzle(d1);
  try {
    const [media, mediaInsights, accountInsights] = await Promise.all([
      db.select().from(igMedia),
      db.select().from(igMediaInsights).where(gte(igMediaInsights.day, since)),
      db.select().from(igAccountInsights).where(gte(igAccountInsights.day, since)),
    ]);
    return { media, mediaInsights, accountInsights };
  } catch {
    return { media: [], mediaInsights: [], accountInsights: [] };
  }
}

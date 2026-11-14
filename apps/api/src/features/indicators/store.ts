// D1 저장 · 읽기 — 공용 시계열 (indicator_points · 작업 0163)
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { clearApiCache } from "../../db/cache";
import { runLog } from "../../db/runs";
import { indicatorPoints } from "../../db/schema";
import type { IndicatorStore } from "./collect";

// D1 바인딩 100개 제한 → 5칸 × 20줄
const CHUNK = 20;

export function d1IndicatorStore(d1: D1Database): IndicatorStore {
  const db = drizzle(d1);
  return {
    ...runLog(db),
    async savePoints(rows) {
      for (let i = 0; i < rows.length; i += CHUNK) {
        await db
          .insert(indicatorPoints)
          .values(rows.slice(i, i + CHUNK))
          .onConflictDoUpdate({
            target: [indicatorPoints.series, indicatorPoints.period],
            set: { value: sql`excluded.value`, source: sql`excluded.source`, fetchedAt: sql`excluded.fetched_at` },
          });
      }
      if (rows.length > 0) await clearApiCache(d1); // 새 자료 → 저장해 둔 응답은 낡음
      return rows.length;
    },
    hasPeriod: (series, period) => hasIndicatorPeriod(d1, series, period),
  };
}

/** 그 (series, period) 가 이미 저장됐는지 — 한 줄만 읽음 */
export async function hasIndicatorPeriod(d1: D1Database, series: string, period: string): Promise<boolean> {
  return (await d1.prepare("select 1 as x from indicator_points where series = ? and period = ? limit 1").bind(series, period).first()) !== null;
}

/** series 의 최근 limit 개 — 오래된 것부터 */
export async function recentPoints(d1: D1Database, series: string, limit: number): Promise<{ period: string; value: number }[]> {
  const { results } = await d1.prepare("select period, value from indicator_points where series = ? order by period desc limit ?").bind(series, limit).all<{ period: string; value: number }>();
  return results.map((r) => ({ period: r.period, value: r.value })).reverse();
}

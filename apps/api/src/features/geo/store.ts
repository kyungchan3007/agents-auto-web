// GEO 방문 집계 읽기 — 기본 키(날짜…) 앞부분으로 그 기간만 · 쓰기는 Pages 함수 (apps/web/src/bff/track-visit.ts)
import { gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { geoHits, gscDaily, gscSync, gscTop } from "../../db/schema";
import type { GscInput } from "./summary";

export async function geoRows(d1: D1Database, since: string) {
  return drizzle(d1).select().from(geoHits).where(gte(geoHits.day, since));
}

/** Search Console 자료 — 표가 아직 없으면(마이그레이션 전) 가져온 적 없음으로 */
export async function gscRows(d1: D1Database): Promise<GscInput> {
  const db = drizzle(d1);
  try {
    const [sync, daily, top] = await Promise.all([db.select().from(gscSync).limit(1), db.select().from(gscDaily).orderBy(gscDaily.day), db.select().from(gscTop)]);
    return { syncedAt: sync[0]?.syncedAt ?? null, daily, top };
  } catch {
    return { syncedAt: null, daily: [], top: [] };
  }
}

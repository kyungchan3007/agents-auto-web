// GEO 방문 집계 읽기 — 기본 키(날짜…) 앞부분으로 그 기간만 · 쓰기는 Pages 함수 (apps/web/src/bff/track-visit.ts)
import { gte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { geoHits } from "../../db/schema";

export async function geoRows(d1: D1Database, since: string) {
  return drizzle(d1).select().from(geoHits).where(gte(geoHits.day, since));
}

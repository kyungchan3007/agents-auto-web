// GEO 측정 API 계약 — GET /geo
import { z } from "zod";
import { IsoDate } from "./date";

const GeoKind = z.enum(["training", "search", "user", "engine"]);

const SearchLine = z.object({ key: z.string(), clicks: z.number().int().nonnegative(), impressions: z.number().int().nonnegative(), position: z.number().nonnegative() });

/** Search Console 지난 약 28일 · 가져온 적이 없으면 null */
const GeoSearch = z.object({
  syncedAt: z.iso.datetime(),
  firstDay: IsoDate.nullable(),
  lastDay: IsoDate.nullable(),
  clicks: z.number().int().nonnegative(),
  impressions: z.number().int().nonnegative(),
  position: z.number().nonnegative().nullable(),
  queries: z.array(SearchLine),
  pages: z.array(SearchLine),
});

export const GeoReport = z.object({
  /** 집계 기간 시작일 */
  since: IsoDate,
  /** 처음 기록된 날 · 기록이 없으면 null */
  firstDay: IsoDate.nullable(),
  bots: z.array(z.object({ name: z.string(), kind: GeoKind, hits: z.number().int().nonnegative(), lastDay: IsoDate })),
  referrals: z.array(z.object({ name: z.string(), hits: z.number().int().nonnegative(), lastDay: IsoDate })),
  /** 페이지별 AI 봇 방문 (일반 검색 엔진 제외) */
  pages: z.array(z.object({ path: z.string(), hits: z.number().int().nonnegative() })),
  /** 운영 확인 방문이 마지막으로 기록된 날 — 공개 수치에는 넣지 않음 */
  verifiedDay: IsoDate.nullable().default(null),
  search: GeoSearch.nullable().default(null),
});
export type GeoReport = z.infer<typeof GeoReport>;

// GEO 측정 API 계약 — GET /geo
import { z } from "zod";
import { IsoDate } from "../utils/date";

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

/** AI 답변 인용 측정 — 서비스별 최근 측정일 · 측정한 적이 없으면 null (작업 0139) */
const GeoEngine = z.enum(["claude", "openai", "perplexity"]);
const GeoAnswers = z.object({
  engines: z.array(
    z.object({
      engine: GeoEngine,
      day: IsoDate,
      /** 질문 수 · 응답을 받은 질문 수 (실패는 ok 에 들어가지 않음) */
      total: z.number().int().nonnegative(),
      ok: z.number().int().nonnegative(),
      /** 답의 인용 표시에 tripfx 가 나온 질문 수 · 검색 결과에 나온 질문 수 */
      cited: z.number().int().nonnegative(),
      found: z.number().int().nonnegative(),
      citedQuestions: z.array(z.string()),
      /** 그날 질문별 결과 — 저장된 그대로 (작업 0141) */
      results: z
        .array(z.object({ question: z.string(), group: z.enum(["brand", "general"]), status: z.enum(["ok", "error"]), cited: z.boolean(), found: z.boolean() }))
        .default([]),
    }),
  ),
  /** 날짜 · 서비스별 저장된 질문 수(total) · 응답 받은 수(ok) · 인용 수 (오래된 날부터) */
  history: z.array(
    z.object({ day: IsoDate, engine: GeoEngine, total: z.number().int().nonnegative().default(0), ok: z.number().int().nonnegative(), cited: z.number().int().nonnegative() }),
  ),
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
  answers: GeoAnswers.nullable().default(null),
});
export type GeoReport = z.infer<typeof GeoReport>;

// GA4 유입 API 계약 — GET /ga4 (작업 0324) · 빈 D1 이면 빈 목록 · 받은 0 은 0
import { z } from "zod";
import { IsoDate } from "../utils/date";

const Count = z.number().int().nonnegative();

export const Ga4Report = z.object({
  /** 날짜별 · 최근 날부터 */
  daily: z.array(z.object({ day: IsoDate, users: Count, sessions: Count, pageViews: Count })),
  /** 유입 경로별 기간 합 · 세션 많은 순 · 위 20개 */
  sources: z.array(z.object({ source: z.string(), medium: z.string(), campaign: z.string(), sessions: Count, users: Count })),
  /** 페이지별 기간 합 · 조회 많은 순 · 위 20개 */
  pages: z.array(z.object({ path: z.string(), views: Count })),
});
export type Ga4Report = z.infer<typeof Ga4Report>;

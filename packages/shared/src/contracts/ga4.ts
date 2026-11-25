// GA4 유입 API 계약 — GET /ga4 (작업 0324) · 빈 D1 이면 빈 목록 · 받은 0 은 0
import { z } from "zod";
import { IsoDate } from "../utils/date";

const Count = z.number().int().nonnegative();

const Rate = z.number().min(0).max(1);

/** 페이지별 머무름 (작업 0349) — 기간 안 합 · 참여율 = 참여한 세션 ÷ 세션 · 이탈률 = 1 − 참여율 · 세션당 페이지뷰 = 페이지뷰 ÷ 세션 (GA4 정의) */
export const PageEngagement = z.object({
  from: IsoDate,
  to: IsoDate,
  pages: z.array(z.object({ path: z.string(), views: Count, sessions: Count, engagementRate: Rate, bounceRate: Rate, viewsPerSession: z.number().nonnegative() })),
});
export type PageEngagement = z.infer<typeof PageEngagement>;

/** 버튼 클릭 (작업 0359) — 최근 28일 이벤트별 합 · since = 이벤트를 보내기 시작한 날 · users 는 날짜별 누른 사람 수의 합(여러 날 누른 같은 사람은 겹쳐 셈) */
export const ClickEvents = z.object({
  from: IsoDate,
  to: IsoDate,
  since: IsoDate,
  events: z.array(z.object({ name: z.string(), count: Count, users: Count })),
});
export type ClickEvents = z.infer<typeof ClickEvents>;

export const Ga4Report = z.object({
  /** 날짜별 · 최근 날부터 */
  daily: z.array(z.object({ day: IsoDate, users: Count, sessions: Count, pageViews: Count })),
  /** 유입 경로별 기간 합 · 세션 많은 순 · 위 20개 */
  sources: z.array(z.object({ source: z.string(), medium: z.string(), campaign: z.string(), sessions: Count, users: Count })),
  /** 페이지별 기간 합 · 조회 많은 순 · 위 20개 */
  pages: z.array(z.object({ path: z.string(), views: Count })),
  /** 페이지별 머무름 · 최근 28일 · 없으면 null · 예전 응답에는 없어서 기본값 (작업 0349) */
  engagement: PageEngagement.nullable().default(null),
  /** 시작 날 기준값 — 처음 한 번 저장하고 바꾸지 않음 · 없으면 null */
  baseline: PageEngagement.nullable().default(null),
  /** 버튼 클릭 · 없으면 null · 예전 응답에는 없어서 기본값 (작업 0359) */
  clicks: ClickEvents.nullable().default(null),
});
export type Ga4Report = z.infer<typeof Ga4Report>;

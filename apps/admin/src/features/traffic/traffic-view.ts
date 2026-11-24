// 유입 화면 글 (작업 0324) — 순수 함수
import type { Ga4Report } from "@hav/shared/ga4";

/** 날짜별 · 유입 경로 · 페이지 · 머무름이 모두 없는가 */
export const isEmptyTraffic = (r: Ga4Report): boolean => r.daily.length === 0 && r.sources.length === 0 && r.pages.length === 0 && r.engagement === null;

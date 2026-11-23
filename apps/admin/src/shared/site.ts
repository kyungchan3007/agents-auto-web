// 어드민 앱이 쓰는 주소 — 두 앱이 같이 쓰는 값은 @hav/shared/site 에서 그대로 내보내고, 어드민만 쓰는 값은 여기 (작업 0312)
export { ADMIN_URL, REPO_URL, SITE_URL } from "@hav/shared/site";
/** 알리기 소재 그림의 R2 공개 주소(읽기 전용 공개 값 · 비밀값 아님) — {날짜}.jpg · 작업 0310 */
/** 측정을 시작한 날 — 리뷰어가 "숫자가 적다 · 비었다"를 오해하지 않게 화면 위에 보임 (작업 0328)
 *  ga4: GA4 태그가 운영에 나간 날(작업 0322 · main 반영 2026-11-23) · instagram: 인스타 성과 수집 첫 성공(ig-insights 2026-11-23 06:02Z) */
export const MEASURE_START = { ga4: "2026-11-23", instagram: "2026-11-23" } as const;
export const MARKETING_IMAGE_BASE = "https://pub-65c388a50b5648f6bc15b6d076f8c3bc.r2.dev/";

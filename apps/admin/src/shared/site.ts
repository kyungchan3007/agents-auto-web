// 어드민 앱이 쓰는 주소 — 두 앱이 같이 쓰는 값은 @hav/shared/site 에서 그대로 내보내고, 어드민만 쓰는 값은 여기 (작업 0312)
export { ADMIN_URL, REPO_URL, SITE_URL } from "@hav/shared/site";
/** 알리기 소재 그림의 R2 공개 주소(읽기 전용 공개 값 · 비밀값 아님) — {날짜}.jpg · 작업 0310 */
export const MARKETING_IMAGE_BASE = "https://pub-65c388a50b5648f6bc15b6d076f8c3bc.r2.dev/";

// 운영 사이트(flapfx.com)만 쓰는 값 — 두 앱이 같이 쓰는 주소 · 이름은 @hav/shared/site (작업 0312)
export { ADMIN_URL, SITE_URL, SITE_NAME, REPO_URL } from "@hav/shared/site";
/** 네이버 서치어드바이저 소유 확인 값 — 비어 있으면 태그를 내지 않음 · 받은 값만 넣음, 지어내지 않음 (작업 0317) */
export const NAVER_SITE_VERIFICATION = "657e110e78edffb518950a04c8044bae5f063146";
export const SITE_DESCRIPTION = "환율 · 물가를 매일 받아 여행 · 직구 타이밍을 보여 주는 대시보드";

/** 검색에 내보낼 페이지 — 개발용 /design 은 뺌 · 작업실 · GEO 측정은 어드민 앱(apps/admin)으로 (작업 0302 · 0312) · 통화 상세는 sitemap 이 API 에서 더함 */
export const PUBLIC_PAGES = ["/", "/currencies", "/prices", "/flights", "/calc", "/about"] as const;

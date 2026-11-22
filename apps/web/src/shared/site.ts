// 이 사이트의 주소 · 이름 — 공유 미리보기(og) · sitemap 이 같이 씀
export const SITE_URL = "https://flapfx.com";
/** 어드민 주소 — 작업실 · GEO 측정 (작업 0302 · 같은 Worker 가 주소로 나눔 · 검색에 막음) */
export const ADMIN_URL = "https://admin.flapfx.com";
export const SITE_NAME = "Flapfx";
/** 저장소 주소 — 서버 · 브라우저 둘 다 씀 ("use client" 파일에서 내보낸 값은 서버에서 함수 껍데기가 돼 링크가 깨졌음 · 작업 0092) */
export const REPO_URL = "https://github.com/kyungchan3007/agents-auto-web";
/** 알리기 소재 그림의 R2 공개 주소(읽기 전용 공개 값 · 비밀값 아님) — {날짜}.jpg · 작업 0310 */
export const MARKETING_IMAGE_BASE = "https://pub-65c388a50b5648f6bc15b6d076f8c3bc.r2.dev/";
export const SITE_DESCRIPTION = "환율 · 물가를 매일 받아 여행 · 직구 타이밍을 보여 주는 대시보드";

/** 검색에 내보낼 페이지 — 개발용 /design 은 뺌 · 작업실 · GEO 측정은 어드민으로 (작업 0302) · 통화 상세는 sitemap 이 API 에서 더함 */
export const PUBLIC_PAGES = ["/", "/currencies", "/prices", "/flights", "/calc", "/about"] as const;

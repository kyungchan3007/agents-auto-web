// 사이트 주소 · 이름 — 운영(apps/web) · 어드민(apps/admin) 두 앱이 같이 씀 (작업 0312)
//   한 앱만 쓰는 값(설명 · 검색에 내보낼 페이지 · 알리기 그림 주소)은 그 앱의 src/shared 에 둔다
export const SITE_URL = "https://flapfx.com";
/** 어드민 주소 — 작업실 · GEO 측정 · 만드는 방식 · 알리기 (작업 0302 · 0312 부터 apps/admin 이 따로 배포 · 검색에 막음) */
export const ADMIN_URL = "https://admin.flapfx.com";
export const SITE_NAME = "Flapfx";
/** 저장소 주소 — 서버 · 브라우저 둘 다 씀 ("use client" 파일에서 내보낸 값은 서버에서 함수 껍데기가 돼 링크가 깨졌음 · 작업 0092) */
export const REPO_URL = "https://github.com/kyungchan3007/agents-auto-web";

/** 운영 사이트 주소(host) — 옛 어드민 경로를 어드민 주소로 넘길 때 봄 */
export const PUBLIC_HOSTS = ["flapfx.com", "www.flapfx.com"] as const;
export const ADMIN_HOST = "admin.flapfx.com";
/** 어드민 화면 경로 — 어드민 메뉴(apps/admin) · 어드민 Worker 경로 나누기 · 운영 Worker 의 옛 주소 301(apps/web) 이 모두 이 목록을 봄 (작업 0302 · 0312) */
export const ADMIN_PATHS = ["/log", "/geo", "/how", "/marketing"] as const;
export type AdminPath = (typeof ADMIN_PATHS)[number];

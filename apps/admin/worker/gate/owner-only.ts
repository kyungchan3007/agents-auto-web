// owner 만 여는 어드민 경로 한 표 (작업 0403 · 순수 함수)
//   회사 링크(owner 가 아닌 세션)는 화면 4곳(작업실 · 알리기 · 유입 · 인스타 유입)과 그 화면만 쓰는 /bff 자료를 못 엶
//   화면 → 302 /geo · 자료 → 403 · 막을 경로는 여기 한 곳에서만 고침
//   /bff/status 는 어드민 화면 코드가 부르지 않아 표에 넣지 않음(지금 그대로)

/** 화면 경로 — 하위 · 정적 파일 변형(.html · .txt · /index.txt · /__next.*.txt)까지 */
export const OWNER_ONLY_PAGES = ["/log", "/marketing", "/traffic", "/instagram"] as const;
/** 그 화면 전용 BFF 자료 — 작업실 실시간 · 지난 작업 · GA4 유입 · 인스타 성과 (GEO · 만드는 방식이 쓰는 것은 제외) */
export const OWNER_ONLY_BFF = ["/bff/activity", "/bff/tasks", "/bff/ga4", "/bff/ig"] as const;
/** 회사 세션의 첫 화면 */
export const COMPANY_HOME = "/geo";

/** 주소 글 바로잡기 — 퍼센트 인코딩 풀기 · 슬래시 겹침 줄이기 · 소문자 · 끝 슬래시 제거 (표와 같은 모양으로 비교) */
function normalize(pathname: string): string {
  let p = pathname;
  try {
    p = decodeURIComponent(p);
  } catch {
    // 풀 수 없는 글은 그대로 비교
  }
  p = p.replace(/\/{2,}/g, "/").toLowerCase();
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

/** 막힌 화면인가 — 정확히 그 경로 · 하위(/x/) · 확장자 변형(.html · .txt) */
export function isOwnerOnlyPage(pathname: string): boolean {
  const p = normalize(pathname);
  return OWNER_ONLY_PAGES.some((base) => p === base || p.startsWith(`${base}/`) || p.startsWith(`${base}.`));
}

/** 막힌 BFF 자료인가 */
export function isOwnerOnlyBff(pathname: string): boolean {
  const p = normalize(pathname);
  return OWNER_ONLY_BFF.some((base) => p === base || p.startsWith(`${base}/`));
}

/** 회사 세션이 열면 /geo 로 보낼 주소인가 — 첫 화면(/) 이나 막힌 화면 */
export const sendsToCompanyHome = (pathname: string): boolean => pathname === "/" || isOwnerOnlyPage(pathname);

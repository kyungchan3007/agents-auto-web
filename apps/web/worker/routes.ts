// Worker 를 먼저 지나는 경로 (작업 0189) — 페이지 HTML · robots · sitemap(방문 집계) · /bff/*(API 프록시)
//   나머지(이미지 · 스크립트 · 글꼴)는 Worker 없이 정적 자산으로 바로 → 요청 수가 Pages Functions 때와 같음
//   apps/web/wrangler.jsonc 의 assets.run_worker_first 와 같아야 함 (routes.test.ts 가 검사)
export const WORKER_FIRST_ROUTES = [
  "/",
  "/currencies",
  "/currencies/*",
  "/prices",
  "/calc",
  "/log",
  "/about",
  "/geo",
  "/how",
  "/robots.txt",
  "/sitemap.xml",
  "/bff/*",
] as const;

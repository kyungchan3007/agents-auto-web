// 운영 사이트 BFF 경로표 — 읽기 경로만 · [경로, 캐시 초] (작업 0189 · 0312 에 어드민 경로는 apps/admin 으로)
//   쓰기(POST /activity) · 관리(/fx/collect · /prices/collect)는 넣지 않음
import type { BffRoute } from "@hav/edge/bff";

export const WEB_BFF_ROUTES: readonly BffRoute[] = [
  [/^\/fx\/latest$/, 300],
  [/^\/fx\/[A-Za-z]{3}\/history$/, 300],
  [/^\/signal(\/[A-Za-z]{3})?$/, 300],
  [/^\/prices\/levels$/, 300],
  [/^\/indicators\/[a-z0-9-]+:[A-Za-z0-9-]+$/, 300], // 공용 시계열 (과세환율 등 · 작업 0163)
];

// 어드민 BFF 경로표 — 읽기 경로만 · [경로, 캐시 초] (작업 0189 · 0312 에 운영 Worker 에서 옮김)
//   쓰기(POST /activity)는 넣지 않음 — 작업 기록은 훅만 씀
import type { BffRoute } from "@hav/edge/bff";

export const ADMIN_BFF_ROUTES: readonly BffRoute[] = [
  [/^\/activity$/, 3], // 작업실 실시간 기록
  [/^\/tasks$/, 60], // 지난 작업 · 작업 이름 (GitHub Actions 가 저장)
  [/^\/geo$/, 300], // GEO 측정 — API 가 1시간 구간 캐시 (작업 0129)
  [/^\/ig$/, 300], // 인스타 성과 — API 가 1시간 구간 캐시 (작업 0323)
  [/^\/status$/, 60], // 사이트 상태 점검판 — API 가 5분 구간 캐시 (작업 0105)
];

# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- **Worker 진입점** `apps/web/worker/index.ts`
  - `/bff` · `/bff/*` → `handleBff(request, env.API)` (기존 `src/bff/proxy.ts` 그대로)
  - 그 밖 → `trackVisit({ request, env, next: () => env.ASSETS.fetch(request), waitUntil })` (기존 `src/bff/track-visit.ts` 그대로 · 응답을 먼저 만들고 기록은 뒤에서)
  - 타입은 구조적으로 직접 적음 (새 의존성 없음 — package-lock 안 건드림)
- **어떤 요청이 Worker 를 먼저 지나는지** — `assets.run_worker_first` 에 지금 `_routes.json` 의 include 목록을 그대로 (나머지 이미지 · 스크립트는 Worker 없이 자산으로 바로 → 요청 수 · 비용이 지금과 같음)
  - 목록은 `worker/routes.ts` 한 곳에 두고, 테스트가 `wrangler.jsonc` 와 `_routes.json` 이 이 목록과 같은지 검사
- **설정** `apps/web/wrangler.jsonc` (새 파일 · 보호 파일)
  - `name: flapfx` · `main: worker/index.ts` · `compatibility_date: 2026-10-01`
  - `assets: { directory: "out", binding: "ASSETS", html_handling: "auto-trailing-slash", not_found_handling: "404-page", run_worker_first: [...] }`
  - `d1_databases: DB → hav-db` · `services: API → tripfx-api` (루트 Pages 설정과 같은 값)
  - `workers_dev: true` · `preview_urls: true` · `observability.enabled`
- **운영 빌드 지킴** — `mustHave` 가 Pages(`CF_PAGES=1` · `CF_PAGES_BRANCH=main`) 또는 Workers Builds(`WORKERS_CI=1` · `WORKERS_CI_BRANCH=main`)일 때 멈춤 · `turbo.json` passThroughEnv 에 두 변수 추가
- **Workers Builds 대시보드 값** (사람이 입력, 이 문서에 기록)
  - 루트 디렉터리: 비움 · 빌드 명령: `npx turbo run build --filter=@hav/web` · 배포 명령: `npx wrangler deploy --config apps/web/wrangler.jsonc` · 버전(미리보기) 명령: `npx wrangler versions upload --config apps/web/wrangler.jsonc`

## 대안 · 트레이드오프
- Pages 프로젝트 이름만 바꾸기 — 코드 변경 없음 · 사용자가 Workers 로 새로 시작하기를 골라 제외.
- `run_worker_first: true`(모든 요청이 Worker) — 단순하지만 이미지 · 스크립트 요청까지 Worker 를 지나 요청 수가 크게 늘어 제외.
- OpenNext(SSR) — 정적 내보내기를 유지하므로 필요 없음.
- `functions/` 를 지우고 한 번에 옮기기 — 전환 중 지금 Pages 가 멈추므로 다음 작업으로.

## 파일 계획
- apps/web/worker/**
- apps/web/wrangler.jsonc
- apps/web/src/shared/api.ts
- apps/web/src/shared/api.test.ts
- turbo.json
- docs/architecture.md
- .agents/specs/0189-workers-flapfx/**

## 계획 밖 변경 이유

## 위험
- `run_worker_first` 패턴 문법이 `_routes.json` 과 다르면 방문 집계가 빠지거나 넓어짐 → 테스트 · 로컬 `wrangler dev` 로 확인
- `html_handling` 이 Next 정적 내보내기(`currencies.html` · `currencies/USD.html`)와 다르게 주소를 만들면 404 → 로컬에서 주요 주소 확인
- Workers 무료 요청 한도(하루 10만) — HTML · `/bff` 만 Worker 를 지나서 지금 Pages Functions 와 같은 수준
- 보호 파일(`wrangler.jsonc` · `turbo.json`) — 사람 승인 필요

## 검증 계획
- 단위: `worker/index.test.ts` (경로 나눔 · 방문 기록 · 자산 넘김) · `worker/routes.test.ts` (목록 일치) · `api.test.ts` (Workers Builds 지킴)
- 로컬: `next build` 결과로 `wrangler dev --config apps/web/wrangler.jsonc` → 홈 · /currencies/USD · /bff/fx/latest · 없는 주소(404) · /opengraph-image 머리글
- Full 게이트

## 계획과 달라진 점

# Trace — 과정 기록

> 판단과 이유를 작업하면서 남긴다. 나중에 재구성하지 않는다

| 순서 | 단계 | 한 일 | 판단 · 이유 |
| --- | --- | --- | --- |
| 1 | 확인 | Cloudflare "Pages 만들기" 에서 저장소가 tripfx 에 "사용 중" 이라 고를 수 없음 · "Workers 만들기" 에서는 고를 수 있음 | 같은 저장소로 새로 시작하려면 Workers 뿐 → 사용자가 "Workers 로 새로" 선택 |
| 2 | 조사 | 지금 사이트의 Pages 전용 부분: `functions/_middleware.ts`(방문 집계) · `functions/bff/[[path]].ts`(API 프록시) · `public/_routes.json` · 맨 위 `wrangler.jsonc`(pages_build_output_dir) · `mustHave`(CF_PAGES) | 이 넷만 Worker 로 옮기면 화면 코드는 그대로 |
| 3 | 설계 | 진입점 `apps/web/worker/index.ts` 가 기존 `proxy.ts` · `track-visit.ts` 를 그대로 부름 · `run_worker_first` 는 `_routes.json` 목록 그대로 | 로직은 이미 테스트가 있음 → 진입점은 나눔만 · 이미지 · 스크립트는 Worker 를 안 지나게 해 요청 수 유지 (Cloudflare 문서: run_worker_first 는 배열 · glob 지원) |
| 4 | 설계 | 설정은 `apps/web/wrangler.jsonc` · 배포 명령에 `--config` | 맨 위 `wrangler.jsonc` 는 Pages 설정이라 기본 `wrangler deploy` 가 읽으면 실패 · 전환 중 옛 Pages 를 멈추지 않으려고 남김 |
| 5 | 구현 | `mustHave` 에 Workers Builds 조건(WORKERS_CI · WORKERS_CI_BRANCH) · turbo passThroughEnv | Workers Builds 기본 환경 변수 (Cloudflare 문서 확인) — 없으면 운영 빌드가 API 실패 때 "자료 없음" 사이트를 배포할 수 있음 |
| 6 | 검증 | 단위 8개(진입점 5 · 경로 일치 3) + api 지킴 1 · 기존 `out/` 으로 `wrangler dev` | 로컬: 페이지 · /currencies/USD · /flights · robots · sitemap 200, 없는 주소 404(404.html), /opengraph-image image/png · 하루 캐시, manifest 형식 정상, /bff/nope 404 JSON, /bff/fx/latest 503(로컬에 API Worker 없음 — 예상) |
| 7 | 게이트 | Full: typecheck · lint · test(web 643) · build · e2e 233 PASS · 보호 파일 2개(`apps/web/wrangler.jsonc` · `turbo.json`) 승인 대기 | 보호 파일은 사람이 harness-approved 라벨 |

## 허점
- 옛 Pages 설정과 새 Worker 설정이 한동안 함께 있음 → 경로 목록이 어긋나지 않게 `routes.test.ts` 가 세 곳(routes.ts · wrangler.jsonc · _routes.json)을 비교. 옮긴 뒤 옛 설정을 지울 때 이 테스트도 함께 고쳐야 함.
- 로컬에서는 서비스 바인딩(API)을 확인할 수 없음 → 머지 뒤 Workers 미리보기 · 운영에서 /bff 확인이 남음.

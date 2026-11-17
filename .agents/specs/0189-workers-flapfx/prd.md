# PRD — 무엇을 · 왜

> 원문(request.md)을 옮긴 파생 문서. 요구 충족 판정 기준은 언제나 원문이다

## 문제
- 사이트는 Cloudflare Pages 프로젝트 `tripfx` 에서 나가고, `flapfx.com` 도 그 프로젝트에 붙어 있다.
- 사용자는 `tripfx.pages.dev` 를 완전히 끊고, `flapfx.com` 을 새 Cloudflare **Workers** 프로젝트로 시작하려 한다 (나중에 어드민 페이지도 여기에).
- 새 Workers 화면에서는 같은 저장소를 고를 수 있지만, 지금 사이트는 Pages 전용 기능(`functions/` · `_routes.json` · 루트 `wrangler.jsonc` 의 `pages_build_output_dir`)에 기대고 있어 그대로는 Worker 로 배포되지 않는다.

## 목표
- 같은 저장소에서 `npx wrangler deploy --config apps/web/wrangler.jsonc` 로 사이트를 Worker(`flapfx`)로 배포할 수 있다.
  - 정적 화면: `apps/web/out` 을 Workers 정적 자산으로
  - `/bff/*`: 지금과 같은 읽기 전용 프록시(서비스 바인딩 `API` → `tripfx-api`)
  - 페이지 방문 집계: 지금과 같은 경로에서 `geo_hits` 기록(D1 `DB`)
  - `_headers`(공유 이미지 · 웹 앱 설명서 형식)가 그대로 적용
- 운영 빌드 지킴(`mustHave`)이 Workers Builds 에서도 main 빌드일 때 동작한다.
- 전환 기간에 지금 Pages(`tripfx` · `flapfx.com`)는 멈추지 않는다.

## 비목표
- 사이트 안 이름 · 기준 주소(`SITE_URL`) 바꾸기 — #212 에서 따로.
- `tripfx` Pages 프로젝트 삭제 · `functions/` · `_routes.json` · 루트 `wrangler.jsonc` 지우기 — Worker 로 옮긴 뒤 따로 (지금 지우면 전환 중 사이트가 멈춤).
- API Worker(`tripfx-api`) 이름 · 주소 바꾸기.
- 어드민 페이지.

## 애매한 곳
- Workers Builds 루트 디렉터리는 저장소 맨 위, 배포 명령은 `--config apps/web/wrangler.jsonc` (가정: 루트 `wrangler.jsonc` 는 Pages 설정이라 `wrangler deploy` 기본값이 그 파일을 읽으면 실패)
- 방문 집계 경로는 지금 `_routes.json` 과 같게 둔다 (가정: `/flights` 는 지금도 빠져 있음 — 그대로 유지, 바꾸면 집계 기준이 달라짐)
- 미리보기: Workers Builds 의 브랜치 빌드는 버전 업로드 + 미리보기 주소 (가정: `preview_urls: true`)

## 완료 기준
- [x] bash .agents/checks.sh PASS (보호 파일은 harness-approved 라벨로 승인 — 로컬은 이 항목만 FAIL)
- [x] Worker 진입점 단위 테스트: `/bff/*` → 프록시, 페이지 → 자산 + 방문 기록, 그 밖 경로 → 자산만
- [x] 로컬에서 `wrangler dev`(정적 자산 + Worker)로 홈 · 통화 페이지 · `/bff/fx/latest` · 404 · `_headers` 확인
- [x] Full 게이트(build · e2e) 통과 — e2e 233
- [ ] 머지 뒤 사용자와 Cloudflare 에서 Workers 프로젝트를 만들고 `flapfx.com` 을 옮겨 운영 확인

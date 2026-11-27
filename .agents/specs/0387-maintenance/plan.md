# 계획

## 무엇을 · 왜
- 사고 때 명령 하나로 운영 사이트(flapfx.com · www)에 띄우는 점검 화면(503). 사이트 빌드 · 데이터 · D1 · API 와 따로 서서 사이트가 어떻게 깨져도 뜸. 지금 운영에 켜지 않음 · 시험만.
- 묶음 `apps/web/maintenance/` (사이트 src · 빌드 밖):
  - `index.html`: 확정 시안(mockup/mockup.html) 그대로 · 외부 파일 없음.
  - `worker.ts`: 모든 요청(/robots.txt 포함)에 index.html 을 503 + `Retry-After: 3600` + `Cache-Control: no-store` + `content-type: text/html; charset=utf-8`. HTML 은 `import html from "./index.html"`(wrangler 기본 규칙이 .html 을 글로 묶음 · 설정 파일 필요 없음). 응답 만드는 부분은 순수 함수로 떼어 단위 테스트.
  - `on.mjs` · `off.mjs`(또는 한 파일): 
    - 켜기: 지금 배포된 버전 ID 를 먼저 읽어 화면에 찍고 `.tmp/maintenance-prev.txt` 에 남김 → `wrangler deploy apps/web/maintenance/worker.ts --name <대상> --compatibility-date 2026-10-01` (설정 파일 없이 인자만 · 사이트 wrangler.jsonc 는 쓰지 않음 · routes 를 주지 않아 붙은 도메인은 그대로).
    - 끄기: 남긴 버전 ID 로 `wrangler rollback <ID> --name <대상>` (없으면 바로 전 배포로 되돌린다고 알리고 확인).
    - 대상 이름은 인자/환경 변수로 받고 기본값은 운영(agents-auto-web) · 운영이면 "운영에 켭니다" 확인을 묻고 `--yes` 로 건너뜀(사고 때 빠르게). 시험은 반드시 다른 이름(예 flapfx-maint-test · workers.dev)으로.
  - 루트 package.json: `maintenance:on` · `maintenance:off`.
- 문서: `docs/maintenance.md` — 언제 켜는지 · 켜기 · 끄기 · 확인(curl -I 로 503 · Retry-After) · 주의(켜 둔 동안 main 에 푸시하면 Workers Builds 가 정상 사이트로 다시 배포해 점검 화면이 내려감 · 사이트 데이터 다시 만들기 예약도 같음).
- 휴대폰에서 켜기(GitHub Actions 수동 실행): `.github/workflows/**` 는 보호 파일이라 이번에 만들지 않음 → docs 에 워크플로 초안과 필요한 것(Cloudflare API 토큰 Secret · Workers 편집 권한)을 적고, 사람 승인 뒤 따로.
- 비밀값 · 토큰은 코드 · 로그 · 문서에 쓰지 않음.

## 파일 계획
- builder: apps/web/maintenance/{index.html,worker.ts,…스크립트} · package.json(scripts 두 줄) · docs/maintenance.md
- test: apps/web/maintenance/*.test.ts(응답 순수 함수) · 점검 화면 반응형 측정(320~1600 · 넓은 글꼴 · 둘째 문장 새 줄) · 켜기/끄기를 시험 이름 Worker 에서 한 번(운영 이름 금지) · spec 을 새로 쓰면 .agents/e2e-map.json 에도
- .agents/specs/0387-maintenance/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate)
- [ ] develop 머지까지(main 반영은 사용자가 말할 때) · 운영에 켜지 않음 · 릴리스 없음

## 허점

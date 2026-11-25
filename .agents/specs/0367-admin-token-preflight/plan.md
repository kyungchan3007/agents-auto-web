# 계획

## 무엇을 · 왜
- Workers Builds 가 develop · task 브랜치 푸시마다 flapfx-admin 에 미리보기 버전을 올리면 "최신 버전 ≠ 운영 배포 버전"이 되어 `wrangler secret put ADMIN_TOKENS` 가 실패한다(11-23 · 11-25). 0329 는 안내와 `--versions` 만 넣어서 사용자가 배포 명령을 따로 쳐야 한다.
- 고침: `admin:token add | remove | init` 이 비밀값을 넣기 전에 Worker 별(어드민 · 비밀값을 넣는 API 도 같은 방식)로 아래 순서를 밟아 한 번의 명령으로 끝낸다.
  1. 최신 버전 = 운영 배포 버전(100%)이면: 지금처럼 `secret put`.
  2. 다르면: 최신 버전의 코드가 운영 배포 버전의 코드와 같은지 판정한다.
     - 같으면: `wrangler versions secret put` 으로 새 버전을 만들고(최신 버전 바탕 · 코드 같음), 그 새 버전 하나만 `wrangler versions deploy <새 버전>@100% --yes` 로 배포한다. 배포 뒤 운영 배포 버전 = 새 버전인지 다시 확인한다.
     - 다르거나 판정할 수 없으면: 비밀값을 넣지 않고 멈춘다. 한국어로 이유(미리보기 코드가 운영과 다름)와 할 일(운영 반영 뒤 다시 실행 · 대시보드 배포)을 알린다. 운영 코드가 바뀌는 배포는 하지 않는다.
- 코드 같음 판정: `wrangler versions view <id> --json`(또는 `versions list --json`) 결과에서 스크립트 내용을 나타내는 값(예: resources.script.etag 같은 내용 해시)을 비교한다. 어떤 필드가 있는지는 node_modules/wrangler 소스 · 타입에서 확인하고 plan 의 "정한 것"에 적는다. 그런 값이 없으면 판정 불가 → 멈춤(가정으로 배포하지 않음).
- 비밀값 묶음 주의: `versions secret put` 은 최신 버전의 비밀값을 이어받는다. 새로 넣는 ADMIN_TOKENS 는 이번 값이고, 다른 비밀값 이름 목록이 운영 배포 버전과 같은지(이름만 · 값은 읽지 않음) 비교해 다르면 멈춘다. 오래된 버전을 배포하는 경로는 만들지 않는다.
- 판정(버전 목록 · 배포 상태 JSON → 할 일)은 scripts/admin-token-lib.ts 의 순수 함수 · 명령 파일은 wrangler 호출과 출력만. 비밀값 · 토큰 값은 출력 · 파일 · 로그에 남기지 않는다(링크 한 번 출력은 그대로).
- `--versions` 는 남겨 둔다(수동 경로).
- 작업 종류 ③: 판정 함수 · wrangler 인자 단위 테스트. 실제 Cloudflare 에 대고 돌리지 않는다.

## 애매한 곳
- wrangler `versions view --json` 의 내용 해시 필드 이름 (builder 가 소스로 확인 · 없으면 판정 불가로 멈춤)
- 운영 배포가 둘로 나뉜(점진 배포) 상태면 판정 불가로 멈춤 (가정)

## 정한 것
- (builder 가 확인한 필드 이름 · 근거 파일을 여기 적음)

## 파일 계획
- scripts/admin-token.mjs · scripts/admin-token-lib.ts (builder)
- apps/admin/worker/gate/admin-token-lib.test.ts (test)
- docs/architecture.md 의 admin:token 사용법 한두 줄 (builder)
- .agents/specs/0367-admin-token-preflight/** · .agents/orchestration/TASKS.md (lead)

## 계획 밖 변경 이유
- scripts/** 는 team.md builder 범위 밖이지만 0326 · 0329 관리 명령의 이어짐이라 lead 가 builder 에게 맡김

## 완료 기준
- [ ] 판정: 같음 → secret put · 다르고 코드 같음 → versions secret put + 새 버전만 배포 · 코드 다름 / 판정 불가 / 비밀값 이름 다름 / 점진 배포 → 멈춤(비밀값 안 넣음)
- [ ] 출력 · 로그에 비밀값 · 토큰 값 없음
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)

## 허점
- 실제 Cloudflare 상태로 돌려 보지 않는다. 첫 실사용 때 사용자가 결과를 알려 주어야 확인된다.

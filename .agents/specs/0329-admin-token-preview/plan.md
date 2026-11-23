# 계획

## 무엇을 · 왜
- Workers Builds 가 develop 푸시 때 새 버전을 올리기만(미리보기) 하면, 최신 버전이 운영에 배포되지 않은 상태가 된다. 이때 `wrangler secret put` 은 "최신 버전이 배포되지 않음" 오류로 실패하고, `npm run admin:token` 은 wrangler 출력 끝 세 줄만 보여 사용자가 이유를 알기 어렵다(11-23 init 실패)
- 고침:
  1. wrangler 실패 문구가 "최신 버전이 배포되지 않음" 종류면, 이유와 해결을 한국어로 알림 — 해결: 운영에 배포된 버전이 최신이 되게 배포(대시보드 · `wrangler versions deploy <버전> --config <설정>`) 뒤 다시 실행 · 또는 `--versions` 로 새 버전에 비밀값을 넣고 그 버전을 배포
  2. 선택 `--versions`: `wrangler versions secret put` 으로 넣음(새 버전을 만들 뿐 배포하지 않음 · 출력에 그 버전을 배포하라고 알림)
- 판정(오류 문구 → 종류)은 scripts/admin-token-lib.ts 의 순수 함수 · 명령 파일은 출력만
- 작업 종류 ③ — 판정 함수 단위 테스트 · 어드민 · 도구만 → 변경 기록 없음

## 애매한 곳
- wrangler 의 정확한 오류 문구는 판정에서 여러 표현("latest version" · "not deployed" · "gradual deployment" 등)을 넓게 봄 (가정)

## 파일 계획
- scripts/admin-token.mjs · scripts/admin-token-lib.ts (builder)
- apps/admin/worker/gate/admin-token-lib.test.ts (test)
- .agents/specs/0329-admin-token-preview/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- scripts/** 는 team.md builder 범위 밖이지만 0326 관리 명령의 이어짐이라 lead 가 builder 에게 맡김

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)

## 허점
- 0326 은 비밀값 넣기를 실제 Cloudflare 상태(미리보기만 최신)로 돌려 보지 않았다

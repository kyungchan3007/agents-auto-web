# 계획

## 무엇을 · 왜
- Worker 예약 요일 `1-5` 를 `MON-FRI` 로 바꾼다.
- 근거: Cloudflare 대시보드(tripfx-api → 설정 → 트리거 이벤트)가 `0 3 * * 1-5` 를 "Sunday through Thursday" 로 표시하고, 2026-11-06(금) 다음 실행을 11-08(일)로 잡았다. Cloudflare 는 요일 숫자를 1=일요일로 센다. 그래서 매주 금요일 12:00 · 13:30 · 15:00 예약이 돌지 않았다 (2026-10-30 · 11-06 누락 모두 금요일).
- 배포 시각 확인 스크립트(`cron-window.mjs`)가 일반 cron 규칙(1=월요일)으로 계산해서 테스트가 이를 잡지 못했다. 스크립트를 Cloudflare 규칙(이름 SUN-SAT · 숫자 1=일요일)으로 맞추고, 예약 요일에 숫자를 쓰지 못하게 테스트로 막는다.

## 애매한 곳
- 보호 파일 `apps/api/wrangler.jsonc` 수정 (확인됨: 사용자 승인 "승인, 고쳐줘")
- 예약 실행 때 `controller.cron` 이 설정한 글자 그대로 들어온다 (가정 · 배포 뒤 대시보드와 다음 예약 기록으로 확인)
- GitHub Actions 예약의 `1-5` 는 일반 cron 규칙(1=월요일)이라 그대로 둔다

## 파일 계획
- apps/api/wrangler.jsonc
- apps/api/src/index.ts
- apps/api/src/cron-window.test.ts
- apps/api/scripts/cron-window.mjs
- apps/api/src/features/status/status.ts
- apps/api/src/features/status/status.test.ts
- .agents/specs/0138-cron-weekday/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 배포 뒤 Cloudflare 대시보드에 "Monday through Friday" 로 표시

## 허점
- 예약 문자열을 검사하는 테스트가 Cloudflare 가 아닌 일반 cron 규칙으로 계산해서, 설정과 실제 실행 요일이 다른 것을 놓쳤다. → 판정 함수를 Cloudflare 규칙으로 바꾸고, 숫자 요일을 금지하는 테스트를 추가했다.
- 같은 누락이 두 번(10-30 · 11-06) 나올 때까지 원인을 "배포 직후"로 잘못 짚었다. 실제 실행 요일은 대시보드의 다음 실행 시각으로 확인할 수 있었다.

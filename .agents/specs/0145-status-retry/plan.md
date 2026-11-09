# 계획

## 무엇을 · 왜
- 상태 점검판의 재시도 회차 판정을 실제 재시도 조건(작업 0121: 오늘 공식 값이 있으면 건너뜀)과 맞춘다. 지금은 예비 값만 있어도 "필요 없음"으로 보여 2026-11-09 처럼 재시도가 남아 있는데도 끝난 것처럼 보인다.
- 오늘 값이 예비 출처뿐이면 맨 위 한 줄을 "정상"이 아니라 경고로 바꾼다 (#128: 화면이 정상으로 보여 4일간 알아채지 못함).

## 애매한 곳
- 예비 값만 있을 때 문구 — "오늘 환율은 예비 출처 값입니다 · 수출입은행 값을 다시 받는 중" (가정)

## 파일 계획
apps/api/src/features/status/store.ts
apps/api/src/features/status/status.ts
apps/api/src/features/status/status.test.ts
apps/web/src/features/log/lib/status-text.ts
apps/web/src/features/log/lib/status-text.test.ts
.agents/specs/0145-status-retry/**

## 계획 밖 변경 이유

## 완료 기준
- [x] bash .agents/checks.sh PASS
- [x] 예비 값만 있는 날 재시도 회차가 "예정"으로 보이는 테스트
- [x] 예비 값만 있는 날 맨 위 한 줄이 경고인 테스트

## 허점
- 작업 0121 에서 재시도 조건을 바꾸면서 같은 조건을 흉내 내는 상태 판정(store.ts firstRateAt)은 같이 바꾸지 않았다.

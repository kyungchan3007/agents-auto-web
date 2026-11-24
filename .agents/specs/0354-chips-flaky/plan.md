# 계획

## 무엇을 · 왜
- currency-chips.spec.ts:251(저장된 칩 첫 그림 깜빡임 없음 · CPU 6배 · lead 결정 0231)이 #409 에서 두 번 연속 실패. 11-23 부터 흔들림 후보였지만 이제 매번 실패해 main 을 막음.
- 먼저 이번 묶음 전 커밋(58a3381f)에서도 같은 조건으로 실패하는지 가른다. 이번 묶음(0345 통화 상세 FAQ · 0346 빈 상태 · 0347 칩 재배치) 뒤에 실패가 늘었으면 코드 원인(builder), 아니면 테스트 원인(test).
- currency-answer-faq.spec.ts:75(0345 새 테스트 · 휴대폰)가 두 번 흔들림 → 함께 안정화.
- 사용자 · lead 가 정한 조건(첫 프레임부터 틀린 칩이 안 보임)은 약하게 만들지 않는다.

## 파일 계획
- apps/web/e2e/** (test)
- apps/web/src/features/currencies/** (코드 원인일 때만 · builder)
- .agents/specs/0354-chips-flaky/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] #409 전체 e2e 통과

## 허점
-

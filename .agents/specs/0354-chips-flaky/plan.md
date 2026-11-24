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

## 판정
- currency-chips:251: 테스트 · 환경 원인(주). CI 기계가 느려 6배 늦춤이 실제로는 수십 배라 4초 안전장치(설계된 동작)가 걸림. 묶음 전(58a3381f)도 같은 조건에서 깨지고 지금은 4 ~ 5% 느려짐(번들 증가). → 기계 속도를 재어 '기준 기기의 6배'로 늦추게 고침 · 단언과 안전장치는 그대로.
- currency-answer-faq:75: 테스트 원인. 하이드레이션 전에 질문을 누르면 열림이 되돌려짐 → 하이드레이션 뒤에 누르게 고침. FaqList 의 아주 이른 클릭 현상은 급하지 않아 후보로 둠.

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] #409 전체 e2e 통과

## 허점
- 다른 spec(prices-route · prices-redesign · calc-design · flights-window)의 첫 시도 실패 · 재시도 통과도 느린 CI 가 원인일 수 있음. 흔들리는 e2e 후보 줄에 남김.

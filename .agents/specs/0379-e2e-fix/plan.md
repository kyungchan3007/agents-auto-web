# 계획

## 무엇을 · 왜
- main 반영 PR #448 (develop 4014be0f · run 45781435364) 전체 e2e 실패 5개를 고친다. test 조사 결과:
  1. currency-answer-faq.spec.ts:21: 0366 이 한 줄 답을 오늘 값 · 1년 평균으로 줄였는데 정규식은 옛 문장. 테스트 고침.
  2. detail-design.spec.ts:27: 평균 1444.0187 이 끝자리 0 생략 규칙(0287)으로 '1,444' → 자릿수 비교 실패. 테스트가 끝자리 0 생략을 허용하게.
  3. currency-fixes.spec.ts:82: 통화 전부를 도는 0366 테스트가 30초 한도 초과. 한도 조정 뒤 단언 통과 확인.
  4. currency-chips.spec.ts:192: 받은 값 미확인 · 로컬에서 돌려 원인 확인 뒤 테스트 또는 코드.
  5. calc-design.spec.ts:70 (@design · 휴대폰): 로컬에서 돌려 받은 값 확인 · 자료 때문이면 디자인 테스트 목록으로 미룸(verdict.md).
- 0366 은 develop PR(e2e 없음)로만 가서 main 전체 e2e 에서 처음 드러남.
- 코드가 원인이면 builder 에게 넘김.

## 파일 계획
- apps/web/e2e/{currency-answer-faq,detail-design,currency-fixes,currency-chips,calc-design}.spec.ts (test)
- 코드가 원인일 때: apps/web/src/features/currencies/** · packages/ui/src/lib/side-panel/** (builder · 이유 적음)
- .agents/specs/0379-e2e-fix/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] develop 머지 뒤 main 반영 PR #448 전체 e2e 통과

## 허점
- 0366 은 develop PR(e2e 없음)로만 가서 바뀐 문장 · 새 테스트가 main 전체 e2e 에서 처음 드러남. 화면 문장을 바꾸는 작업은 그 문장을 보는 spec 을 같은 PR 에서 고쳐야 함.
- ④ currency-chips:192 · ⑤ calc-design:70 은 재실행에서 재시도 뒤 통과(흔들림 · calc-chart:136 도). 훅이 바꾸지 않은 spec 로컬 실행을 막아 원인은 확인하지 못함. 고치지 않음.

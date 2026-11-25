# 계획

## 무엇을 · 왜
- 운영 반영 PR #430(여행 물가 흐름) 전체 e2e 실패를 고친다(run 45561451578).
- country-prices.spec:133 · route-tabs.spec:357: 의도된 변경(0361 에서 누르면 사이드바) → 테스트를 "누르면 사이드바(좁은 폭 시트) · HTML 에는 /prices/XXX 링크가 남음"으로(test).
- prices-route.spec:116 구간 높이 ≤ 800: 탭 줄 · 칩 줄이 더해져 늘었는지 시안(.tmp/prices-flow/sian-shots)과 비교해 판단. 시안대로면 기준을 새 구성에 맞게(test) · 과하면 코드(builder). 판단 근거 한 줄.
- focus-ring.spec:78 /prices 고리가 규칙과 다른 곳 1곳: 새 탭 · 칩 · 사이드바 버튼 중 하나 → 코드 수정(builder · 테스트 고치지 않음).

## 파일 계획
- apps/web/e2e/** (test)
- apps/web/src/features/prices/** · packages/ui/src/** (builder · 초점 고리 · 필요하면 높이)
- .agents/specs/0363-prices-flow-e2e/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] #430 전체 e2e 통과

## 허점
- 노선 · 사이드바 작업에서 연결표로 걸린 기존 spec(country-prices · prices-route · focus-ring)을 로컬 가드 때문에 main PR 에서야 돌림. 같은 구멍 세 번째(0351 · 0355 · 0363).

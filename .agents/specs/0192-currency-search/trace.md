# Trace — 과정 기록

> 판단과 이유를 작업하면서 남긴다. 나중에 재구성하지 않는다

| 순서 | 단계 | 한 일 | 판단 · 이유 |
| --- | --- | --- | --- |
| lead-1 | 계획 | request · prd · sdd 작성 | 공용 표 이동(경계 변경)이 있어 Full · 검색창은 0170 에서 빠졌고 계산 함수만 남은 것을 확인 |
| lead-2 | 맡김 | test 에게 테스트 먼저 → builder 구현 | Full 절차 · 기존 matchCurrency 는 그대로 두고 새 함수 |
| test-1 | 단위 테스트 | currency-search.test.ts · travel.test.ts(TRAVEL_CITIES) · intro flow.test.ts 를 공용 표 import 로 | 결과 모양 CurrencyHit{code,matches[{country,city?}]} 는 sdd 에 없어 테스트 머리글에 계약으로 적음 · 별도 worktree 의 참조 구현으로 통화 검색 단위 테스트 통과 확인 후 폐기 |
| test-2 | e2e | currency-search.spec.ts (콤보박스 속성 · 키보드 · 마우스/터치 · Esc · 결과 없음 · 인트로 꺼짐) | 화면 약속(data-testid=currency-search 등)을 머리글에 적음 · 빌드 반복 금지라 e2e 는 돌리지 않음(구현 뒤 확인) |
| builder-1 | 구현 | 도시 표를 travel.ts 의 TRAVEL_CITIES 로 이동 → searchCurrencies → 검색 훅 · 콤보박스 · 목록 위 배치 | 단계마다 커밋 · 순위는 코드 > 이름 > 나라 > 도시 > 가운데 · Enter 는 활성 줄이 없으면 첫 제안 · 결과 없음은 Enter 가 이동하지 않음 · 입력칸이 포커스를 잃지 않게 제안 목록은 mousedown 을 막음(마우스 · 터치 클릭 유지) |
| builder-2 | 정리 | intro-structure.test.ts 의 파일 목록에서 사라진 places.ts 를 뺌 | 옮김의 직접 결과 · 계획 밖 변경 이유에 적음 |
| builder-3 | 확인 | 빌드 한 번 · currency-search e2e 24건(넓은 화면 · 휴대폰) 통과 | 빌드 반복 금지 · Full 게이트가 전체 e2e 를 다시 돌림 |

## 허점
-

# Trace — 과정 기록

> 판단과 이유를 작업하면서 남긴다. 나중에 재구성하지 않는다

| 순서 | 단계 | 한 일 | 판단 · 이유 |
| --- | --- | --- | --- |
| 1 | 점검 | 파일별 줄 수 · 훅 수 · import 측정 | 화면 12개 혼재 · 훅 2개 · 직접 참조 1건 |
| 2 | 테스트 먼저 | role-boundary.test.ts 작성 | 화면 12개 · 훅 직접 사용 25건 · 직접 참조 1건 · 로직 파일에 섞인 훅 1건 실패 확인 |
| 3 | 공용 | use-query-param · use-freshness · use-outage-visible · signal-tone | 주소 값 읽기 2곳 · 신호 색 3곳 중복 제거 |
| 4 | 통화 | use-currency-list · use-converter · use-share · use-period-chart · use-favorites · list.ts · period-table | 저장소 접근을 순수 함수 파일에서 분리 |
| 5 | 계산기 · 물가 | use-calc-form · calc-result · use-budget-planner · use-price-bands · bands.ts | 면세 한도 숫자 200 · 150 이 화면에 있어 rules 값으로 교체 |
| 6 | 홈 | home-data.ts + 칸 5개 + use-active-step · trip-card | 237줄 → 조립 28줄 · 자료 가공을 테스트 가능하게 |
| 7 | 작업실 | use-status · use-pinned-scene · use-log-view · scenes · today-patches · deskProgress | 계산을 stage.ts 로 |
| 9 | e2e | 작업실 탭 제목 기대값을 현재 제목으로 | #118 이후 낡은 기대값 · Full 게이트에서 처음 드러남 |
| 8 | 소개 | 면세 규칙을 라우트에서 props 로 | 슬라이스 직접 참조 제거 · shared 로 옮기면 계산기 규칙의 주인이 흐려짐 |

## 허점
- Quick 루프는 e2e 를 돌리지 않아 #118 의 제목 변경이 e2e 를 깨도 몰랐음 — 머지 뒤 CI 반응형은 제목을 보지 않음

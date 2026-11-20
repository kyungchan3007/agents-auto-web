# Trace — 과정 기록

> 판단과 이유를 작업하면서 남긴다. 나중에 재구성하지 않는다

| 순서 | 단계 | 한 일 | 판단 · 이유 |
| --- | --- | --- | --- |
| 1 | lead · 문서 | request(작업서 원문) · prd · sdd | 새 cron 대신 기존 평일 03:00 회차 + 요일 판단 — wrangler.jsonc(보호) 를 세 번째로 건드리지 않음 |
| 2 | lead · 문서 | 도착지 8곳 vs 홈 4곳 차이 발견 | 원문이 공항까지 적은 8곳을 따름(가정) · claude-desktop 에 확인 요청 |

## R ↔ 테스트
| R | 테스트 |
| --- | --- |
| R1 구역 위치 | e2e `airfare-calendar.spec.ts` "R1 구역 위치" (window-section 바로 다음 형제 · 기존 hero 탑승권 그대로) |
| R2 라벨 · 제목 · 설명 · 칩 | e2e "R2 제목 위 라벨 · 제목 · 설명 한 줄 · 도시 칩" |
| R3 탑승권 | e2e "R3 탑승권" |
| R4 머리 문장 · 풀이 | e2e "R4 머리 문장 · 풀이 한 줄" · 단위 `packages/shared/src/domain/airfare.test.ts` (headline · bestSubline · pickedSubline · formatDay · weekdayLabel) |
| R5 날짜 띠 | e2e "R5 날짜 띠" · "R5 옆으로 밀기" · 단위 domain `priceTier`(아래 1/4 · 위 1/4) |
| R6 요일 막대 · 요약 | e2e "R6 요일별 평균 막대 · 요약 두 항목" · 단위 domain `weekdayAverages` · `cheapestWeekday` · `priceSpread` · `summaryFacts` |
| R7 안내 한 줄 | e2e "R7 맨 아래 한 줄" · 단위 domain `receivedNote` |
| R8 움직임 | e2e "R8 고른 날 표시 위치는 칸의 실제 픽셀 자리"(퍼센트 금지) · "날짜를 누르면 …" · "글자색 …"(파랑 위에서만 흰색) · "띠가 흘러가야 하면 …"(비행기 · 두 번째 비행) · "띠가 움직이지 않으면 …"(바로 파랑 · 비행기 없음) · "처음 화면에 들어올 때만 …"(떠오름 · 탑승권 · 막대) · "움직임 줄이기" — 크롬 · 사파리(`e2e/airfare.config.ts`) × 1280 · 390 |
| R9 수집 | 단위 api `serpapi.test.ts`(요청 · 8곳) · `due.test.ts`(월수금 · 그날 받은 도시 건너뜀 · 한 달 ≤ 104회) · `collect.test.ts` · `store.test.ts` · `routes.test.ts` · `scheduled-airfare.test.ts`(평일 첫 회차 · 새 cron 없음) · web `shared/airfare-api.test.ts` · 계약 `contracts/airfare.test.ts` |
| R10 지어내지 않음 | 단위 serpapi(가격 없는 날 버림 · 모양 다르면 오류) · collect(빈 결과 empty · 오류는 그 도시만) · store/routes(자료 없으면 `{fetchedOn:null,cities:[]}`) · 계약 · e2e "R10 자료 유무"("아직 받지 못했습니다" · 숫자 없음) |
| R11 고정 자료 · 키 | 단위 `fixtures/`(calendar.json · serpapi-nrt.json · e2e/fixtures · e2e/fixture-api.mjs) · collect "키 값을 남기지 않음" · `wiring.test.ts`(코드에 키 모양 없음 · 고정 자료 있음) |
| R12 보호 파일 두 곳 | 단위 `wiring.test.ts`(schema.ts · 마이그레이션 0011 · deploy-api.yml SERPAPI_KEY — 사람 승인 뒤에야 PASS) · PR 설명 · 승인 대기 · 라벨 없음은 lead 가 PR 에서 확인(테스트 불가) |

## 허점
-
- (test · 테스트 먼저) 이름 · 모양은 대부분 이 테스트의 가정이다(함수 이름 · testid · SerpApi 응답 모양 `calendar[].departure/return/price/has_no_flights/is_lowest_price`). 구현이 다르게 가면 테스트를 맞추는 쪽이 아니라 먼저 lead 에게 알린다.
- (test) CI 빌드는 운영 API 를 읽는데 운영 API 에는 아직 /airfare/calendar 가 없어, 고정 자료 e2e 는 CI 게이트에서 건너뜀(자료 조건). 고정 자료로 돌리려면 `e2e/fixture-api.mjs` + `AIRFARE_FIXTURE=1` 빌드 한 번이 필요하다.
- (test) 사파리(WebKit) 는 이 기기에 Playwright WebKit 이 없으면 실행하지 못한다 — 새 설정 `e2e/airfare.config.ts` 에 프로젝트로 넣어 둠.
- (test) 움직임 e2e(프레임 기록)는 구현 없이 쓴 것이라 구현 뒤 임계값(프레임 수 · 시간)을 한 번 점검해야 할 수 있다.

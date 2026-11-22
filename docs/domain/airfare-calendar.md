# 항공권 출발일 달력 (작업 0234)

여행 타이밍(`/flights`)의 "창밖 12달" 아래 구역. 인천 출발 1주 왕복의 출발일별 최저가를 보여 준다. 사용자 입력은 받지 않는다.

## 용어
| 용어 | 뜻 |
| --- | --- |
| 묶음 | 한 도시를 한 번 받은 결과(약 42일치 출발일) · 받은 날(`fetched_on`)로 구분 · 지우지 않고 쌓음 |
| 출발일 | 그날 떠나 1주 뒤 돌아오는 왕복의 최저가 한 줄 (출발일 · 돌아오는 날 · 원화 정수) |
| 가장 저렴한 날 | 한 도시 묶음 안에서 가격이 가장 낮은 출발일 (같으면 먼저 오는 날) |

## 불변식
| ID | 규칙 | 검사 |
| --- | --- | --- |
| AIR-01 | 받지 못한 날 · 도시는 숫자를 만들지 않는다 — 가격 없는 날은 버리고, 빈 결과 · 오류인 도시는 저장하지 않고 화면에서 칩을 뺀다 · 자료가 하나도 없으면 "아직 받지 못했습니다" | `serpapi.test.ts` · `collect.test.ts` · `store.test.ts` · e2e "R10" |
| AIR-02 | 수집은 월 · 수 · 금(한국 날짜)에만, 기존 평일 첫 회차에서. 그날 이미 받은 도시는 다시 부르지 않는다(재시도 회차 · 수동 실행) → 도시 8곳 × 한 달 약 13회 ≈ 104회 (무료 250회 안) | `due.test.ts` · `scheduled-airfare.test.ts` |
| AIR-03 | 요청은 인천(ICN) 출발 · 도착 공항 하나 · 기본 왕복(편도 type=2 금지) · gl=kr · hl=ko · KRW. 공항을 둘 이상 넣으면 빈 결과 | `serpapi.test.ts` |
| AIR-04 | 인증키(`SERPAPI_KEY`)와 전체 검색 주소는 코드 · 로그 · 실행 기록 · 문서에 쓰지 않는다 | `collect.test.ts` "키 값을 남기지 않음" · `wiring.test.ts` |
| AIR-05 | 응답 안의 글은 데이터로만 쓴다 — `departure` · `return` · `price` 만 꺼내고 나머지(메시지 · 구글 "싼 날" 표시)는 버린다 | `serpapi.test.ts` |
| AIR-06 | 가격 색 단계: 정렬한 뒤 q1 = s[⌊n·0.25⌋] · q3 = s[⌊n·0.75⌋] · 값이 q1 이하면 싼 편(파랑) · q3 이상이면 비싼 편(빨강) · 먼저 싼 편 판정 | `domain/airfare.test.ts` |
| AIR-07 | 화면은 빌드 때 `/airfare/calendar` 한 번만 읽는다 (브라우저가 부르지 않음 · BFF 허용 목록에 없음) — 도시별 가장 최근 묶음 하나만 | `routes.test.ts` · `wiring.test.ts` |
| AIR-08 | 한 회차에서 도시 하나가 실패해도 다음 도시는 계속 받는다 · 실패한 도시는 이전 묶음을 계속 보여 주고, 받은 날 한 줄은 그 묶음의 날짜 | `collect.test.ts` · `store.test.ts` |
| AIR-09 | 안내 한 줄은 "N월 N일에 받은 가격이며, 실제 결제 가격과 다를 수 있습니다." — 자료 제공처 설명 · 구글 링크 · 구글 "싼 날" 표시는 쓰지 않는다 (사용자 결정 11-20) | `domain/airfare.test.ts` · e2e "R7" |
| AIR-10 | 고른 날 표시 위치는 칸의 실제 픽셀 자리(퍼센트 금지) · 글자색은 파랑 표시와 같은 순간에만 흰색 · 움직임 줄이기는 바로 최종 상태 | e2e "R8" |

## 도착지 (8곳 · 달력 슬라이스 안에 따로 둠 · 홈 DESTINATIONS 와 별개)
- 도쿄 NRT · 오사카 KIX · 방콕 BKK · 파리 CDG · 다낭 DAD · 싱가포르 SIN · 뉴욕 JFK · 런던 LHR (`apps/api/src/features/airfare/serpapi.ts` AIRFARE_CITIES)

## 저장
- 표 `airfare_calendar` (airport · fetched_on · depart · return_date · price · fetched_at) · 기본 키 (airport, fetched_on, depart) · 같은 날 다시 받으면 덮어씀 · 지난 묶음은 남김(나중 누적 신호용)

## 담당 경로
| 경로 |
| --- |
| apps/api/src/features/airfare/** |
| packages/shared/src/contracts/airfare.ts |
| packages/shared/src/domain/airfare.ts |
| apps/web/src/features/travel-price/components/airfare-calendar/** |
| apps/web/src/features/travel-price/lib/airfare-*.ts |

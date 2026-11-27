# SDD: 나라 물가 요약 칸 · 환율 없음 안내

## 공통 부품으로 빼기(코드 구조: 2곳 이상은 공통 · 기능 폴더끼리 가져오지 않음)
- 0393 첫 페이지 숫자 칸(home/hero/hero-pick-facts.tsx · hero-pick.ts 의 pickFacts · 글래스 CSS)을 apps/web/src/shared/ 아래 공통 부품으로 옮긴다(예 shared/facts/: facts-card.tsx 그리기만 · facts.ts 순수 계산 · facts.css 글래스). 홈과 나라 물가가 둘 다 이걸 씀. 홈 쪽은 옮긴 것을 가져다 쓰고 모양 · 동작 · testid 는 그대로(기존 테스트 그대로 통과).
- role-boundary 허용 목록에 새 shared 경로가 필요하면 test 가 맞춤.

## 주는 통화인가 (지어내지 않음)
- 수출입은행에서 받는 통화 목록이 저장소에 이미 한 곳(API 수집 · shared 통화 목록 등)에 있으면 그걸 씀. 없으면 packages/shared 에 상수 한 곳(오늘 /fx/latest 22개 통화 · 기준과 출처를 주석에) — builder 가 먼저 찾고 plan 에 어느 쪽인지 적음.
- 판정: 그 나라 통화가 목록에 없으면 '제공 안 함' · 있는데 오늘 값이 없으면 '늦음'.

## 문구 (packages/shared/src/domain/fx-schedule.ts)
- emptyCopy 를 두 갈래로: 제공 안 함 → 제목 "{나라} 환율은 아직 제공되지 않습니다" · 늦음 → "오늘 환율을 아직 받지 못했습니다"(직구 계산 화면은 계산을 멈춘다는 뜻이 보이게 지금 제목 유지 여부를 builder 가 판단 · 개발자 문단은 지움).
- NOT_GIVEN 문단 · reason 의 수집 일정 설명 지움 · checkedAtText("자료 없음 · … 확인") 표시 지움(쓰는 곳에서 빼고 함수가 안 쓰이면 함수도 지움).
- FX_SCHEDULE_TEXT(소개 · 기준 페이지용 수집 일정 설명)는 '자료 없음' 안내가 아니라 사이트 소개라 그대로.

## 나라 물가 요약 칸
- prices/country: country-header(또는 country-page)에서 왼쪽 설명 아래에 공통 요약 칸 · 900 이상 머리 구역 grid 왼쪽 칸 · 899 이하 흐름.
- 값: 페이지가 이미 받는 latest · signals · priceLevels(새 API · 계약 변경 없음) · 90일 최저는 없음(0393 과 같음).
- 높이: 값 유무와 상관없이 칸 자리 고정(0393 원칙).

## 규칙(먼저 볼 것)
- tsx 로직 없음 · 기능 폴더끼리 가져오지 않음 · 토큰 · 다크 모드 없음 · 초점 고리 · 12px · '쌈' 낱말 금지 · 받지 못한 숫자 지어내지 않음.

## 파일 계획
- builder: apps/web/src/shared/facts/**(새로) · apps/web/src/features/home/hero/{hero-pick-facts.tsx,hero-pick.ts,hero.css}(옮긴 것 가져다 쓰기) · apps/web/src/features/prices/country/** · apps/web/src/app/prices/[code]/page.tsx · packages/shared/src/domain/fx-schedule.ts · 그것을 쓰는 곳(apps/web/src/app/{prices,calc,currencies/[code]}/page.tsx · features/prices/budget/use-budget-planner.ts · features/currencies/detail/currency-detail.tsx · features/import-calc/calc-page.tsx) · 필요하면 packages/shared 통화 목록
- test: shared/facts 단위 · fx-schedule 단위 · role-boundary 허용 목록 · apps/web/e2e/ 나라 물가 spec(새로면 e2e-map 에도) · 안내 문구를 보던 기존 spec(통화 상세 · 직구 계산 · 여행 물가)
- .agents/specs/0396-country-summary/** · .agents/orchestration/TASKS.md

## 순서
- test(단위 · e2e 먼저 · 이름 · testid 를 builder 에) ∥ builder → test(900 · 1124 · 1280 · 1440 빈자리 · 320~1600 · 넓은 글꼴 · 높이 고정 · 세 화면 안내 문구)

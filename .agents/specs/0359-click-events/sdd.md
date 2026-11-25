# SDD: 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 이벤트 이름(eventName 만으로 셈 · 맞춤 측정기준 없이): home_search_pick · home_country_link · country_next_fx · country_next_flight · country_next_budget · country_compare · country_all_prices · fx_other_open · fx_other_pick · faq_open_prices · faq_open_currency · empty_next. 이름 · 한국어 이름 · 있는 페이지 표는 packages/shared 한 곳(운영 · 수집 · 어드민이 같이 씀).
- 보내기: apps/web/src/shared/seo/analytics.ts 옆에 trackClick(name, params?) 공통 함수. analyticsEnabled(location.hostname) 일 때만 window.gtag('event', name, params). 매개변수는 고른 통화 · 나라 코드 정도만(개인정보 없음). 부품은 훅/함수만 부르고 tsx 에 로직 없음.
- 수집: apps/api/scripts/ga4-sync.ts 에 보고서 하나(차원 date · eventName · 지표 eventCount · totalUsers · 최근 28일 · eventName 은 위 목록으로 거름). 저장은 0349 처럼 스키마를 바꾸지 않고 team_snapshots 키 'ga4-click-events'(매일 덮어씀) · 보내기 시작한 날은 상수(운영 반영 날).
- API: GET /ga4 응답에 clicks 더함(계약 packages/shared).
- 어드민: features/traffic 에 표 하나 · 계산(하루 평균 · 기록 전)은 lib.

## 대안 · 트레이드오프
- 새 표 ga4_events: 스키마 · 마이그레이션(보호 파일 · 승인 대기)이라 고르지 않음.
- 이벤트 하나 + 매개변수(button=...): 맞춤 측정기준 등록이 필요해 고르지 않음.

## 파일 계획
- packages/shared/src/** (이벤트 표 · 계약)
- apps/web/src/shared/seo/** · apps/web/src/features/{home,prices,currencies,import-calc}/** (부르기만)
- packages/ui/src/components/** (FaqList · DataEmpty · OutlineLink 에 onClick 통로가 필요하면)
- apps/api/scripts/ga4-sync.ts · apps/api/src/features/ga4/**
- apps/admin/src/features/traffic/**
- .changeset/*.md (patch)
- *.test.ts · apps/web/e2e/** · apps/admin/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0359-click-events/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 위험
- 운영에서만 보내므로 미리보기로는 실제 전송을 볼 수 없음 → e2e 는 hostname 조건을 바꿔 window.gtag 호출을 확인.
- 첫 수집 전 어드민은 "자료 없음".

## 검증 계획
- 단위: 이벤트 표 · 운영에서만 보냄 · 보고서 → 행 · SQL · 하루 평균 · 기록 전.
- e2e: 각 버튼을 누르면 해당 이름으로 gtag 호출(운영 hostname 흉내) · 미리보기에서는 호출 없음 · 어드민 표(있음 · 없음).
- CI gate · main 대상 전체 e2e.

## 계획과 달라진 점

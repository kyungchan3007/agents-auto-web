# SDD: 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 수집: apps/api/scripts/ga4-sync.ts 에 보고서를 더한다.
  - 날짜별 사람 판별: 차원 date (+ 필요하면 deviceCategory · country) · 지표 activeUsers · sessions · engagedSessions · userEngagementDuration. 기기 · 국가는 상위 몇 개만(줄 수를 작게).
  - 인스타 유입: 지금 유입 경로 보고서(sessionSource · sessionMedium · sessionCampaignName)에서 source 가 instagram · l.instagram.com · ig 등이거나 utm_source=instagram 인 줄을 lib 에서 갈라 "인스타(링크)" · "인스타(utm)" 로 셈. 새 보고서가 필요 없으면 만들지 않는다.
- 저장: 0349 · 0359 처럼 스키마를 바꾸지 않고 team_snapshots 키(예: 'ga4-human')에 매일 덮어씀. 새 표 · 마이그레이션은 보호 파일이라 고르지 않는다.
- API: GET /ga4 응답에 사람 판별 값을 더함(계약 packages/shared).
- 어드민: features/traffic 에 "참여 세션 기준 사람 수" 열 · 인스타 유입 줄. 계산은 lib(view) · tsx 에 로직 없음.
- 받지 못한 값은 null → 빈 칸.

## 대안 · 트레이드오프
- 새 표 ga4_human: 스키마 · 마이그레이션 승인 대기라 고르지 않음.
- 자동 방문 판정 규칙(세션 1:1 등)을 코드로 세우기: 확인되지 않은 추측이라 하지 않고, 참여 세션 숫자만 보인다.

## 파일 계획
- apps/api/scripts/ga4-sync.ts · apps/api/src/** (GA4 계산 · /ga4 응답)
- packages/shared/src/** (GA4 계약)
- apps/admin/src/features/traffic/**
- *.test.ts · apps/admin/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0374-ga4-human/**

## 계획 밖 변경 이유

# SDD: 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 스키마를 바꾸지 않는다(작업서 고침). 새 표 · 새 열 대신 작업 0341 의 `team_snapshots`(key · body JSON · synced_at)에 두 키를 쓴다.
  - `ga4-page-engagement`: 매일 덮어씀. 최근 28일 pagePath 별 { path, views, sessions, engagementRate, bounceRate, viewsPerSession } 상위 N(페이지뷰 순 20).
  - `ga4-page-engagement-baseline`: `INSERT OR IGNORE` 로 처음 한 번만 씀. body 에 기준 기간(끝 날짜)을 함께 저장. 기준일 고정은 "이번 main 반영 전날까지의 28일" = 첫 수집이 main 반영 전에 돌면 그 값, 아니면 GA4 dateRanges 를 기준일로 끝나게 따로 한 번 요청.
- 수집: apps/api/scripts/ga4-sync.ts 에 보고서 하나 추가(차원 pagePath · 지표 screenPageViews · sessions · engagementRate · bounceRate · screenPageViewsPerSession). 출력 SQL 에 team_snapshots 쓰기를 더함. ga4-sync.yml 은 스크립트 출력 SQL 을 그대로 실행하므로 바꾸지 않는다.
- 지표 정의(GA4 Data API 측정기준 · 측정항목 문서): engagementRate = 참여 세션 ÷ 세션, bounceRate = 1 − engagementRate, screenPageViewsPerSession = 페이지뷰 ÷ 세션.
- API: 기존 GET /ga4 응답에 engagement · baseline 을 더함(packages/shared 계약). 어드민 키가 필요한 기존 경로 그대로.
- 어드민: features/traffic 에 표 하나. 계산(오르내림 · % 표시)은 lib, 그리기만 tsx, 받기는 기존 훅.

## 대안 · 트레이드오프
- ga4_pages 에 열 추가: 스키마 · 마이그레이션(보호 파일) 승인이 필요하고 오늘 밤 main 에 나갈 수 없어 고르지 않음.
- 새 표 ga4_page_engagement: 같은 이유.
- team_snapshots 는 이름이 "팀"이지만 키 → JSON 저장소라 그대로 쓰고, 키 이름과 이유를 이 문서와 schema 옆 주석 대신 store 코드 주석에 적는다.

## 파일 계획
- apps/api/scripts/ga4-sync.ts
- apps/api/src/features/ga4/**
- packages/shared/src/contracts/**
- apps/admin/src/features/traffic/** · apps/admin/src/app/traffic/**
- *.test.ts · apps/admin/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0349-traffic-engagement/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 위험
- 첫 수집 전에는 "자료 없음". 기준값이 운영 반영 뒤에 잡히면 비교가 흐려짐 → 기준 기간을 body 에 적어 화면에 보임.

## 검증 계획
- 단위: 보고서 → 행 · SQL(덮어쓰기 · 기준값 한 번만) · 오르내림 계산.
- 어드민 e2e: 자료 있음 · 없음 · 기준값 없음.
- CI gate.

## 계획과 달라진 점

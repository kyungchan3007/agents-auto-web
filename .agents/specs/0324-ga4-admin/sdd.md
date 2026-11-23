# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- gsc-sync 와 같은 길: 예약 워크플로 → 스크립트가 GA4 Data API runReport 를 읽어 SQL → wrangler d1 execute → API `GET /ga4` → 어드민 "유입" 탭
- 인증: 기존 서비스 계정 비밀값 GSC_SERVICE_ACCOUNT_JSON 그대로(새 비밀값 없음). apps/api/src/features/geo/gsc.ts 의 serviceJwt · accessToken 은 scope 가 Search Console 로 고정 → scope 를 인자로 받게 넓혀 GA4 는 `https://www.googleapis.com/auth/analytics.readonly` 로 (gsc 동작은 그대로)
- 속성 ID 565426291 은 공개해도 되는 식별자라 상수(GA4_PROPERTY_ID) · 비밀 아님
- 읽는 범위: 최근 28일(매일 다시 읽어 덮어씀 · GA4 는 며칠 뒤 값이 바뀜) · 403 이면 권한 문제로 요약에 남기고 실패(지어내지 않음)
- 표: ga4_daily(day, users, sessions, page_views) · ga4_sources(day, source, medium, campaign, sessions, users) · ga4_pages(day, path, views) — 키 (day, …) · upsert
- API: GET /ga4 (1시간 캐시) → 날짜별 · 경로별(기간 합) · 페이지별(기간 합)
- 어드민: 새 탭 "유입"(/traffic · 단축키 5) — 위 날짜별 표, 아래 유입 경로 표(인스타 UTM 이 보이게) · 많이 본 페이지 표 · 빈 값은 빈 칸 · 그래프는 자료가 쌓인 뒤 따로

## 대안 · 트레이드오프
- 알리기 탭 아래에 넣기: 인스타 성과와 함께 보이지만 탭이 길어짐 · GA4 는 검색 · 직접 방문도 포함이라 알리기만의 자료가 아님 → 새 탭
- GEO 탭에 넣기: Search Console 과 나란히지만 같은 이유로 새 탭

## 파일 계획
- 보호 파일 — 사용자 승인 필요(claude-desktop 에 한 번에 알림)
  - apps/api/src/db/schema.ts (표 3개 추가 · 기존 표 변경 없음) (builder)
  - apps/api/drizzle/migrations/0013_* · meta (새 파일 · drizzle-kit 이 고치는 meta) (builder)
  - .github/workflows/ga4-sync.yml (새로 · gsc-sync.yml 모양 · 비밀값 없으면 건너뜀) (builder)
- apps/api/src/features/geo/gsc.ts (scope 인자) · apps/api/src/features/ga4/** (응답 → 행 · SQL · summary · store · routes) · apps/api/src/index.ts 라우트 한 줄 (builder)
- apps/api/scripts/ga4-sync.ts (builder)
- packages/shared/src/contracts/ga4.ts · packages/shared/package.json exports · packages/shared/src/client/api.ts (builder)
- apps/admin/src/app/traffic/page.tsx · apps/admin/src/features/traffic/** · apps/admin/src/shared/nav/admin-pages.ts(탭 한 줄) · apps/admin/worker/bff-routes.ts(/ga4 한 줄) (builder)
- README.md 자동으로 도는 일 한 줄 · docs/geo-measurement.md GA4 절 (builder)
- 위 옆 *.test.ts · apps/admin/e2e/** · admin-pages.test 등 탭 목록 테스트 · .agents/e2e-map.json (test)
- 운영 사이트(apps/web)는 바꾸지 않음

## 계획 밖 변경 이유

## 위험
- 서비스 계정에 GA4 뷰어 권한이 없거나 Data API 가 꺼져 있으면 403 → 첫 실행 HTTP 코드로 확인 · claude-desktop 에 알림
- 키 유출 → 키 · 토큰은 환경 변수로만 · 오류 문구에서 지움

## 검증 계획
- 단위: runReport 응답 → 행 · SQL(빈 값 · 오류) · summary · scope 인자(gsc 그대로)
- e2e: 어드민 "유입" 탭(고정 응답 · 빈 칸 · 실패 · 빈 상태)
- 실제 호출: main 반영 뒤 워크플로 1회 · HTTP 코드

## 계획과 달라진 점
- (끝나고 채움)

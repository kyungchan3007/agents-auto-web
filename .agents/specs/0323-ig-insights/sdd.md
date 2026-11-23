# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 기존 `gsc-sync` 와 같은 길: 예약 워크플로 → 스크립트가 Instagram Graph API 를 읽어 SQL 을 만듦 → `wrangler d1 execute` 로 D1 저장 → API 가 읽어 어드민에 전달.
- 스크립트 `apps/api/scripts/ig-insights.ts`: ① 최근 게시물 목록(id · 시각 · 종류 · 주소) ② 게시물마다 reach · likes · saved · shares · views ③ 계정 지표를 하루 범위로 호출 ④ 응답이 오류이거나 값이 없는 지표는 행에 넣지 않음(빈 값) ⑤ SQL(upsert) 출력. 토큰은 환경 변수로만 받고 출력하지 않으며 오류 문구에서 지움.
- 테이블: `ig_media_insights(day, media_id, metric, value)` · `ig_account_insights(day, metric, value)` + 게시물 정보 `ig_media(media_id, posted_at, permalink, kind)`. 키는 (day, 대상, 지표) 로 하루 한 행 · 다시 돌리면 덮어씀.
- API: `GET /ig` (캐시 1시간) → 날짜별 · 게시물별 값. 어드민은 이 응답을 읽어 보여 줌.

## 대안 · 트레이드오프
- A) 세션이 매일 읽어 JSON 을 PR (geo-answers 방식): 비밀값 등록 불필요하지만 세션 · 맥이 켜져 있어야 하고 매일 PR 이 생김. 하루 한 번의 기계적 읽기라 맞지 않음.
- B) 워커 예약 실행(cron trigger): 서버 쪽에 토큰을 둬야 하고 wrangler 설정 변경 필요.
- C) (고름) GitHub 예약 워크플로: gsc-sync 와 같은 구조 · 토큰은 Secrets · 없으면 건너뜀.

## 파일 계획 (lead 확정 · 2026-11-23)
- 보호 파일 — 사용자 승인("시작하면될거 같아" · PR 에 harness-approved 라벨은 사용자가 닮)
  - apps/api/src/db/schema.ts (ig_media · ig_media_insights · ig_account_insights 표 추가 · 기존 표 변경 없음) (builder)
  - .github/workflows/ig-insights.yml (새로 · gsc-sync.yml 과 같은 모양 · IG_ACCESS_TOKEN 없으면 건너뜀) (builder)
  - GitHub Secrets 등록 끝(11-23 사용자): IG_USER_ID · IG_ACCESS_TOKEN 두 개만 씀 (IG_APP_SECRET 은 성과 읽기에 필요 없음 · 쓰지 않음)
- apps/api/drizzle/migrations/0012_*.sql 새 마이그레이션 (builder · 기존 파일 수정 없음)
- apps/api/scripts/ig-insights.ts + 순수 함수는 apps/api/src/features/ig/** (응답 → 행 · SQL · 토큰 지우기) (builder)
- apps/api/src/features/ig/** (GET /ig · 캐시 1시간) · apps/api/src/index.ts 에 라우트 한 줄 (builder)
- packages/shared/src/contracts/** 의 응답 타입 (builder)
- apps/admin/src/features/marketing/** (알리기 탭에 성과 표) (builder)
- 위 옆 *.test.ts · apps/admin/e2e/** · .agents/e2e-map.json (test)
- docs/geo-measurement.md 인스타 성과 절 (builder)
- 운영 사이트(apps/web)는 바꾸지 않음 — 어드민에만 (사용자 원문)

## 어드민 표시 (lead 결정)
- 알리기 탭 위쪽: 계정 지표 최근 하루 값(도달 · 조회 · 프로필 방문 · 웹사이트 클릭 · 반응한 계정)과 받은 날짜
- 그 아래 표: 게시물 한 줄씩(게시 날짜 · 게시물 링크 · 도달 · 좋아요 · 저장 · 공유 · 조회 · 받은 날짜)
- 받지 못한 값은 빈 칸(0 으로 채우지 않음) · 그래프는 자료가 쌓인 뒤 따로

## 계획 밖 변경 이유
- apps/api/drizzle/migrations/0012_ig_insights.sql · meta/0012_snapshot.json · meta/_journal.json — 보호 목록(apps/api/drizzle/migrations/**) 패턴. 새 파일 추가와 drizzle-kit 이 고치는 meta 만 · 기존 마이그레이션 수정 없음. 사용자가 승인한 스키마 변경("시작하면될거 같아")에 딸린 것으로 봄 · PR 라벨 때 함께 알림
- packages/shared/package.json(exports ./ig) · packages/shared/src/client/api.ts(api.ig) — 계약을 앱에 노출하고 브라우저가 받는 함수 한 줄
- apps/admin/worker/bff-routes.ts — 어드민 BFF 경로표에 /ig 한 줄(geo 와 같은 300초) · 없으면 /bff/ig 가 막힘
- (구현 때 채움)

## 위험
- 게시물 지표 정의가 바뀌거나 일부 지표가 계정 크기(팔로워 100 미만 등)에 따라 막힐 수 있음 → 오류는 빈 값으로 두고 요약에 남김.
- 토큰 유출: 응답 · 오류 문구에서 토큰 제거 + 테스트로 확인.
- `ig_*` 행이 쌓이는 만큼 D1 읽기 늘어남 → 90일 보관 · 어드민 응답 캐시.

## 검증 계획
- 단위: 응답 → SQL 변환(빈 값 · 오류 · 토큰 제거) 테스트.
- 게이트: bash .agents/checks.sh.
- 실제 호출: 읽기 전용 1회(값은 받은 대로 · 지금은 0).

## 계획과 달라진 점
- (끝나고 채움)

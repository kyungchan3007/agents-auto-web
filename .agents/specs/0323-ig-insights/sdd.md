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

## 파일 계획
- apps/api/scripts/ig-insights.ts (새로 · geo 범위 밖이라 lead 승인)
- apps/api/src/features/ig/** (새로 · 읽기 API · geo 범위 밖)
- D1 스키마 파일(기존 위치) — 보호 파일 해당 여부 확인 필요
- .github/workflows/ig-insights.yml — **보호 파일(사람 승인)**
- 어드민 표시 파일 — lead 와 정함(apps/admin/src/features/marketing/**)
- docs/geo-measurement.md 에 인스타 성과 절 추가

## 계획 밖 변경 이유
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

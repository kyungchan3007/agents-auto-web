# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 흐름: GitHub Actions `geo-ask.yml`(매일 05:00 KST) → `apps/api/scripts/geo-ask.ts` 가 질문 24개 × 키가 있는 서비스에 질문 → 응답에서 출처 주소만 골라 tripfx 여부 판정(`features/geo/ask.ts`) → SQL → `wrangler d1 execute` → `geo_answers` → `GET /geo` 의 `answers` → `/geo` 화면 "AI 답변 인용" 칸
- gsc-sync 와 같은 구조 (Actions 가 외부 API 를 부르고 D1 에 쓰고, Worker 는 읽기만). Worker 묶음에 SDK · 키가 들어가지 않는다
- Claude 는 공식 SDK(`@anthropic-ai/sdk`) · 웹 검색 `web_search_20260209` · `claude-opus-5-5` effort low · 서버 쪽 대체 모델(fallbacks "default") · pause_turn 은 최대 3번 이어서
- OpenAI · Perplexity 는 SDK 없이 fetch (각 서비스 공개 API) · 모델은 환경 변수 `OPENAI_MODEL` · `PERPLEXITY_MODEL` 로 바꿀 수 있음
- 판정: 주소의 hostname 이 `tripfx.pages.dev` 또는 그 하위 도메인 · 응답 본문 글은 보지 않음
- 저장 키 (day, engine, question) · 같은 날 다시 돌리면 덮어씀 · 90일 지난 행 삭제
- 계약: `GeoReport.answers` (nullable · default null) — 예전 응답도 그대로 읽힘

## 대안 · 트레이드오프
- Worker cron 에서 실행: 키를 Worker 비밀값으로 두고 실행 시간 제한 · 비용이 Worker 쪽에 붙음 → gsc-sync 와 같은 Actions 를 고름
- 답변 본문 저장: 분석에 쓸 수 있지만 외부 글을 공개 · 저장하게 됨 → 판정 결과만
- 앱 화면 측정(브라우저 자동화): 실제 사용자 화면에 가깝지만 로그인 · 봇 차단 · 약관 문제 → API 만

## 파일 계획
<!-- 보호 파일(사람 승인 필요): schema.ts · migrations · package-lock.json · .github/workflows/geo-ask.yml -->
- apps/api/src/db/schema.ts
- apps/api/drizzle/migrations/**
- apps/api/src/features/geo/**
- apps/api/scripts/geo-ask.ts
- apps/api/package.json
- package-lock.json
- packages/shared/src/contracts/geo.ts
- apps/web/src/features/geo/**
- .github/workflows/geo-ask.yml
- docs/geo-measurement.md
- README.md
- .agents/specs/0139-geo-ask/**

## 계획 밖 변경 이유

## 위험
- 사용료: 질문 24개 × 서비스 수 × 매일. Claude(Opus 5.5 · effort low · 검색 최대 3회)는 질문당 검색 요금 + 검색 결과 입력 토큰
- OpenAI · Perplexity 응답 모양이 문서와 다르면 판정이 늘 0 이 됨 → 해석 함수가 모르는 모양은 0 으로 두고 실패로 숨기지 않음. 키를 넣은 첫 실행 뒤 결과를 확인한다
- 키가 없으면 아무것도 저장하지 않으므로 화면은 "아직 측정한 기록이 없습니다"

## 검증 계획
- 단위 테스트: 주소 판정 · 서비스별 응답 해석 · 검색 오류 블록 · SQL 이스케이프 · 요약(최근일 · 실패 제외 · null)
- 스크립트를 키 없이 실행 → 세 서비스 모두 "측정하지 않음" · SQL 은 오래된 기록 삭제 한 줄
- 스크립트 타입 검사 (scripts 는 tsconfig 밖이라 따로 tsc)
- `bash .agents/checks.sh` (Full)
- 머지 뒤: 마이그레이션 적용 · `/geo` 응답에 `answers: null` · 화면 빈 상태

## 계획과 달라진 점

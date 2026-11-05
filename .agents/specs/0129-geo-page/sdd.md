# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- `functions/_middleware.ts` → `apps/web/src/bff/track-visit.ts`: 응답을 먼저 만들고 분류해 맞으면 `waitUntil` 로 D1 에 하루 · 종류 · 이름 · 페이지별 한 줄 더함
- `public/_routes.json`: HTML · robots · sitemap · /bff 만 함수로 — 이미지 · 스크립트는 무료 정적 응답 그대로
- 분류는 `@hav/shared/geo-visit` (zod 없음 · 함수 묶음을 가볍게) · 응답 계약은 `@hav/shared/geo`
- 읽기: API `GET /geo` (1시간 구간 캐시) → `/bff/geo` → `features/geo`
- 저장은 Pages 의 D1 바인딩으로 바로: 공개 쓰기 경로를 API 에 만들지 않음
- 운영 확인용 봇 이름 `Tripfx-Verify`: 저장하되 공개 수치에서 제외

## 봇 목록 근거
- [OpenAI](https://developers.openai.com/api/docs/bots) · [Anthropic](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) · [Perplexity](https://docs.perplexity.ai/guides/bots)
- Googlebot · bingbot 은 일반 검색 엔진으로 따로 묶음 (AI 전용 여부는 구별할 수 없음)

## 대안 · 트레이드오프
- API 쓰기 경로 + 토큰: 비밀값 등록이 필요하고 공개 경로가 늘어남 → D1 바인딩
- Analytics Engine: 조회가 복잡 · 지금 양에는 과함
- 서비스 바인딩 RPC: 설정과 로컬 시험이 복잡

## 파일 계획
- functions/_middleware.ts · wrangler.jsonc (보호 파일)
- apps/api/** (schema · 마이그레이션 보호 파일)
- packages/shared/**
- apps/web/**
- README.md · docs/**
- .agents/specs/0129-geo-page/**

## 계획 밖 변경 이유

## 위험
- 함수 호출 증가: HTML 만 · 무료 한도 하루 10만 건 · 어제 332건
- 위조 User-Agent 로 수치 왜곡 · 쓰기 증가: 페이지를 고정 목록으로 줄여 행 수 제한 · 수치에 추정치 표시
- 마이그레이션 전 배포: 표가 없어도 catch 로 페이지 정상

## 검증 계획
- 단위 테스트 · 게이트 Full · 운영 `Tripfx-Verify` 방문 확인 · 일반 방문이 저장되지 않음 확인

## 계획과 달라진 점
<!-- 구현하며 바뀐 결정과 이유 (끝나고 채움) -->

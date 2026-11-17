# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 이름 · 주소는 `apps/web/src/shared/site.ts` 한 곳(`SITE_URL` · `SITE_NAME`) — 페이지 제목에 박힌 "Tripfx" 문자열은 `SITE_NAME` 으로 바꾸지 않고 글자만 "플랩" (지금 구조 유지 · 범위 작게)
- 저장 키 · 이벤트: `packages/shared/src/domain/travel.ts` · `favorites.ts` · `intro/lib/entry.ts` 의 접두어 `tripfx:` → `flapfx:` (e2e · playwright 설정 같이)
- 확인 머리글: `packages/shared/src/domain/geo-visit.ts` 토큰 `flapfx-verify`
- 측정 판정: `apps/api/src/features/geo/ask.ts` `isTripfx` → `isOurSite` — flapfx.com · www.flapfx.com · `*-agents-auto-web.developfff.workers.dev`(미리보기) · `agents-auto-web.developfff.workers.dev`
- 옛 Pages 설정 삭제: 맨 위 `wrangler.jsonc` · `functions/` · `apps/web/public/_routes.json` → `worker/routes.test.ts` 에서 `_routes.json` 비교 삭제
- Worker 설정: `name: agents-auto-web` · `routes: flapfx.com · www.flapfx.com (custom_domain)` — 대시보드에 붙인 도메인을 설정이 원본이 되게

## 대안 · 트레이드오프
- 저장 키를 옛 키에서 옮겨 주기(마이그레이션) — 방문자가 거의 없고 사용자가 같이 바꾸기로 해서 하지 않음
- 로고를 한글 "플랩" — 디자인 변경이라 이번엔 글자만 주소와 맞춤

## 파일 계획
- apps/web/src/**
- apps/web/e2e/**
- apps/web/scripts/**
- apps/web/worker/**
- apps/web/public/_routes.json
- apps/web/wrangler.jsonc
- apps/web/playwright.config.ts
- apps/web/playwright.responsive.config.ts
- apps/api/src/features/geo/**
- packages/shared/src/domain/**
- packages/shared/src/contracts/geo.ts
- functions/**
- wrangler.jsonc
- .github/workflows/**
- README.md
- docs/**
- .agents/specs/0190-rename-flap/**

## 계획 밖 변경 이유
- HANDOFF.md — 인수인계 표의 사이트 주소가 옛 `tripfx.pages.dev` 라 새 주소로 (한 줄)

## 위험
- 저장 키 이름이 한 곳만 바뀌면 인트로 · 홈 안내판 연결이 끊김 → e2e(인트로 · 홈) 전체
- Worker `routes` 를 잘못 쓰면 배포가 도메인을 떼어 낼 수 있음 → 문서대로 `custom_domain: true` · 머지 뒤 바로 확인
- 맨 위 `wrangler.jsonc` 를 지우면 기본 `wrangler` 명령이 다른 설정을 찾을 수 있음 → 배포 명령은 이미 `--config apps/web/wrangler.jsonc`

## 검증 계획
- 단위 · e2e 전체(Full 게이트)
- 머지 뒤 flapfx.com: 제목 · canonical · sitemap · robots · og:url · 인트로 진행 뒤 홈 안내판

## 계획과 달라진 점
- 없음. 커밋이 한 번 섞여(삭제 파일이 첫 커밋에 들어감) 푸시 전에 단계별로 다시 나눔.

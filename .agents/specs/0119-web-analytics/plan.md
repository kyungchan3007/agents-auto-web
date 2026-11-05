# 계획

## 무엇을 · 왜
- Cloudflare Web Analytics 를 대시보드에서 켬 (2026-11-05) — 다음 배포부터 적용이라 이 PR 이 배포를 겸함
- AI 서비스에서 넘어온 방문은 볼 수 있음 · 스크립트를 안 돌리는 봇은 안 잡힘
- AI Crawl Control 은 계정 메뉴에 없음 — 도메인(zone) 기능으로 보이고 tripfx.pages.dev 는 zone 이 아님
- 소개 페이지에 방문 통계 사용을 적음 · 측정 문서 갱신 · 저장소 링크를 새 이름으로

## 애매한 곳
- 쿠키 없음은 Cloudflare 안내 기준 (가정)

## 파일 계획
- docs/geo-measurement.md
- apps/web/src/features/about/about-page.tsx
- apps/web/src/shared/site.ts
- .agents/specs/0119-web-analytics/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 운영 HTML 에 Web Analytics 스크립트

## 허점
-

# 계획

## 무엇을 · 왜
- 페이지마다 제목 · 대표 주소를 달아 검색에서 구별되게 (이슈 #117 의 2번)
- 통화 상세 H1 에 통화명 · sitemap 에 실제 환율 기준일

## 애매한 곳
- /log 제목 "작업실 · Tripfx" — 전에 뺀 말은 "만드는 중" 이라 어긋나지 않음 (가정)
- 본문 먼저 읽히는 구조: 코드 순서는 바꾸지 않고 상세를 `<main>` 으로 표시 — 순서를 바꾸면 키보드 이동 순서가 화면과 어긋남 (가정)
- /log 는 환율과 무관해 lastModified 를 넣지 않음 (가정)

## 파일 계획
- apps/web/src/app/page.tsx · log/page.tsx · calc/page.tsx · prices/page.tsx · currencies/page.tsx · sitemap.ts
- apps/web/src/shared/sitemap-entries.ts · sitemap-entries.test.ts
- apps/web/src/features/currencies/currency-detail.tsx · browse-layout.tsx
- .agents/specs/0114-page-identity/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 머지 뒤 운영 HTML 에서 제목 · 대표 주소 확인

## 허점
-

# 계획

## 무엇을 · 왜
- 접근성 · 기본기 6가지 (#252).
- 섹션 제목(SectionTitle)이 실제 제목 태그(h2)로 그려지는지 확인하고, 제목 태그가 아닌 섹션 제목(destinations · budget-planner · converter · customs · story 등)을 제목 태그로.
- 본문 바로가기 링크: 첫 Tab 에서 "본문 바로가기"가 보이고 누르면 main 으로(평소엔 숨김).
- 버튼 눌림(:active) 상태 (packages/ui form/button.tsx).
- 탭 밑줄 이동을 left · width 대신 transform 으로 (packages/ui form/tabs.tsx · 모션 줄이기 존중).
- html · body `overflow-x: clip` (globals.css) — 가로 넘침 방지.
- 경고 이모지 ⚠ → 그림(SVG) 아이콘 (shared/outage-notice.tsx · ui feedback/freshness-note.tsx) · 이모지는 윈도우에서 모양이 다름.

## 애매한 곳
- 제목 단계: 페이지마다 h1 하나 · 섹션 h2 · 그 안 h3 — 화면 모양(크기 · 색)은 바꾸지 않음 (가정)
- 바로가기 글: "본문 바로가기" (가정)
- 아이콘은 새 의존성 없이 SVG 직접 (가정)

## 파일 계획
- packages/ui/src/**
- apps/web/src/shared/**
- apps/web/src/app/globals.css
- apps/web/src/app/layout.tsx
- apps/web/src/features/**
- apps/web/e2e/**
- .agents/specs/0213-design-a11y/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (Quick)
- [ ] 모든 페이지 제목 구조: h1 하나 · 섹션 제목이 h2 (e2e 로 페이지마다 확인)
- [ ] 첫 Tab = 본문 바로가기 · Enter 로 main 초점 (e2e)
- [ ] 버튼 :active 스타일 · 탭 밑줄 transform (단위 또는 e2e)
- [ ] ⚠ 이모지 글자 없음 · svg 아이콘 (e2e · 검사)
- [ ] 화면 모양은 그대로 (미리보기 캡처 비교 · lead)

## 허점
-

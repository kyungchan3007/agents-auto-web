# 계획

## 무엇을 · 왜
- 첫 페이지 캐러셀이 블프 장(검정)일 때도 헤더(packages/ui NavBar · data-surface=dark · bg-surface 울트라마린)는 파랑이라 hero 와 색이 끊김.
- 첫 페이지에서만 헤더 바탕 = 지금 장 hero 바탕(블프 검정 · 여행 타이밍 울트라마린) · 0.5초 함께 바뀜 · 움직임 줄이기면 바로 · 기간 뒤 울트라마린 · 다른 페이지 그대로.
- 방법(상태 나누지 않음 · 헤더 다시 그려지지 않음):
  - 캐러셀 훅이 지금 장을 html 의 data 속성 하나(예: data-slide=bf|sea)로 알림(useEffect · 장이 바뀔 때만).
  - 헤더 색은 CSS 로: 첫 그림부터 검정이어야 하므로 JS 전에도 맞는 선택자 — head 스크립트가 이미 정하는 html[data-hero="bf"] + 첫 페이지 표시(캐러셀 요소가 있는 페이지 · 예: html:has([data-testid="hero-carousel"])) + data-slide 가 sea 가 아닐 때 → header 바탕 = --hav-bf-bg. 전환 0.5초 · prefers-reduced-motion 이면 없음.
  - packages/ui NavBar 는 바꾸지 않음(첫 페이지 CSS 가 header 를 고름) · 글자 · 로고 · 초점 고리는 data-surface=dark 그대로라 검정 위 흰 글자 · 노란 fx 유지.
- 색은 토큰(--hav-bf-bg 등) · tsx 로직 없음.

## 파일 계획
- builder: apps/web/src/features/home/carousel/{use-hero-carousel.ts,carousel.css} (필요하면 hero-carousel.tsx 속성만)
- test: apps/web/e2e/home-carousel.spec.ts (헤더 색 검사 더함)
- .agents/specs/0386-nav-color/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate)
- [ ] develop 머지 → develop → main fast-forward · 릴리스 없음

## 허점

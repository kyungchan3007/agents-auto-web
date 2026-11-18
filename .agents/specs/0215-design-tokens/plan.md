# 계획

## 무엇을 · 왜
- 화면 코드에 직접 쓴 색 숫자를 디자인 토큰으로 옮긴다 (#254 · 안쪽 정리 · 화면은 그대로).
- 그림자 `rgba(22,36,110,…)` → `packages/ui/src/tokens.css` 의 `--shadow-*` 토큰 (같은 값).
- intro/window-transition.tsx 의 #EAF4F2 · #FFFFFF · #F4F6F8 · intro/intro.tsx 의 #AFD4E6 → 토큰(이미 있는 색 토큰과 같으면 그것 · 없으면 새 토큰).
- 예외: opengraph-image.tsx (공유 이미지 생성기는 CSS 토큰을 못 읽음).

## 애매한 곳
- 3D 장면(three.js)처럼 CSS 변수를 못 읽는 곳은 tokens 를 TS 상수로 내보낸 값을 씀 (가정 · 한 곳에서 정의)
- 같은 숫자 검사를 하네스로 막을지: 테스트(apps/web/src/shared/*.test.ts)로 "화면 코드에 rgba(22,36,110 · #EAF4F2 등 직접 색 없음(예외 목록 빼고)" 추가 (가정)

## 파일 계획
- packages/ui/src/tokens.css
- packages/ui/src/lib/** (TS 색 상수가 필요하면)
- packages/ui/src/components/**
- apps/web/src/features/**
- apps/web/src/shared/*.test.ts
- apps/web/e2e/**
- .agents/specs/0215-design-tokens/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (Quick)
- [ ] 화면 코드에 직접 쓴 그림자 · 위 색 숫자 0곳 (예외 opengraph-image) — 검사 테스트
- [ ] 화면 모양 그대로: 바꾸기 전 · 후 캡처 비교(홈 · 인트로 켠 홈 · 통화 · 여행 물가 · 직구 · 1280 · 390) 픽셀 차이 없음 또는 아주 작음 (lead 미리보기)

## 허점
-

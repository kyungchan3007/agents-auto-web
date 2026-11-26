# SDD: 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- hero 를 두 칸으로: 왼쪽 글 · 입력창 · 칩, 오른쪽 탑승권 묶음. 지금 hero 아래에 있던 검색 · 칩(destinations)을 hero 왼쪽 칸으로 옮기되 동작 · 훅은 재사용.
- 문구는 lib(hero-guide.ts 또는 travel-timing.ts 의 copy 함수) 한 곳 · tsx 에 로직 없음.
- 탑승권 값(오늘 환율 · 90일 비교 · 떠나기 좋은 달 · 꼬리표 환산)은 홈이 이미 받는 자료에서 lib 함수로 계산 · 없으면 빈 칸.
- 모션: 넘김 순서 · 칩 누름 6초 멈춤은 커스텀 훅(features/home 아래 관련 폴더) · prefers-reduced-motion 이면 멈춤.
- 스타일: 시안 CSS(.sea · .pass · .passes · .fxtag · .route-bg) 옮김 · 색 · 그림자는 토큰. 탑승권은 container query(cqw).

- 0381(블프)이 먼저 들어감: home.tsx 의 자리 바꿈(BfHero + div.bf-default 안 HeroSection)과 html data-hero 스크립트는 그대로 두고, 기본 hero 는 .bf-default 안에서 바꾼다. 기존 홈 e2e 는 e2e/default-hero.ts(forceDefaultHero)로 기본 hero 를 봄 · 새 spec 도 같은 도우미를 씀.
- 탑승권 · 꼬리표 환율 값은 홈이 받는 latest · signals 에서 lib 로 계산(0381 의 src/shared/customs 는 쓰지 않음).

## 대안 · 트레이드오프
- 탑승권을 이미지로: 값이 실제 자료로 바뀌어야 해서 고르지 않음.

## 파일 계획
- apps/web/src/features/home/** (hero · destinations · 새 탑승권 부품 · 훅 · lib)
- packages/ui/src/tokens.css (새 색 · 그림자 토큰이 필요하면)
- *.test.ts · apps/web/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0380-hero-pass/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

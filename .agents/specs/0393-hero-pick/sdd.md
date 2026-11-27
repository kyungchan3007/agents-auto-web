# SDD: 기본 hero 고른 곳 정보 · 숫자 칸 · 가운데 정렬

## 경계
- app/page.tsx 는 이미 api.priceLevels() 를 받음 → Home 에 levels(물가 수준 · relative) 를 넘기고, Home → HeroSection 으로 rates · signals · levels · timing · pageCodes 를 넘김(0384 에서 빠진 pageCodes 를 다시). 새 API · 계약 변경 없음.

## 순수 함수 (hero/hero-pass.ts 또는 hero/hero-pick.ts · React 없음)
- passFor(hit, rates, signals, windowDays, month) → PassCard: 네 도시 밖도 같은 모양 · 공항 코드는 데이터에 있을 때만.
- pickFacts(hit, rates, signals, levels) → 숫자 칸 값: 제목 · 오늘 환율(통화 단위 · 예 "9.41원" / "1엔") · 1만원이면 · 물가 % · 90일 위치(percentile → 낮은 편 · 보통 · 높은 편 + n%) · 막대 값(max · median · 오늘) · 받지 못한 값 null → 화면 "-".
- deck 순서: 고른 장을 맨 앞에 넣는 함수 · 덱 밖 장은 하나만.

## 상태 · 모션 (hooks)
- use-hero-deck: 넘김 한 번에 맨 앞 장만 out(0.65초) · 진행 중 고르기는 대기열 한 칸(마지막 것만) · 고르면 자동 넘김 멈춤. 지금 칩 클릭 때 넘김이 두 번 겹치는 원인(deck.go 가 여러 장을 연달아 넘기는지)을 먼저 확인하고 없앰.
- use-hero-ask: 칩 · 제안 · Enter · 보기를 한 함수 pick(hit) 으로 · useTripSwitcher.choose 유지(저장).
- 숫자 칸은 맨 앞 장 도시를 따라감(별도 상태 없이 deck 의 맨 앞에서 계산).

## 그리기 · CSS
- hero-pick-facts.tsx(그리기만) · hero.css: 글래스 값(사용자 확정 그대로) · 좁은 폭 숫자 / 단위 두 줄 · keep-all.
- 제안 목록: top = 입력칸 아래 8px · 흰 불투명 · z-index 위 · 줄 오른쪽 공항 코드.
- 899 이하: 기본 hero 글 칸 · 블프 bf-copy 를 max-width 600px · margin-inline auto · padding-inline max(22px, env(safe-area-inset-*)) · 입력 · 숫자 칸 · 블프 계산 칸 width 100%.
- 값 · 모션은 시안 mockup/mockup.html 의 CSS · JS 를 그대로 옮김(색은 토큰으로).

## 규칙(먼저 볼 것)
- tsx 로직 없음 · 기능 폴더끼리 가져오지 않음(공통은 src/shared) · 색 토큰 · 다크 모드 없음 · 초점 고리(data-surface) · 큰 제목 자간 -0.03em · 보이는 글자 12px 이상 · 받지 못한 숫자 지어내지 않음.

## 파일 계획
- builder: apps/web/src/app/page.tsx · apps/web/src/features/home/home.tsx · apps/web/src/features/home/timing/hero-section.tsx · apps/web/src/features/home/hero/** (hero-pass.ts · 새 hero-pick.ts · use-hero-deck.ts · use-hero-ask.ts · use-hero-deck-context.ts · hero-passes.tsx · hero-deck.tsx · hero-ask.tsx · 새 hero-pick-facts.tsx · hero.css) · apps/web/src/features/home/blackfriday/bf-hero.css(가운데 정렬만) · packages/ui/src/tokens.css(필요한 토큰만)
- test: hero 순수 함수 단위 · apps/web/e2e/home-guide.spec.ts 또는 새 home-pick.spec.ts(새로 쓰면 .agents/e2e-map.json 에도) · 기존 홈 spec 중 깨지는 것
- .agents/specs/0393-hero-pick/** · .agents/orchestration/TASKS.md

## 순서
- test(단위 · e2e 먼저 · 함수 이름 · testid 를 builder 에 줌) ∥ builder → test(모션 한 번 · 반응형 320~1600 · 넓은 글꼴 · 높이 같음 · 가운데 정렬)

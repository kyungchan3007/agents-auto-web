# SDD: 첫 페이지 hero 캐러셀

## 구조
- home.tsx(서버): `<HeroCarousel slides={[<BfHero …/>, <HeroSection …/>]}>` 처럼 두 장을 **서버에서 만든 요소(children)** 로 넘김. 캐러셀이 다시 그려져도 같은 요소라 두 hero 안은 다시 그려지지 않음(R3 · 영수증 카운트업과 입력칸 분리). 지금의 `div.bf-default` 감싸기는 캐러셀이 대신함.
- 새 폴더 `apps/web/src/features/home/carousel/`:
  - `carousel.ts`(lib · 순수): 장 순서 · 장별 시간(블프 9000 · 기본 7000) · 다음/이전 · 밀기 판정(|dx| ≥ 50) · 남은 시간 계산.
  - `use-hero-carousel.ts`(훅): 고른 장 · 자동 타이머(setTimeout 한 개 · 남은 시간) · 멈춤(mouseenter/leave) · 취소(컨테이너에 focusin · input 이벤트 위임 → 대상이 input/select 면 영구 끔) · 움직임 줄이기(matchMedia) · 밀기(pointer/touch). **매 프레임 상태 갱신 금지** — 노란 줄은 CSS animation(지속 시간 = 장 시간 · 멈춤은 animation-play-state · 장 바뀌면 key 로 다시 시작).
  - `hero-carousel.tsx`(그리기만): grid 한 칸에 두 장 겹침 · 안 보이는 장 `inert` + `aria-hidden` + visibility:hidden · tablist(알약 두 개 · aria-selected · aria-controls) · ‹ › (900 이상) · 899 이하 버튼은 그림 아래 흐름 안.
  - `carousel.css`: grid-area 1/1 · 0.35초 opacity(글 · 그림) · 배경색 0.5초 · 알약 · 노란 점 · 줄 · 반응형. 색은 토큰.
- 기간: head 스크립트 · html data-hero 그대로. `html[data-hero="default"]` 이면 블프 장 · 캐러셀 버튼 숨김(display:none) → 기본 hero 한 장. 스크립트 없을 때 기본값도 지금처럼 기본 hero. e2e 도우미 forceDefaultHero 는 그대로 동작.
- 블프 숫자만: `blackfriday/bf-digits.ts`(또는 bf-calc 안) `digitsOnly(s) = 0-9 만 남김` · use-bf-calc 의 onAmount 가 이 값으로 상태를 정함 · 한글 조합 중(compositionstart~end)에는 끝난 뒤 한 번 정리 · input 에 inputMode="numeric" pattern="[0-9]*".
- 반응형: bf-hero.css 를 R5 기준으로(기본 장 hero.css 기준과 같은 꺾는 점 1200 · 900) · hero.css 899 이하 탑승권 26px 아래로.

## 규칙(먼저 볼 것 · 0383 교훈)
- tsx 에 로직 없음 · 기능 폴더끼리 가져오지 않음(carousel 은 home 안이라 됨) · 색은 토큰 · 다크 모드 없음.
- 초점 고리: 공통 고리(밝은 면 파랑 · 어두운 면 흰색 · data-surface) · 알약 · ‹ › 도. 큰 제목 자간 -0.03em · 보이는 글자 12px 이상 · 탭 대상 44px 참고.
- 접근성: a11y.spec 은 보이는 제목만 셈(0382) · 안 보이는 장은 inert + aria-hidden.

## 파일 계획
- builder: apps/web/src/features/home/home.tsx · apps/web/src/features/home/carousel/** (새로) · apps/web/src/features/home/blackfriday/{bf-hero.tsx,bf-hero.css,use-bf-calc.ts,bf-digits.ts} · apps/web/src/features/home/hero/hero.css · packages/ui/src/tokens.css(필요한 토큰만)
- test: carousel.ts · bf-digits 단위 테스트 · apps/web/e2e/home-carousel.spec.ts(새로) · 기존 홈 · 블프 spec 중 캐러셀로 깨지는 것만
- .agents/specs/0385-hero-carousel/** · .agents/orchestration/TASKS.md

## 순서
- test(단위 · e2e 먼저: 순수 함수 이름 · testid 정해 builder 에 알림) ∥ builder 구현 → test 확인(반응형 320~1600 · 넓은 글꼴 · 높이 같음 · 입력 취소 · 다시 그려짐 없음)
- testid 제안: hero-carousel · hero-slide(data-slide=bf|sea · data-active) · hero-tab(두 개) · hero-prev · hero-next · hero-progress

# SDD — 어떻게

> 요구사항: [prd.md](prd.md) · 확정 시안 원본: `.tmp/intro/intro3.src.html` (로컬 · 커밋하지 않음)

## 접근
- **새 기능 폴더 `apps/web/src/features/intro/`** — 홈(`features/home`)과 직접 참조하지 않음 (역할 분담 규칙). 둘이 함께 쓰는 값(고른 나라 저장 키 · 모양)은 `@hav/shared/travel` 로.
  - `lib/flow.ts` (순수) — 나라 · 도시 검색(앞글자 우선) · 판 문구(`ICN → 도시` · `1유로 1,470원`) · 예산 환산 · 탑승권 내용 · 단계 이름 · 저장할 값 모양
  - `lib/flight.ts` (순수) — 비행기 · 카메라 키 경로(게이트 → 유도로 → 활주로 → 상승) · `LIFT`(바퀴가 뜨는 진행값) · 스크롤 → 진행값
  - `lib/places.ts` — 나라별 대표 도시 목록 (TRAVEL_COUNTRIES 의 나라 · 도시 이름)
  - `lib/scene.ts` (three · React 없음) — 시안의 장면을 옮김: 섬 · 바다 · 하늘 · 구름 · 터미널 · 관제탑 · 활주로 · Kenney 도시 · 차 · 사람 · 비행기 · GTAO · 직원 이동 · 카메라 이동 · `mountIntroScene(el, api)` 가 정리 함수를 돌려줌
  - `hooks/use-intro.ts` — 단계 · 입력 · 탑승권 · 스크롤(휠 · 방향키) · 창문 전환 순서 · 저장
  - `hooks/use-intro-scene.ts` — `import("../lib/scene")` 로 three 를 인트로가 열릴 때만 불러옴
  - `components/intro-gate.tsx` — 폭 700px 초과일 때만 인트로를 띄움 (서버 HTML 에는 아무것도 그리지 않음)
  - `components/intro.tsx` · `bubble-*.tsx` · `boarding-pass.tsx` · `window-transition.tsx` — 화면(그리기만)
- **홈 (`app/page.tsx`)** — 이미 받는 latest · signals · airFare 에 priceLevels 를 더해 인트로에 넘김 (빌드 때 한 번 · D1 읽기 소량 추가). `<Home>` 뒤에 `<IntroGate>` 를 둠 → 홈 HTML 은 그대로.
- **홈 안내판 (`features/home`)** — `TodayBoard` 는 서버 그대로 그림. 클라이언트 훅이 저장된 "고른 나라"를 읽으면 같은 FlapBoard 로 "내가 고른 여행지 · 오늘 환율"을 그림(key 를 바꿔 다시 넘어가게). 인트로가 끝날 때 보내는 이벤트(`tripfx:intro-pick`)도 들음. "탑승권 보기" 작은 버튼도 홈 쪽.
- **홈 문구** — `travelTimingCopy` 의 "최근 N년 같은 달 평균으로 비교했습니다." 삭제 · 테스트 갱신.
- **자산** — `apps/web/public/models/intro/{car,taxi,people,city}/*.glb` + 각 `Textures/colormap.png` (차는 흰색 계열로 바꾼 색상표). 실제 사이트는 fetch 가 되므로 시안의 data: · createImageBitmap 우회는 쓰지 않음.
- **창문 전환** — 홈 첫 화면 사진(`[data-testid=photo-header-img]`)의 실제 자리(getBoundingClientRect)로 사진이 줄어들어 들어감 → 시안의 측정값 대신 실제 요소 기준.
- **라이선스 표시** — 인트로 아래 줄 + 홈 바닥 띠 출처에 Kenney(CC0) 추가.

## 대안 · 트레이드오프
- 미리 렌더 영상(Emons 방식): 품질 ↑ · 입력에 반응 못 함 · 파일 큼 → 고르지 않음 (사용자: "실시간 3d 로")
- OpenStreetMap 실제 인천공항: 사실감 ↑ · 홈과 이질감 → 시안 비교 후 제외 (사용자: "이상해")
- 인트로를 별도 주소(/intro)로: 홈 HTML 이 바뀌지 않는 건 같지만 리다이렉트가 검색에 불리 → 덮는 층으로
- three 를 `@hav/ui` 부품으로: 인트로는 이 사이트 고유 화면이라 web 기능 폴더에 둠 (packages/ui 의 three 와 같은 버전 0.186 사용)

## 파일 계획
- .agents/specs/0185-intro-airport/**
- apps/web/src/features/intro/**
- apps/web/src/app/page.tsx
- apps/web/src/features/home/components/today-board.tsx
- apps/web/src/features/home/components/home.tsx
- apps/web/src/features/home/components/picked-board.tsx
- apps/web/src/features/home/hooks/use-picked-destination.ts
- apps/web/src/features/home/lib/travel-timing.ts
- apps/web/src/features/home/lib/travel-timing.test.ts
- apps/web/src/features/home/lib/picked.ts
- apps/web/src/features/home/lib/picked.test.ts
- apps/web/src/features/home/components/home-footer.tsx
- apps/web/public/models/intro/**
- packages/shared/src/domain/travel.ts
- apps/web/package.json
- package-lock.json
- apps/web/e2e/intro.spec.ts
- docs/design.md

## 계획 밖 변경 이유

## 위험
- **무게:** three + 모델 약 5MB — 인트로가 열릴 때만 불러오고 데스크톱 한정. 홈 첫 그림(LCP)에는 영향 없어야 함 → e2e 로 홈이 인트로 없이 그려지는지 확인.
- **검색 · GEO:** 인트로는 클라이언트에서만 붙는 층 · 서버 HTML 그대로 → 빌드 결과 HTML 비교.
- **보호 파일:** `package-lock.json`(three 를 web 에 추가) — 사람 승인(`harness-approved` 라벨) 필요.
- **역할 분담 · 죽은 코드 검사:** 화면 파일에 훅 금지 · home/components 의 모든 파일은 다른 곳에서 가져다 써야 함 · 기능 폴더끼리 직접 참조 금지 → 공용 값은 @hav/shared.
- **e2e:** 3D 는 헤드리스에서 느릴 수 있음 → 인트로 e2e 는 흐름(DOM)만 확인, 3D 그림은 확인하지 않음.

## 검증 계획
- 단위 테스트(테스트 먼저): 검색 순서 · 판 문구 · 예산 환산 · 탑승권 내용 · 비행 경로(LIFT 이후 자동) · 저장 값 읽기/쓰기 · 홈 문구에 "같은 달 평균" 없음 · 홈 안내판 문구
- e2e: 데스크톱 — 인트로 → 파리 → 예산 → 탑승 → 스크롤 → 홈 · 안내판 "파리" / 모바일 — 인트로 없음 / 건너뛰기
- 로컬 개발 서버에서 화면 확인 · 미리보기 주소에서 다시 확인
- `bash .agents/checks.sh` (full)

## 계획과 달라진 점

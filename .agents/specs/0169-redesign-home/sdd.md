# SDD — 어떻게 (0169 홈)

> 요구사항: [prd.md](prd.md) · 공통 기반: [0168 sdd](../0168-redesign-foundation/sdd.md) (토큰 · 판정 핀 · 도착지 줄 · 바닥 띠)

## 접근
### 데이터 (빌드 때 · `apps/web/src/app/page.tsx`)
- 지금 받는 것: `api.latest()` · `api.signals()` · `api.priceLevels()` · `api.history("USD", 365)` · `api.changes(30)`
- 바꿈: `api.indicator("kosis-cpi:air-fare", 60)`(최근 5년 월 지수 · 0163 의 `indicator()`) 추가 · 홈에서 더 쓰지 않는 것(priceLevels · USD 365 · changes)은 뺀다 — 빌드 때 D1 읽기도 줄어듦. 무엇을 뺄지는 새 홈이 실제로 쓰는 것 기준.
- 계산은 순수 함수로 `apps/web/src/features/home/lib/` 에 (테스트 대상):
  - `travelTiming(points)` → `{ kind: "preparing" } | { kind: "ready", months: {month, avg}[12 중 있는 달], cheapest, priciest }` — `travel-price/lib/travel-index.ts` 의 `monthlyAverages` 를 직접 가져오면 기능 폴더 경계 규칙(role-boundary)에 걸림 → 0165 처럼 공용 계산을 `packages/shared/src/domain/` 로 옮겨 두 곳이 함께 쓴다.
  - `cheapestDestination(signals, latest, destinations)` → 백분위가 가장 낮은 도착지 (신호 없는 곳 제외 · 모두 없으면 null)
  - `destinationRows(...)` → 도시 · 통화 이름 · 단위 · 오늘 환율 · 신호 · 백분위(눈금 위치)
- 눈금 위치 = 백분위(0~1) 그대로 (0168 `destination-row` 의 `scalePosition` 이 받는 형식에 맞춤)

### 화면 (`apps/web/src/features/home/components/`)
- 위 → 아래: 여행 타이밍(`data-surface="light"`) → 오늘 환율 바다 띠(`id="today"` · `data-surface="dark"` = 울트라마린) → 도착지별 환전 타이밍(light) → 바닥 띠
- **선 그래프**: SVG (기존 `@hav/ui/chart` 계산 도구가 있으면 그것으로). 넓은 화면은 본문 전체 너비 · 12달 이름, 760px 이하 좁은 그래프 + 요약 축 글. 지수 없는 달은 선을 끊는다 (채우지 않음).
- **선을 따라 나는 비행기**: 그래프와 같은 크기의 3D 캔버스를 그래프 위에 겹치고(pointer-events 없음), 비행기 위치를 그래프 선의 점들 사이로 보간해 1월 → 12월로 반복 이동. 화면 좌표 ↔ 3D 좌표는 직교 카메라로 맞추면 선과 같은 높이가 쉽다. 진행 방향으로 기수를 돌린다.
  - 비행기 모델 · 조명은 `packages/ui/src/three/objects/plane.tsx` 를 그대로 쓰고, 경로를 따라가게 하는 부분만 더한다 (예: `plane.tsx` 에 `path` · `progress` prop 을 더하거나, 새 `three/objects/plane-route.tsx` 가 같은 모델을 감쌈). 생김새 · 재질 · 조명 값은 바꾸지 않는다.
  - 움직임 줄이기면 가장 싼 달 점에 멈춤 · Stage 의 화면 밖 정지 · 늦게 불러오기 유지.
  - 경로 계산(점 사이 보간 · 진행 방향 각도 · 멈출 점)은 순수 함수로 `packages/ui/src/three/lib/` 에 (테스트 대상).
- **바다 띠**: 왼쪽 지구(지금 `globe.tsx` 그대로 · 서울 → 네 도착지 호) · 오른쪽 문장 · 노란 큰 숫자(font-display). 모바일은 지구 위 · 글 아래.
- **도착지 줄**: 0168 `destination-row` · 판정 핀 사용. 줄 전체가 `/currencies/{통화}` 링크.
- 기존 `hero-section` · `trips-section` · `trip-scenes` · `calc-section` · `year-section` · `currencies-section` 중 새 홈에서 쓰지 않는 것은 지운다 (죽은 코드 남기지 않음).

### 문구 (숫자는 받은 값으로만)
- 여행 타이밍 제목 "{N}월에 떠나세요" · 설명 "통계청 국제항공료 지수로 보면 {싼 달}이 1년 중 가장 낮고, {비싼 달}이 가장 높습니다. 최근 3년 같은 달 평균으로 비교했습니다." (자료가 3년 미만이면 "최근 {n}년")
- 바다 띠 근거 한 줄 "최근 90일 중 {x}%의 날보다 낮습니다 · 예측이 아닙니다 · 수출입은행 환율을 평일 12시에 받습니다" + 기준일 문구

## 대안 · 트레이드오프
- **Figma 예시 문구대로 "1년 평균 대비 %"로 판정**: 화면은 Figma 와 같아지지만 통화 화면(90일 백분위 신호)과 판정이 달라질 수 있어 SIG 규칙과 충돌 → 사이트 신호 규칙(90일 백분위)으로 통일. 눈금의 뜻은 "최근 90일 안의 위치"로 화면에 적는다. (lead 결정 2026-11-15)
- **비행기를 그래프와 따로 칸에**: 사용자가 "비행기가 선이랑 겹쳐서 가는 거지"라고 함 → 겹침.
- **그래프를 3D 로**: 글자 · 접근성 · 무게 손해 → 그래프는 SVG, 비행기만 3D.

## 파일 계획
- .agents/specs/0169-redesign-home/**
- .agents/orchestration/TASKS.md
- apps/web/src/app/page.tsx
- apps/web/src/features/home/**
- apps/web/src/features/travel-price/lib/**
- apps/web/src/shared/api.ts
- packages/shared/src/domain/**
- packages/ui/src/three/objects/plane.tsx
- packages/ui/src/three/objects/plane-route.tsx
- packages/ui/src/three/lib/**
- packages/ui/src/three/scene/lazy.tsx
- apps/web/e2e/**
- apps/web/e2e-responsive/**

## 계획 밖 변경 이유

## 위험
- 지금 운영에는 국제항공료 지수가 없다 (0171 이 머지되면 평일 12:00 부터 채움) → 맨 위가 "아직 받지 못했습니다" 상태로 먼저 보인다. 자료가 있을 때 모양은 fixture 로 테스트하고, 로컬 확인 때는 지수가 있는 가짜 API 응답으로 캡처한다.
- 비행기를 그래프 좌표에 맞추는 것이 화면 크기 변경 · 폰트 로딩 뒤 어긋날 수 있음 → 그래프 크기를 재서(ResizeObserver) 다시 맞춤.
- 0168 위에 쌓임 — 0168 의 공통 컴포넌트 props 를 바꾸지 않는다.
- Full 게이트 build 는 운영 D1 을 읽는다 → 개발 중 `LOOP=quick`, Full 은 lead 가 PR 직전 한 번.

## 검증 계획
- test(먼저 FAIL): `travelTiming`(없음 · 일부 달만 · 3년 · 싼 달/비싼 달) · `cheapestDestination`(신호 없음 제외 · 모두 없음) · `destinationRows` · 비행기 경로 보간(진행률 0 · 1 · 사이 · 각도 · 멈출 점) · 홈 소스 검사(id="today" · 바다 띠 surface · 지구 · 비행기 컴포넌트 사용 · 고양이/동전 없음 · 숫자를 만드는 상수 없음) · e2e(홈 순서 · 지수 없을 때 문구 · 도착지 줄 링크)
- 게이트: 개발 중 `LOOP=quick`, PR 직전 lead 가 Full 한 번
- 화면: 로컬 정적 빌드(지수 없음 = 지금 운영) + 지수가 있는 가짜 응답으로 한 번 더 → 데스크톱 · 모바일 · 밤 포스터 캡처, Figma 01 · 01-M 과 대조

## 계획과 달라진 점

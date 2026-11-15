# SDD — 어떻게 (0170 나머지 화면)

> 요구사항: [prd.md](prd.md) · 공통 기반: [0168 sdd](../0168-redesign-foundation/sdd.md) · 홈: [0169 sdd](../0169-redesign-home/sdd.md) (비행기 경로 부품 · 여행 타이밍 계산 공용화)

## 접근
- 화면마다 figma-spec.md 의 구간 순서대로 컴포넌트를 다시 짠다. 계산 · 자료 처리 함수(`lib/`)는 그대로 두고 화면(`components/`)만 바꾸는 것이 원칙 — 바뀌는 문장 생성(큰 문장 등)은 순수 함수로 `lib/` 에 더해 테스트한다.
- 공통 부품은 0168 것(판정 핀 · 도착지 줄 · 노란 도장 · 바닥 띠 · heading · big-number)만 쓴다. 새 공통 부품이 필요하면 `packages/ui` 에 더하되 0168 부품의 props 는 바꾸지 않는다.
- **/flights 의 비행기**: 0169 가 만든 선 따라가기 부품(plane-route)과 경로 계산을 그대로 쓴다. 항공료 선의 점을 넘긴다.
- **작업 순서 (builder · geo)**
  1. builder: 통화 · /flights · /prices · /calc · /log · /about · /design · 404
  2. geo: /geo (geo 소유 파일) — builder 와 같은 브랜치 · 다른 파일
- 울트라마린 전면이던 화면(작업실 · 소개 · 404 · status-board · patch-log · trips-section 등)은 하늘 종이 바탕 + 필요한 곳만 바다 띠로.

## 대안 · 트레이드오프
- **화면마다 PR 을 나눔**: 검토는 쉽지만 PR 이 7개가 되고 같은 공통 부품 조정이 흩어짐 → 한 PR, 화면별 커밋.
- **통화 판정을 1년 평균 대비로**: Figma 예시 문구와 같아지지만 사이트 신호 규칙과 충돌 → 0169 와 같이 90일 백분위.

## 파일 계획
- .agents/specs/0170-redesign-pages/**
- .agents/orchestration/TASKS.md
- apps/web/src/app/**
- apps/web/src/features/currencies/**
- apps/web/src/features/travel-price/**
- apps/web/src/features/import-calc/**
- apps/web/src/features/log/**
- apps/web/src/features/about/**
- apps/web/src/features/geo/**
- apps/web/src/shared/**
- packages/ui/src/components/**
- packages/ui/src/three/**
- packages/shared/src/domain/**
- apps/web/e2e/**
- apps/web/e2e-responsive/**
- docs/domain/**
- docs/design.md

## 계획 밖 변경 이유
- packages/ui/src/components/data/signal-pin.tsx · year-chart.tsx: props 를 더함(`text` · `average` · `lastTone` — 없으면 예전 모양이라 0168/0169 호출은 그대로) — 작년 대비 핀 글 · 통화 그래프 평균 점선 · 오늘 점 판정 색 (파일 계획의 packages/ui/src/components/** 안)
- apps/web/src/features/log/hooks/use-pinned-scene.ts 삭제 · scenes.tsx 의 PinnedScenes 삭제: 스크롤로 장면이 바뀌는 고정 패널과 바다 띠를 걷고 쌓은 장면만 (Figma 06 에 없음 · P10)
- features/travel-price/components/travel-index-section.tsx 삭제: /flights 가 새 그래프 · 카드로 바뀌어 안 쓰게 됨
- 작업실 상태판의 "자동 검사 (main)" · "열린 작업" 칸은 API 가 주지 않는 값이라 GitHub 로 연결만 하고 숫자를 만들지 않음 (값을 받으려면 상태 API 에 항목을 더하는 별도 작업 필요)
- 팀 책상의 "지금: …"은 역할별 현재 작업을 주는 자료가 없어 넣지 않음 (team.test.ts 의 "지금:" 상수 금지와 같은 뜻)

## 위험
- 화면이 많아 e2e · 반응형 테스트 문구가 여럿 바뀜 → test 가 함께 맞춤.
- geo 와 builder 가 같은 브랜치 · worktree 를 씀 → 서로 다른 파일 · 커밋 전 `git pull --rebase` · 경로 지정 커밋.
- 0169 위에 쌓임 → 0169 이 바뀌면 다시 쌓는다 (lead).
- Full 게이트 build 는 운영 D1 을 읽는다 → 개발 중 `LOOP=quick`, Full 은 lead 가 PR 직전 한 번.

## 검증 계획
- test(먼저 FAIL): 화면별 큰 문장 생성 순수 함수(통화 · /flights · /prices · /calc) · 소스 검사(울트라마린 전면 없음 · 바다 띠만 · 판정 핀 사용 · /flights 가 plane-route 사용 · 노란 도장 사용 · 고양이 없음) · e2e 문구 · 반응형 메뉴 · 모바일 쌓임 순서
- 게이트: 개발 중 `LOOP=quick`, PR 직전 lead 가 Full 한 번
- 화면: 로컬 정적 빌드 캡처(데스크톱 · 모바일 · 밤 포스터)를 Figma 02 ~ 08 과 대조

## 계획과 달라진 점
- **추가 요청(2026-11-15 10:53 · 사용자 "시안이랑 다르다")**
  - 도착지 줄: 데스크톱은 한 줄 세 칸(① 도시 · 통화 ② 오늘 환율 오른쪽 정렬 ③ 쌈~비쌈 눈금 + 판정 핀 · 줄 높이 지금의 절반쯤) · 끝 라벨(쌈 · 중간 · 비쌈)은 작게 눈금 바로 아래 · 760px 이하는 한 줄(왼쪽 도시 · 통화 · 환율, 오른쪽 핀 · 눈금 없음)
  - 판정 핀 글: 판정 기준(90일 백분위)의 근거 숫자 + 판정 — p ≤ 0.5 면 "하위 {p×100 반올림}% · 쌈|보통", p > 0.5 면 "상위 {(1−p)×100 반올림}% · 보통|비쌈" (lead 결정 · Figma 예시 "-4.1% 쌈" 자리) · 백분위가 없으면 판정 글자만
  - **기준 이미지: `.tmp/figma-screens/`(Figma 프레임 원본 · 10:57 요청) 와 똑같이** — 칸 구성 · 순서 · 크기 · 간격 · 글자 크기 · 색. 시안에 없는 칸 · 줄 · 설명 문단은 뺌. 예외: 실제 숫자 · 자료 없으면 빈 값 · 90일 신호 판정 · 주홍 글자 #C13A22
  - 반복: builder 가 로컬 빌드 → 1440 · 390 캡처 → 시안과 비교 → 고침 (빌드는 화면 묶음마다 한 번쯤 · 응답 캐시로 D1 읽기는 작음)
  - 대조 목록: [compare.md](compare.md) (조사 에이전트 · 메뉴 정렬 항목은 이미 고침)
  - 시안 안의 값이 서로 다를 때는 Figma 프레임 이미지를 따름 (lead 결정 · 사용자 "이미지와 똑같이"): 하위 화면 큰 제목 약 72px (96px 는 홈 첫 제목만) · 홈 "/ 100엔" 은 노란 큰 글
  - 0168 의 "테두리 상자 · 카드 걷기" 원칙은 Figma 프레임에 있는 흰 카드 · 파란 카드 · 노란 결과 칸에는 적용하지 않음 (이미지가 우선)
  - 전체 화면 시안 대조 → 다른 곳 목록(.tmp/design-c/compare-0170.md)대로 화면별 커밋 · PR 본문에 "시안 대조" 절(시안 · 구현 캡처 나란히)
- 메뉴(nav-bar) 컨테이너를 max-w-5xl 에서 본문과 같은 max-w-6xl 로 · 좌우 여백은 header 로 올림 — Figma 01 은 로고와 본문이 같은 왼쪽 선이라서 (미리보기 캡처 대조에서 메뉴가 본문보다 안쪽이던 것을 고침 · 작업실 오늘 패치 구간도 max-w-5xl → 6xl)

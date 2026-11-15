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

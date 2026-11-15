# SDD — 어떻게 (0173 글꼴 정리)

> 요구사항: [prd.md](prd.md)

## 접근
- 지금 `font-display` 를 직접 쓰는 곳(약 22개 파일)을 두 갈래로 나눈다.
  - **남김(F1):** 페이지 맨 위 큰 제목 부품(Title 의 페이지 · 포스터 크기) · 큰 숫자 부품(BigNumber · text-figure 큰 숫자) · 로고 · 홈의 여행 타이밍 큰 문장 · 바다 띠 큰 문장 · 직구 큰 문장 · 결과 금액
  - **바꿈(F2):** 구간 제목 · 도시 이름 · 카드 제목 · 단계 제목 · 역할 이름 → 공통 부품(예: Heading 의 구간 · 도시 크기 변형, 새 `SectionTitle` 이 필요하면 하나)이 `font-sans font-bold` 를 쓰게 하고, 화면 코드는 그 부품을 쓰게 한다.
- 크기(--text-section · --text-city 등) · 색 · 배치는 그대로. 굵기만 700(작은 칸은 600).
- IBM Plex Sans KR 700 굵기를 next/font 로 함께 불러온다 (지금 400 · 600 → 400 · 600 · 700). `layout.tsx` 는 보호 파일이 아님.

## 대안
- 화면마다 클래스를 바꾸기: 빠르지만 다음 화면에서 다시 섞임 → 공통 부품으로.
- Gasoek One 을 더 가는 글꼴로 바꾸기: 사용자가 고른 안(A)이 아님.

## 파일 계획
- .agents/specs/0173-font-readability/**
- .agents/orchestration/TASKS.md
- packages/ui/src/tokens.css
- packages/ui/src/components/**
- packages/ui/src/lib/**
- apps/web/src/app/layout.tsx
- apps/web/src/app/**
- apps/web/src/features/**
- apps/web/src/shared/**
- apps/web/e2e/**
- docs/design.md

## 계획 밖 변경 이유

## 위험
- 0168 테스트(heading · big-number font-display 소스 검사)가 막을 수 있음 → test 가 먼저 새 규칙으로 고침.
- Full 게이트 build 는 운영 API 를 읽는다 → 개발 중 LOOP=quick, Full 은 lead 가 PR 직전 한 번.

## 검증 계획
- test(먼저 FAIL): font-display 는 허용 목록(F1) 부품 · 파일에서만 · 구간 제목 · 도시 · 카드 제목 부품은 font-sans + 700 · layout 이 IBM Plex 700 을 불러옴 · 크기 토큰은 그대로
- 화면: 로컬 빌드 전 · 후 캡처(홈 · 통화 · 여행 물가 · 직구 · 작업실)를 PR 에

## 계획과 달라진 점

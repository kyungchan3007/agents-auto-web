# SDD — 어떻게 (0173 글꼴 정리)

> 요구사항: [prd.md](prd.md)

## 접근
- 지금 `font-display` 를 직접 쓰는 곳(약 22개 파일)을 두 갈래로 나눈다.
  - **남김(F1):** 페이지 맨 위 큰 제목 부품(Title 의 페이지 · 포스터 크기) · 큰 숫자 부품(BigNumber · text-figure 큰 숫자) · 로고 · 홈의 여행 타이밍 큰 문장 · 바다 띠 큰 문장 · 직구 큰 문장 · 결과 금액
  - **바꿈(F2):** 구간 제목 · 도시 이름 · 카드 제목 · 단계 제목 · 역할 이름 → 공통 부품(예: Heading 의 구간 · 도시 크기 변형, 새 `SectionTitle` 이 필요하면 하나)이 `font-sans font-bold` 를 쓰게 하고, 화면 코드는 그 부품을 쓰게 한다.
- 크기(--text-section · --text-city 등) · 색 · 배치는 그대로. 굵기만 700(작은 칸은 600).
- IBM Plex Sans KR 700 굵기를 next/font 로 함께 불러온다 (지금 400 · 600 → 400 · 600 · 700). `layout.tsx` 는 보호 파일이 아님.

### 밝은 화면 하나만 (추가 요청)
- `packages/ui/src/tokens.css` 의 `@media (prefers-color-scheme: dark)` 블록 삭제 · `:root { color-scheme: light }`
- 3D(비행기 몸체 색 · 배경판 등)가 `data-surface` 로 밝은 · 어두운 바탕을 고르는 분기는 시안의 어두운 띠 위에서 쓰는 경우만 남기고, 기기 다크 모드에 반응하는 부분은 지움
- `layout.tsx` 의 `viewport.themeColor` 를 하늘 종이 하나로 (media 배열 제거)
- 0168 의 밤 포스터 대비 · 토큰 테스트는 삭제 · 밝은 화면 고정 검사로 바꿈 (test)
- 커밋 순서: (글꼴 단계들) → 테스트 먼저(밝은 화면 고정) → 토큰 · layout → 3D 분기 → 문서

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
- apps/web/src/features/geo/components/geo-report.tsx (geo 담당 파일): GEO 카드 수치의 글꼴 클래스 한 줄만 font-display → IBM Plex 굵게 — lead 결정(카드 안 숫자는 IBM Plex 굵게)을 공통으로 맞추려고. 다른 geo 파일은 건드리지 않음.

## 위험
- 0168 테스트(heading · big-number font-display 소스 검사)가 막을 수 있음 → test 가 먼저 새 규칙으로 고침.
- Full 게이트 build 는 운영 API 를 읽는다 → 개발 중 LOOP=quick, Full 은 lead 가 PR 직전 한 번.

## 검증 계획
- test(먼저 FAIL): font-display 는 허용 목록(F1) 부품 · 파일에서만 · 구간 제목 · 도시 · 카드 제목 부품은 font-sans + 700 · layout 이 IBM Plex 700 을 불러옴 · 크기 토큰은 그대로
- 화면: 로컬 빌드 전 · 후 캡처(홈 · 통화 · 여행 물가 · 직구 · 작업실)를 PR 에

## 계획과 달라진 점
- 허용 목록에 없는 중간 크기 숫자(여행 타이밍 카드 값 · GEO 카드 수치 · 단계 번호)는 IBM Plex 굵게 (lead 결정 — 사용자가 든 '큰 숫자' 예시는 노란 큰 숫자 · 통화 큰 환율 · 직구 결과 금액, 목적은 가독성)
- 밝은 화면 하나만 요청을 같은 PR 에 단계별 커밋으로 (같은 tokens.css · layout.tsx 를 고쳐 따로 나누면 충돌)

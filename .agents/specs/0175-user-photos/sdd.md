# SDD — 어떻게 (0175 화면별 사진)

> 요구사항: [prd.md](prd.md)

## 접근
- **사진 파일**: `apps/web/public/images/photos/` 에. 원본(1672×941)에서 폭별(예: 640 · 1024 · 1672) WebP 를 만들어 둠 — 이미 설치된 sharp 로 한 번 돌리는 스크립트(저장소의 `.tmp/` 또는 `apps/web/scripts/`)로 생성하고, 생성된 파일만 커밋. 새 의존성 추가 금지(package-lock 은 보호 파일).
- **공통 부품** `PhotoHeader`(packages/ui · 이름은 test 가 정함): props = 사진 경로들(srcSet) · 막 종류(light | ultramarine) · 우선 불러오기 여부 · alt · children(라벨 · 큰 제목 · 설명). 막은 CSS 그라데이션(데스크톱 왼쪽 → 오른쪽, 모바일 아래 → 위). `<img srcset sizes>` 또는 `<picture>` · 첫 화면만 `fetchpriority="high"` · 나머지 `loading="lazy"`.
- **화면 적용**: 홈 여행 타이밍 · /flights · /prices · /calc · /about 의 맨 위 구간만 PhotoHeader 로 감쌈. 아래 구간은 그대로.
- **OG**: `apps/web/src/app/opengraph-image.tsx` 가 plane-sunset 을 1200×630 으로 잘라 배경으로 쓰고 지금의 글자 · 로고를 위에 (ImageResponse 안에서 이미지 읽기 — 빌드 때 파일 읽기).
- **대비**: 막 위 큰 제목 · 설명의 대비를 contrast 검사로 (밝은 막의 가장 진한 부분 · 울트라마린 막 기준).

### 통화 그래프 최고 · 최저 (추가 요청)
- 그래프 부품(packages/ui 의 year-chart 또는 통화 period-chart)에 최고 · 최저 점과 라벨을 더함 — 값은 카드와 같은 계산 함수(currencies/lib 의 yearStats 계열)를 기간별로 씀
- 라벨 위치 계산(겹치면 위아래로 비킴 · 화면 안으로)은 순수 함수로 (테스트 대상)
- 커밋 순서: 사진 작업 커밋과 섞지 않고 따로 (테스트 → 그래프 → 문서)

### 제목 속 숫자 강조 (추가 요청)
- 순수 함수(packages/ui/src/lib · 이름은 test 가 정함): 문장을 [글 · 숫자] 조각으로 나눔 — 숫자 · 퍼센트 · 통화 기호 · 단위(원 · 엔 · 달러 · 월)를 한 덩어리로
- 공통 부품(예: `Emph`/`NumberMark`): 바탕(light | sea) · 뜻(neutral | expensive)을 받아 형광펜 띠 · 주홍 글자 · 노란 글자. Title · SectionTitle · 바다 띠 큰 문장이 문장을 이 부품으로 그림
- 커밋 순서: 테스트 → 순수 함수 · 부품 → 화면별 적용 (사진 · 그래프 커밋과 섞지 않음)

## 대안
- next/image: 정적 내보내기(unoptimized)라 크기 변환을 안 해 줌 → 미리 만든 폭별 파일 + srcset.
- 사진을 CSS background-image 로: alt 를 못 달고 우선순위 지정이 어려움 → `<img>`.

## 파일 계획
- .agents/specs/0175-user-photos/**
- .agents/orchestration/TASKS.md
- apps/web/public/images/photos/**
- apps/web/scripts/**
- packages/ui/src/components/**
- packages/ui/src/lib/**
- apps/web/src/app/opengraph-image.tsx
- apps/web/src/app/**
- apps/web/src/features/home/**
- apps/web/src/features/travel-price/**
- apps/web/src/features/import-calc/**
- apps/web/src/features/about/**
- apps/web/src/features/currencies/**
- apps/web/src/shared/**
- apps/web/e2e/**
- docs/design.md

## 계획 밖 변경 이유

## 위험
- 사진 무게로 첫 화면이 느려질 수 있음 → 폭별 파일 · 첫 화면만 우선
- 막이 약하면 큰 제목 대비가 깨짐 → contrast 검사 · 캡처 대조
- Full 게이트 build 는 운영 API 를 읽음 → 개발 중 LOOP=quick, Full 은 lead 가 PR 직전 한 번

## 검증 계획
- test(먼저 FAIL): 사진 파일 · 폭별 파일 존재 · 크기 상한 · PhotoHeader 소스 검사(srcset · sizes · lazy · fetchpriority · alt · 막 종류) · 다섯 화면만 사용(작업실 · 통화 · GEO 없음) · OG 가 plane-sunset 사용 · 막 위 글자 대비 · e2e(다섯 화면 맨 위 사진 보임 · 첫 화면 사진만 즉시)
- 화면: 초안(draft.html) 캡처와 구현 캡처 나란히 → PR

## 계획과 달라진 점

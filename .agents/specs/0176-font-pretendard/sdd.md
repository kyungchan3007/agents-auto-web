# SDD — 어떻게 (0176)

> 요구사항: [prd.md](prd.md)

## 접근
- **글꼴 파일**: `pretendard` 패키지(이미 의존성 · 새 의존성 없음)의 굵기 800 **동적 서브셋**(`dist/web/static/woff2-dynamic-subset/Pretendard-ExtraBold.subset.*.woff2` 92개 · 유니코드 범위별)을 사이트 정적 파일로 복사하고(`apps/web/public/fonts/pretendard/` 등), 같은 패키지의 CSS(`Pretendard-ExtraBold.css` 의 @font-face · unicode-range)를 경로만 바꿔 씀 → 브라우저는 화면에 나오는 글자의 조각만 받음.
  - 복사는 0175 의 사진 스크립트처럼 한 번 돌리는 스크립트로(또는 빌드 전 단계) — 무엇을 고르든 생성 파일만 커밋 · 패키지 버전과 같은 파일임을 테스트로 확인
  - next/font/local 은 unicode-range 조각을 다루기 어려워 쓰지 않음 (대안 참고)
  - 비교: 굵기 800 한 파일 776KB · 가변 글꼴 2MB · 동적 서브셋 합계 1.3MB 지만 실제로 받는 것은 몇 조각
- **토큰**: `tokens.css` 의 `--font-display` 를 Pretendard 로(대체 글꼴: IBM Plex Sans KR · 시스템 고딕). 큰 제목 · 큰 숫자 부품(Title · BigNumber 등)에 굵기 800 · `tracking-[-0.03em]`(또는 토큰). 화면 코드의 `font-display font-normal` 묶음은 부품 · 토큰으로 정리해 굵기를 한곳에서.
- **Gasoek One**: 큰 제목 · 큰 숫자에서 빠지면 로고만 남는다. 로고는 화면을 보고 판단 — 남기면 로고만 쓰는 작은 글꼴로(next/font 의 subset · 글자 'tripfx' 만이면 더 가벼움), 아니면 제거.
- **공유 미리보기(opengraph-image)**: 이미 Pretendard 를 씀 — 그대로.

## 대안
- next/font/local 로 굵기 800 한 파일(776KB): 단순하지만 첫 화면 무게가 큼.
- CDN(jsdelivr) 동적 서브셋: 런타임 외부 요청 — 금지.

## 파일 계획
- .agents/specs/0176-font-pretendard/**
- .agents/orchestration/TASKS.md
- apps/web/public/fonts/**
- apps/web/scripts/**
- apps/web/src/app/layout.tsx
- apps/web/src/app/globals.css
- packages/ui/src/tokens.css
- packages/ui/src/components/**
- packages/ui/src/lib/**
- apps/web/src/features/**
- apps/web/src/shared/**
- apps/web/e2e/**
- docs/design.md

## 계획 밖 변경 이유

## 위험
- 0173 의 '허용 목록에서만 font-display' 검사 · 0168 의 Gasoek 검사가 바뀜 → test 가 새 규칙으로
- 조각 92개를 저장소에 넣음(합계 1.3MB) — 이미지보다 작고 필요한 조각만 받음
- Full 게이트 build 는 운영 API 를 읽음 → 개발 중 LOOP=quick, Full 은 lead 가 PR 직전 한 번

## 검증 계획
- test(먼저 FAIL): --font-display 가 Pretendard · 굵기 800 · 자간 -0.03em · 글꼴 파일 · @font-face(unicode-range) 존재 · 외부 글꼴 주소 없음 · Gasoek 사용처(로고만이거나 없음) · 숫자 강조 · tabular-nums 유지 · e2e(375 · 1440 에서 네 화면 가로 넘침 없음 · 큰 제목 computed font-family 에 Pretendard · weight 800)
- 화면: lead 가 배포 주소를 375 · 1440 으로 확인 (PR 에는 미리보기 주소만)

## 계획과 달라진 점

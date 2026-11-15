# SDD — 어떻게 (0168 공통 기반)

> 요구사항: [prd.md](prd.md) · 기준 디자인: [design-plan.md](design-plan.md) · Figma 화면별 설명: [figma-spec.md](figma-spec.md) · Figma 캡처: `/Users/chan/Documents/develop/harness-auto-web/.tmp/design-c/figma/` · 홈 시안 HTML: `/Users/chan/Documents/develop/harness-auto-web/.tmp/design-c/poster.tpl.html`

## 접근
### 0. 크기 단계 (figma-spec.md "디자인 토큰")
- 포스터 큰 제목 Gasoek One 96/102 · 구간 제목 48/54 · 도시 이름 34/36 · 설명 IBM Plex Sans KR 16/26 · 강조 숫자 SemiBold 26/32 · 작은 글 13/20 — `tokens.css` 의 `--text-*` 로 (모바일은 clamp 로 줄임 · 홈 모바일 제목 약 48)
- 바탕/흰 거품 #FFFFFF (띠 위 글자 · 표 바탕) 도 토큰에

### 1. 토큰 — 이름은 그대로, 값만 새 테마로 (packages/ui/src/tokens.css)
지금 구조(영역마다 `data-surface` 로 바탕을 고르면 글자 · 포인트 · 신호 색이 함께 바뀜)를 살린다. 화면 코드는 `bg-surface` · `text-fg` · `text-cheap` 처럼 토큰 이름만 쓰므로, 값을 바꾸면 모든 화면이 새 테마를 입는다.

| surface | 쓰는 곳 | surface | surface-2 | fg | fg-2 | accent | cheap | expensive | line |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `light` (하늘 종이) | 페이지 기본 바탕 | #EAF4F2 | 종이보다 조금 진한 칸 | #16246E | #4A5A8C | 바다 청록(글자용은 대비 맞춘 진한 값) | #2438A8 | #D9452B | 옅은 남색 |
| `dark` (바다 띠) | 울트라마린 띠 · 지구 자리 · 메뉴 | #2438A8 | 한 단계 짙은 울트라마린 | 종이색/흰색 | 옅은 하늘 | #F7C548 (해 노랑) | 밝은 하늘색(대비 충족) | 밝은 주홍(대비 충족) | 반투명 흰색 |
| `elevated` | 바다 띠 안의 칸 | dark 보다 한 단계 짙은 울트라마린 | … | dark 와 같음 | | | | | |

- **밤 포스터 (R5)**: `@media (prefers-color-scheme: dark)` 에서 `light` 를 짙은 울트라마린(#121C5C 근처) 바탕 · 종이색 글자로 바꾼다. `dark`(바다 띠)는 밤에도 띠로 구분되게 한 단계 밝거나 짙게.
- 정확한 보조 값(surface-2 · line · 대비용 진한 청록 등)은 builder 가 정하고 **contrast.test.ts 가 판정**한다. 순색(#17A398 · #F7C548)이 글자 대비를 못 넘으면 도형(띠 · 점 · 핀)에만 쓰고 글자에는 대비 맞춘 값을 쓴다.
- `--hav-aurora-*`(오로라 그라데이션 글자 · 장식)는 새 테마에서 쓰지 않는다 → 3D 전용으로만 남김 (아래 3).
- `layout.tsx` 의 `<html data-surface>` 기본값과 `viewport.themeColor` 를 하늘 종이(밤 포스터면 울트라마린)로.

### 2. 글꼴 (R3)
- `apps/web/src/app/layout.tsx` 에서 `next/font/google` 으로 Gasoek One(400) · IBM Plex Sans KR(400 · 600)을 불러 CSS 변수로 `<html>` 에 단다 → `tokens.css` 의 `--font-sans` 를 IBM Plex Sans KR 로, 새 `--font-display` 를 Gasoek One 으로. next/font 는 빌드 때 받아 자체 호스팅하므로 런타임 외부 요청이 없다. `next.config` 는 건드리지 않는다.
- 먼저 `node_modules/next/dist/docs/` 에서 next/font 안내를 읽고 이 버전의 API 를 따른다 (AGENTS.md "This is NOT the Next.js you know").
- 큰 제목 · 큰 숫자 컴포넌트(`heading` 의 hero/title · `big-number`)만 `font-display`. 숫자는 `tabular-nums`.

### 3. 3D 색 고정 (R7)
- 새 토큰 `--hav-3d-arc: #4ff0e0` · `--hav-3d-aurora-1/2/3: #4ff0e0 / #9c8cff / #ff8ad8` (어느 surface 에서도 같은 값).
- `packages/ui/src/three/objects/globe.tsx` 의 `tokenColor("--hav-accent", "#4ff0e0")` → `tokenColor("--hav-3d-arc", "#4ff0e0")`. 그 밖에 지구 · 비행기가 읽는 토큰이 있으면 같은 방식. **생김새(텍스처 · 위경도선 · 테두리 빛 · 호 · glb · 조명)는 바꾸지 않는다.**
- 비행기(`plane.tsx`)는 이미 `PLANE_LIGHTS` 등 상수로 색을 갖고 있음 → 그대로. 배경판 · 몸체 색 판단이 `data-surface` 를 읽으므로 새 surface 에서도 자연스러운지 미리보기로 확인.
- block-tower · stations(작업실 장면)는 지구 · 비행기가 아니므로 새 테마 색을 따라가도 된다.

### 4. 메뉴 (R4)
- `apps/web/src/shared/site-nav.tsx` 순서와 주소 (figma-spec.md "라우트 맵"):
  - 여행 타이밍 → `/flights` (홈 맨 위 구간의 자세한 화면) · 오늘 환율 → `/#today` (홈 바다 띠 · 0169 가 `id="today"` 를 단다) · 통화 → `/currencies` · 여행 물가 → `/prices` · 직구 계산 → `/calc` · 작업실 → `/log` · GEO 측정 → `/geo`
  - 로고(tripfx, Gasoek One)는 `/`. 소개(/about)는 메뉴에 없고 바닥 띠에서.
- `packages/ui/src/components/layout/nav-bar.tsx` (figma-spec.md "컴포넌트" 메뉴/데스크톱 · 메뉴/모바일):
  - 데스크톱: 하늘 종이 위 로고 + 메뉴 7칸 한 줄
  - **모바일: 하늘 종이 바탕 · 로고(Gasoek One 22 · 울트라마린) + 메뉴 아이콘(24px)** → 누르면 메뉴 7칸이 펼쳐짐 (키보드 · 화면 읽기 프로그램으로 열고 닫을 수 있게 button · aria-expanded · Esc). 0164 의 320px 두 줄 감싸기는 이것으로 대체하고 `--hav-nav-h` 는 실제 높이로 다시 맞춘다.

### 5. 공통 컴포넌트 (R9)
- `packages/ui/src/components/**` 의 card · panel · data-table · stat-tile · signal-badge · page-section · page-footer · heading · big-number · reveal 등을 새 원칙으로: 테두리 상자 · 둥근 카드 반복 · 그림자 · 장식 그라데이션 · 등장 효과(reveal)를 걷어 내고 큰 글자 · 여백 · 눈금 위주로. 이름 · props 는 가능하면 유지해 화면 코드가 깨지지 않게.
- 새 공통 컴포넌트(0169 · 0170 이 씀) — figma-spec.md "컴포넌트" 표를 따름:
  - **판정 핀**: 둥근 알약 · 세 변형 — 쌈(울트라마린 바탕 · 흰 글 "-4.1% 쌈") · 보통(흰 바탕 · 보조색 2px 테두리 · 남색 글 "+0.4% 보통") · 비쌈(주홍 바탕 · 흰 글 "+2.3% 비쌈") · 글 IBM Plex Sans KR SemiBold 13 — 지금 signal-badge 를 대신
  - **도착지 줄**: 위 2px 울트라마린 선 · 도시(Gasoek One 34) · 통화(13) · 오늘 환율(SemiBold 26 · 오른쪽 정렬) · 쌈~비쌈 눈금(가운데 세로 눈금 = 1년 평균) 위 판정 핀 (모바일은 도시 · 통화와 핀만)
  - **노란 도장**: "면세 한도 안" 같은 판정 도장 (직구 계산이 씀 · 고양이 대체)
  - **바닥 띠**: 출처 한 줄 띠 (page-footer 를 대신)
- `/design` 페이지(디자인 시스템 진열장)는 새 컴포넌트를 보여 주게 맞춘다 — 0170 에서 화면 배치를 다듬되, 이 작업에서 깨지지 않게만.

### 6. 고양이 · 동전 빼기 (R8)
- 화면에서 쓰는 곳: `apps/web/src/app/design/characters.tsx` · `features/currencies/components/coin-slot.tsx` · `features/import-calc/lib/calc.ts`(MoneyMood 타입) · `features/log/components/scenes.tsx` · `features/log/lib/mood.ts` · `three/objects/stations.tsx` · `three/scene/lazy.tsx`.
- 화면에서 빼고, 더 쓰는 곳이 없는 3D 파일(`three/characters/*` · `three/objects/coin.tsx` · lazy 항목)은 지운다 (죽은 코드를 남기지 않음). 직구 계산의 고양이 자리는 0170 에서 노란 도장으로 — 이 작업에서는 고양이를 빼고 자리를 비워 두거나 도장 컴포넌트로 바로 바꿔도 된다.

### 7. 문서 (R10)
- `docs/design.md` 결정 요약을 새 결정(색 · 글꼴 · 원칙 · 3D 유지 · 밤 포스터 · 고양이/동전 제거)으로 갱신. 옛 결정은 "바뀐 결정" 으로 날짜와 함께 한 줄.

## 대안 · 트레이드오프
- **토큰 이름까지 새로(paper/sea …)**: 의미는 분명해지지만 모든 화면 코드를 고쳐야 해 0168 이 너무 커지고 0169 · 0170 과 충돌 → 이름 유지 · 값 교체를 고름. 이름과 뜻이 어긋나는 것(dark = 바다 띠)은 tokens.css 머리 주석에 표로 적는다.
- **글꼴을 CSS @import(구글 폰트 CDN)로**: 런타임 외부 요청 · 첫 화면 늦어짐 → next/font 를 고름.
- **고양이 · 동전 파일을 남겨 둠**: 되살리기 쉽지만 죽은 코드 → 지움 (git 기록에 남음).

## 파일 계획
- .agents/specs/0168-redesign-foundation/**
- .agents/orchestration/TASKS.md
- packages/ui/src/tokens.css
- packages/ui/src/lib/**
- packages/ui/src/components/**
- packages/ui/src/three/**
- apps/web/src/app/layout.tsx
- apps/web/src/app/globals.css
- apps/web/src/app/design/**
- apps/web/src/shared/site-nav.tsx
- apps/web/src/shared/*.test.ts
- apps/web/src/features/currencies/components/coin-slot.tsx
- apps/web/src/features/currencies/**
- apps/web/src/features/import-calc/**
- apps/web/src/features/log/**
- apps/web/e2e/**
- apps/web/e2e-responsive/**
- docs/design.md

## 계획 밖 변경 이유
- apps/web/src/app/manifest.ts · opengraph-image.tsx: 홈 화면 추가 색 · 공유 이미지를 새 테마 색으로 (이미지 그리기는 CSS 변수를 못 읽어 값으로 적음)
- apps/web/src/features/home/** · features/travel-price/**: 삭제한 부품(signal-badge · Reveal · CountUp · 고양이)을 쓰던 곳을 새 부품으로 바꾸는 최소 수정 (배치는 0169 · 0170)
- apps/web/src/app/not-found.tsx 는 그대로(바다 띠 한 장) · 고양이 · 동전을 지운 뒤 비게 된 자리는 비워 둠
- packages/ui/src/components/data/destination-row.tsx · stamp.tsx · signal-pin.tsx (새 파일): sdd 5 의 새 공통 컴포넌트
- 새 토큰 --hav-pin-* · --hav-expensive-shape · --hav-sun (tokens.css): 핀이 자기 색을 가져 어느 배경에서도 같게 · 도형용 주홍 · 해 노랑 도형

## 위험
- 토큰 값이 바뀌면 모든 화면 대비가 다시 잰다 → contrast.test.ts 가 막음. 화면별 하드코딩 색(hex)이 있으면 새 테마와 어긋남 → `grep -rn "#[0-9a-fA-F]\{6\}" apps/web/src` 로 찾아 토큰으로.
- 지구 호 색이 바뀌면 사용자 요구 위반 → 3D 전용 토큰 + 미리보기 캡처로 바꾸기 전과 비교.
- 0169 · 0170 이 이 브랜치 위에 쌓임 → 공통 컴포넌트 props 를 바꾸면 그 위 작업과 충돌. props 는 유지하고 모양만.
- Full 게이트의 build 는 운영 API 를 불러 D1 을 읽는다 → 개발 중에는 `LOOP=quick bash .agents/checks.sh`, Full 은 lead 가 PR 직전에 한 번.

## 검증 계획
- test(먼저 FAIL): contrast.test.ts 에 새 surface(하늘 종이 · 바다 띠 · 밤 포스터) 조합 · 3D 전용 토큰 값 고정 · globe 가 `--hav-3d-arc` 를 읽음(소스 검사) · 메뉴 순서 · 고양이 · 동전 import 가 화면 코드에 없음 · layout 이 두 글꼴을 불러옴(소스 검사) · 판정 핀 · 노란 도장 순수 로직(있다면)
- 게이트: 개발 중 `LOOP=quick`, PR 직전 lead 가 `bash .agents/checks.sh` (Full: build · e2e)
- 화면: PR 미리보기 배포를 홈 · 통화 · 여행 물가 · 여행 타이밍 · 직구 · 작업실 · GEO 를 데스크톱 · 모바일 · 밤 포스터(`colorScheme: dark`)로 lead 가 캡처해 Figma 캡처와 대조, PR 에 첨부

## 계획과 달라진 점
- **비쌈 주홍**: Figma #D9452B 는 하늘 종이 위 글자 3.87 · 흰 글 핀 4.34 로 본문 기준 4.5 미달 (test 계산). 기준을 낮추지 않고, 글자 · 판정 핀은 대비를 넘는 진한 주홍(예: #C13A22 — 흰 글 5.39 · 종이 위 4.81), 그래프 점 · 선 같은 도형은 #D9452B 그대로 (도형 대비 3:1 충족). lead 결정 2026-11-15.
- **3D 판정 색 고정 토큰** `--hav-3d-cheap/normal/expensive` 추가 (test 제안 · lead 수용): 새 쌈 · 비쌈 색이 지구 점 색을 바꾸지 않게 (R7).
- 크기 단계 · 흰 거품 · 3D 토큰 이름(--text-poster 등 · --hav-foam)은 test 가 정한 이름을 따름 (tokens.test.ts 머리 주석).

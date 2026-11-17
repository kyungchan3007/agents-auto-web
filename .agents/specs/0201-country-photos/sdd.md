# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- **사진 파일 (P1)**: 기존 `apps/web/scripts/make-photos.mjs`(sharp · 이미 있음)를 확장하거나 같은 방식으로 `.tmp/country-photos/*.png` → `apps/web/public/images/photos/country-<code 소문자>-{640,1024,1672}.webp` (예: country-jpn · 유럽은 country-eur). 1670 · 1671 폭은 1672×941 로 맞춤(cover). 생성 파일만 커밋 · 원본 PNG 는 커밋하지 않음.
- **사진 규칙 (P2)**: `packages/ui/src/lib/photo.ts` 에 나라 사진 이름을 더함 — `COUNTRY_PHOTOS`(나라 코드 → 사진 이름) · `countryPhoto(country): PhotoName | null` (유로 나라 → eur · 없으면 null). 순수 함수 + 단위 테스트. `photos.test.ts` 의 파일 규칙(이름 목록 · 폭 · 비율 · 크기 상한)을 나라 사진까지 넓힘.
- **PhotoHeader**: `name` 을 바꿀 수 있게 — 고른 나라 사진이 있으면 그 이름, 없으면 화면 기본 이름. 서버 HTML 은 기본 이름(첫 그림 같음) · 마운트 뒤 바뀜(이미 있는 `usePickedDestination` 사용).
- **시트 (P3 · P8)**: `apps/web/src/features/home/components/pick-sheet.tsx` (+ 훅) — 목록 · 검색은 인트로 1단계가 쓰는 같은 자료(`TRAVEL_COUNTRIES` · `TRAVEL_CITIES` · 0192 `searchCurrencies` 와 같은 나라 · 도시 검색 규칙)를 `@hav/shared` 에서 가져옴(인트로 폴더를 가져오지 않음 · 0185 규칙). 고르면 인트로와 같은 방식으로 저장 + `PICK_EVENT` 보냄. 여행 물가에서도 같은 시트를 씀 → 두 화면이 쓰므로 `apps/web/src/shared/` 또는 `packages/ui` 로 올리는 쪽을 builder 가 고르고 이유를 trace 에.
- **여행 물가 머리 (P6)**: price-page 머리 문장 함수에 고른 나라를 넣는 순수 함수(`pickedHeadline(picked, rows)` → "일본은 한국보다 물가가 12% 높습니다" · 자료 없는 나라는 null → 지금 문장). 비율 계산은 기존 문장 함수와 같은 규칙(반올림 · 높습니다/낮습니다/비슷합니다).
- **인트로 창문 (P5)**: window-transition 이 고른 나라 사진을 받음(없으면 지금 사진).

## 대안 · 트레이드오프
- 원본 PNG 를 그대로 싣기 → 55MB · 사진 검사 실패 → 폭별 WebP.
- 나라마다 사진 20장을 모두 미리 불러오기 → 고른 한 장만 (srcset · lazy 아님 머리라 priority).
- 서버에서 나라별 페이지 만들기 → 범위 밖 (고른 값은 브라우저에만 있음).

## 파일 계획
- apps/web/public/images/photos/country-*.webp
- apps/web/scripts/make-photos.mjs
- packages/ui/src/lib/photo.ts
- packages/ui/src/lib/*.test.ts
- packages/ui/src/components/layout/photo-header.tsx
- packages/ui/src/components/** (시트를 디자인 시스템으로 올릴 때만)
- packages/shared/src/domain/travel.ts (고르기 저장 함수가 필요할 때만)
- apps/web/src/shared/**
- apps/web/src/features/home/**
- apps/web/src/features/intro/**
- apps/web/src/features/travel-price/**
- apps/web/e2e/**
- .agents/specs/0201-country-photos/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- `packages/shared/package.json`(exports 한 줄) · `packages/shared/src/domain/destination-search.ts` · `.test.ts` — 여행지 검색은 홈 · 여행 물가 두 기능이 쓰는 공통 모듈이라 앱 공용 폴더에 둘 수 없음(구조 검사 role-boundary). `currency-search`(0192)와 같은 방식.
- `packages/ui/src/components/form/pick-trip.tsx` · `packages/ui/src/hooks/use-pick-trip.ts` · `use-picked-trip.ts` — 시트도 두 기능이 쓰므로 `@hav/ui`(sdd 가 허용한 "시트를 디자인 시스템으로 올릴 때") · 훅은 ui 규칙대로 `hooks/use-*.ts`. ui `package.json` 은 그대로.

## 위험
- 사진 용량: 20장 × 3폭 — 크기 상한을 넘으면 품질을 낮춤 (검사로 막힘).
- 서버 HTML 과 첫 그림이 달라지면 hydration 경고 → 고른 값은 마운트 뒤에만.
- 인트로와 시트가 저장 형식을 다르게 쓰면 서로 못 읽음 → 같은 `@hav/shared/travel` 함수만.
- 빌드 반복 금지 (D1 읽기 한도) — e2e 는 한 번 빌드한 결과로.

## 검증 계획
- 단위: countryPhoto (일본 · 프랑스 → eur · 두바이 → null) · pickedHeadline · 사진 파일 규칙
- e2e: prd 완료 기준
- 미리보기 실제 Chrome (휴대폰 · 넓은 화면)

## 계획과 달라진 점
- **공통 모듈 위치**: 시트 · 검색은 홈과 여행 물가 두 기능이 쓰므로 앱 공용 폴더(`apps/web/src/shared`)가 아니라 승격 — 검색 순수 함수 `packages/shared/src/domain/destination-search.ts`(`@hav/shared/destination-search` · `packages/shared/package.json` exports 한 줄), 시트 `packages/ui/src/components/form/pick-trip.tsx`, 훅 `packages/ui/src/hooks/use-pick-trip.ts` · `use-picked-trip.ts`. (구조 검사 role-boundary 가 앱 공용 폴더를 7개 파일로 고정) → 파일 계획 밖이라 여기에 이유를 적음. ui `package.json` 은 건드리지 않음(`./hooks/*` · `./*` 가 이미 맞음).
- **PhotoHeader**: `country` 속성을 받아 그 나라 사진(`countryPhoto`)이 있으면 쓰고 없으면 `name`. `@hav/ui` 공개 경로가 components 아래뿐이라 `countryPhoto` · `photoSrc` 는 `photo-header.tsx` 에서 다시 내보냄(인트로 창문이 씀).
- **고른 값 읽기**: 홈의 `use-picked-destination`(0185 · 구조 검사가 고정)은 그대로 두고, 여행 물가 · 시트용으로 같은 방식의 `use-picked-trip` 을 ui 에 따로 둠(작은 중복 · 검사를 깨지 않으려고).
- **맨 위 머리**: 서버 HTML 은 그대로(window-fjord · swiss-traveler · 가장 싼 나라 문장) 두고, 클라이언트 감싸개 `PickedPhotoHeader`(홈) · `PricesHeader`(여행 물가)가 마운트 뒤에 고른 값을 읽어 바꿈. 그래서 `price-page.tsx` 의 머리가 `prices-header.tsx` 로 옮겨 가 구조 검사 3개(`photos` · `number-emphasis` · `home-flap-board`)의 파일 경로 · 정규식을 갱신.
- **예산**: 시트에는 예산 입력이 없어 인트로에서 넣은 예산을 이어 쓰고, 없으면 0 → 홈 탑승권 요약에서 예산 줄을 숨김(`picked-board.tsx` · 계획 안).
- **여행 물가 문장 기준**: 구간 3칸과 같은 `BAND_EDGE`(0.9 · 1.1) — 그 사이는 "한국과 물가가 비슷합니다". 안 골랐거나 자료 없는 나라(두바이)는 가장 싼 나라 문장.
- 사진은 `튀르키에.png`(파일 이름 철자가 '튀르키예' 가 아님)를 튀르키예(TUR)로 읽음. 사진 20장 모두 1670~1672×941 → 1672×941 로 cover. 변환은 `make-photos.mjs --countries`.


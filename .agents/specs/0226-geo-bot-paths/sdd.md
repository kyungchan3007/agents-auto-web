# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 계약: packages/shared/src/contracts/geo.ts 의 GeoReport 에 `botPages?: { name, kind, hits, paths: { path, hits }[] }[]` 선택 필드(하위 호환)
- API: apps/api/src/features/geo/summary.ts 의 geoReport 가 이미 받는 rows(30일 창)로 봇 이름별 · 경로별 합계를 만든다. referral · test 는 뺀다. 봇은 합계 많은 순, 경로도 많은 순(같으면 경로 이름순).
- 화면: apps/web/src/features/geo/components/geo-detail.tsx 에 "봇별 읽은 페이지" 카드(시안 B 카드 · BarList 문법) — 봇마다 이름 · 합계 · 상위 경로 막대. 필드가 없거나 비면 빈 상태 글.
- D1: 쿼리 추가 없음. 응답 크기만 조금 늘어남(봇 수 × 경로 수 · 경로는 고정 목록).

## 대안 · 트레이드오프
- 새 SQL(GROUP BY name, path)로 따로 읽기 — 하루 읽기 한도 때문에 고르지 않음(이미 읽은 행을 재사용)
- 기존 pages 를 봇별로 바꾸기 — 하위 호환이 깨져 고르지 않음

## 파일 계획
- packages/shared/src/contracts/geo.ts
- apps/api/src/features/geo/summary.ts · apps/api/src/features/geo/*.test.ts
- apps/web/src/features/geo/** · apps/web/e2e/geo*.spec.ts
- apps/web/.tmp/mock 자료가 있으면 그 파일(테스트용)
- .agents/specs/0226-geo-bot-paths/**

## 계획 밖 변경 이유

## 위험
- 웹이 API 보다 먼저 배포되면 새 필드가 없음 → 화면은 빈 상태 글로 처리(하위 호환)
- 봇 · 경로가 많아지면 카드가 길어짐 → 봇마다 상위 5개로 자름

## 검증 계획
- test 가 먼저: 단위(geoReport 봇별 합계 · referral/test 제외 · 정렬 · 필드 없는 옛 응답 파싱) · e2e(/geo 봇별 카드 · 숫자 = 응답 · 빈 상태 · 1280 · 390 가로 넘침 0)
- 가짜 API 빌드 1회(운영 D1 읽기 0) · 게이트 full · 미리보기 1280 · 390 스크린샷(시안 B 와 같은 구도)
- 머지 뒤 API 배포 확인 · 운영 /geo

## 계획과 달라진 점
- (구현 · 계획대로) 계약: GeoReport.botPages 선택 필드(GeoBotPages · 봇 이름 · 종류 · 합계 · 경로별 횟수) / 집계: geoReport 가 이미 반복하던 real 행(test 제외)에서 referral 을 뺀 봇 행(검색 엔진 봇 포함)을 봇 이름 · 경로로 한 번 더 묶음 — 새 쿼리 없음 · 봇은 합계 많은 순(같으면 이름순) · 경로는 많은 순(같으면 경로 이름순) · 경로는 전부 내려 주고 상위 5개 자르기는 화면이 함(응답이 커져도 경로는 고정 목록) / 화면: lib/geo-bars.ts 의 botPagesView(순수 함수 · 상위 5개 + "그 밖 N곳 · M회") + geo-detail.tsx 의 "봇별 읽은 페이지" 카드(기존 BarList 문법 · 검색 엔진 봇은 accent 막대) · 필드가 없거나 비면 빈 상태 글 "아직 기록이 없습니다."
- 계획과 같은 파일만 바꿈(geo.ts · summary.ts · geo-detail.tsx) + 화면 계산 geo-bars.ts(apps/web/src/features/geo/** 안). 타입 확인은 작업 폴더에 node_modules 가 없어 임시 tsconfig(.tmp/tsc-*.json · 커밋 안 함)로 작업 폴더 계약을 보게 해서 함 · 웹 lint 는 eslint-config-next 가 없어 돌리지 못함(test 가 게이트에서 확인).

# 작업 보드 (상태 공유 · 충돌 방지)

> 작업을 시작하기 전에 행을 추가해 점유하고, 끝나면 상태를 바꾼다. 같은 파일을 두 작업이 동시에 잡지 않는다.

| 번호 | 작업 | 역할 · 담당 | 상태 | 브랜치 | 잡은 파일·폴더 |
| --- | --- | --- | --- | --- | --- |
| 0161 | 사이트맵 "가져올 수 없음" 원인 조사 (#157) | geo · dev-geo@hav (조사만) | 완료 (#157 댓글) | task/0161-sitemap-investigation | 없음 (조사만 · 파일 수정 없음) |
| 0162 | 2026-11-14 AI 답변 세션 측정 · #157 이어서 | geo · dev-geo@hav | 머지됨 (#177) | task/0162-geo-answers-1114 | apps/api/data/geo-answers/2026-11-14.json |
| 0163 | 관세청 과세환율 + 공용 시계열 테이블 | test · dev-test@hav → builder · dev-builder@hav | 머지됨 (#178) | task/0163-customs-rate | apps/api/src/features/indicators/** · apps/api/src/db/schema.ts · apps/api/drizzle/migrations/0010_* · apps/api/src/index.ts · apps/web/src/features/import-calc/** · apps/web/src/bff/proxy.ts |
| 0164 | KOSIS 여행 품목 + 3D 비행기 → 새 페이지 /flights (여행 타이밍) | test → builder · geo | 머지됨 (#179) | task/0164-kosis-travel-price | apps/web/src/app/flights/** · apps/web/src/features/travel-price/** · packages/ui/src/three/objects/plane.tsx · packages/ui/src/components/layout/nav-bar.tsx · apps/web/public/models/plane.glb |
| 0165 | ECOS 수입물가지수 | test → builder | 머지됨 (#181) | task/0165-ecos-import-price | apps/api/src/features/indicators/ecos* · apps/web/src/features/import-calc/** |
| 0166 | 배포 때 인증키 3개를 Worker 에 | builder | 머지됨 (#180) | task/0166-worker-keys | .github/workflows/deploy-api.yml |
| 0168 | 디자인 변경 ① 공통 기반 (토큰 · 글꼴 · 메뉴 · 밤 포스터 · 고양이/동전 제거) | test → builder | 계획 중 | task/0168-redesign-foundation | packages/ui/src/tokens.css · packages/ui/src/components/** · apps/web/src/app/layout.tsx · apps/web/src/shared/site-nav.tsx · docs/design.md |
| 0169 | 디자인 변경 ② 홈 (여행 타이밍 선 그래프 · 비행기 · 울트라마린 띠 · 도착지 핀) | test → builder | 대기 (0168 다음) | task/0169-redesign-home | apps/web/src/features/home/** · apps/web/src/app/page.tsx |
| 0170 | 디자인 변경 ③ 나머지 화면 (통화 · 여행 물가 · 여행 타이밍 · 직구 · 작업실 · GEO · 소개 · 디자인) | test → builder | 대기 (0169 다음) | task/0170-redesign-pages | apps/web/src/features/** (home 제외) · apps/web/src/app/** |
| 0171 | 월간 지표가 비었거나 오래되면 평일 회차에서 채우기 | test → builder | PR 대기 | task/0171-indicator-backfill | apps/api/src/index.ts · apps/api/src/features/indicators/** |
| 0173 | 글꼴 정리 — 큰 제목 · 큰 숫자만 Gasoek One, 나머지 제목 · 도시는 IBM Plex 굵게 | test → builder | 머지됨 (#189) | task/0173-font-readability | packages/ui/src/components/** · packages/ui/src/tokens.css · apps/web/src/app/layout.tsx · apps/web/src/features/** |
| 0174 | 홈 바다 띠 문구 정리 — 예측 아님 · 12시 수집 · 주말 기준일 줄 삭제 (홈만) | test → builder | 머지됨 (#190) | task/0174-home-band-trim | apps/web/src/features/home/** · docs/domain/fx.md |
| 0175 | 화면별 사진 (사용자 사진 5장 · 맨 위 구간 · OG) | test → builder | 머지됨 | task/0175-user-photos | apps/web/public/images/photos/** · packages/ui/src/components/** · apps/web/src/app/opengraph-image.tsx · 다섯 화면 맨 위 구간 |
| 0176 | 큰 제목 · 큰 숫자 글꼴 Gasoek One → Pretendard 800 | test → builder | 머지됨 | task/0176-font-pretendard (base: task/0175) | packages/ui/src/tokens.css · apps/web/src/app/layout.tsx · apps/web/public/fonts/** · 제목 · 숫자 부품 |
| 0177 | 홈 첫 화면 출발 안내판 (사진에 걸치기) | test → builder | 머지됨 | task/0177-flap-board | apps/web/src/features/home/** · packages/ui/src/components/** · packages/ui/src/lib/** |
| 0180 | /geo 자세한 기록 되살리기 (Quick) | geo | 머지됨 | task/0180-geo-detail | apps/web/src/features/geo/** · apps/web/src/app/geo/** |
| 0181 | 여행 타이밍 그래프 숫자 라벨 · 선 구분 (Quick) | builder | 머지됨 | task/0181-flights-graph | apps/web/src/features/travel-price/** |
| 0182 | 2026-11-16 AI 답변 세션 측정 (Quick) | geo | 머지됨 | task/0182-geo-answers-1116 | apps/api/data/geo-answers/2026-11-16.json |
| 0185 | 공항 인트로 — 출발 안내판 입력 · 탑승권 · 스크롤 이륙 · 창문 전환 (Full) | test → builder | 머지됨 | task/0185-intro-airport | apps/web/src/features/intro/** · apps/web/public/models/intro/** · 홈 안내판 · page.tsx |
| 0186 | 패치(버그) — 인트로가 닫힌 뒤 홈 스크롤 · "오늘 환율"에서 인트로가 다시 뜸 | 설치 에이전트 | 머지됨 (#203) | task/0186 | apps/web/src/features/intro/** |
| 0187 | 2026-11-17 AI 답변 세션 측정 — 질문 2판 첫 측정 (Quick) | geo | 머지됨 (#204) | task/0187-geo-answers-1117 | apps/api/data/geo-answers/2026-11-17.json |
| 0191 | 홈 도착지별 환전 타이밍 → "다른 통화 N개 모두 보기" 링크 (#218 · Quick) | builder | PR 대기 | task/0191-currencies-link | apps/web/src/features/home/** · apps/web/e2e/** |
| 0192 | /currencies 통화 검색 · 자동완성 (#219 · Full) | test → builder | PR 대기 | task/0192-currency-search | packages/shared/src/domain/travel.ts · currency-search.ts · apps/web/src/features/currencies/** · intro/lib/places.ts · flow.ts |
| 0193 | 패치(버그) — "이 통화 쓰는 나라 물가 보기"가 그 통화 나라를 보여 줌 (#220 · Quick) | builder | PR 대기 | task/0193-prices-by-currency | apps/web/src/features/travel-price/** · currencies/components/currency-detail.tsx |
| 0194 | 인트로 로딩 화면 · 전환 — 시안 A 출발 안내판이 열림 (#221 · Quick) | builder | PR 대기 | task/0194-intro-loading | apps/web/src/features/intro/** · apps/web/e2e/intro*.spec.ts |
| 0196 | AI 측정 질문 3판 — 브랜드 이름을 플랩 · flapfx 로 (#215) | geo | PR 대기 | task/0196-geo-q3 | apps/api/src/features/geo/** · apps/web/src/features/geo/** · docs/geo-measurement.md |

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
| 0191 | 홈 도착지별 환전 타이밍 → "다른 통화 N개 모두 보기" 링크 (#218 · Quick) | builder | 머지됨 (#223) | task/0191-currencies-link | apps/web/src/features/home/** · apps/web/e2e/** |
| 0192 | /currencies 통화 검색 · 자동완성 (#219 · Full) | test → builder | 머지됨 (#224) | task/0192-currency-search | packages/shared/src/domain/travel.ts · currency-search.ts · apps/web/src/features/currencies/** · intro/lib/places.ts · flow.ts |
| 0193 | 패치(버그) — "이 통화 쓰는 나라 물가 보기"가 그 통화 나라를 보여 줌 (#220 · Quick) | builder | 머지됨 (#225) | task/0193-prices-by-currency | apps/web/src/features/travel-price/** · currencies/components/currency-detail.tsx |
| 0194 | 인트로 로딩 화면 · 전환 — 시안 A 출발 안내판이 열림 (#221 · Quick) | builder | 머지됨 (#227) | task/0194-intro-loading | apps/web/src/features/intro/** · apps/web/e2e/intro*.spec.ts |
| 0196 | AI 측정 질문 3판 — 브랜드 이름을 플랩 · flapfx 로 (#215) | geo | 머지됨 (#226) | task/0196-geo-q3 | apps/api/src/features/geo/** · apps/web/src/features/geo/** · docs/geo-measurement.md |
| 0195 | 플랩 파비콘 · 앱 아이콘 · 남은 이름 검사 (#222) | builder | 머지됨 (#230) | task/0195-flap-icons | apps/web/src/app/icon.svg · apple-icon.png · public/icons/** |
| 0197 | 사이트 이름 표기 플랩 → Flapfx (#228 · Full) | builder | 머지됨 (#229) | task/0197-flapfx-name | apps/web/src/** · apps/api/src/features/geo/** · docs/** · README.md |
| 0198 | 여행 물가 나라 더 보기 · 접기를 알약 버튼으로 · 펼치면 화면 아래에 붙음 (#231) | builder | 머지됨 (#232) | task/0198-fold-button | apps/web/src/features/travel-price/** · apps/web/e2e/** |
| 0199 | 나라 국기(SVG) — 홈 도착지 · 통화 · 여행 물가 (#234) | builder | 머지됨 (#236) | task/0199-country-flags | apps/web/src/features/{home,currencies,travel-price}/** · packages/ui/src/components/data/*flag.tsx |
| 0200 | 직구 계산 배치 — 시안 B (입력 두 줄 · 칸 고정 · 예시 값 · 수입물가 가로 전체 → 과세환율) (#235) | builder | 머지됨 (#237) | task/0200-calc-layout | apps/web/src/features/import-calc/** |
| 0201 | 고른 나라 사진 · 휴대폰 여행지 고르기 · 고른 나라 물가 (#233 · Full) | builder | 머지됨 (#238) | task/0201-country-photos | apps/web/public/images/photos/country-* · packages/ui/src/lib/photo.ts · features/{home,intro,travel-price}/** |
| 0204 | 2026-11-18 AI 답변 세션 측정 (질문 3판 첫 측정) · #157 조사 | geo | 머지됨 | task/0204-geo-answers-1118 | apps/api/data/geo-answers/2026-11-18.json |
| 0205 | 이름 바꾼 날(11-17) 전후 비교 — /geo 맨 위 (#243 · Full) | builder | 머지됨 | task/0205-rename-compare | packages/shared/src/contracts/geo.ts · apps/api/src/features/geo/** · apps/web/src/features/geo/** |
| 0208 | 디자인 1 · 직구 계산 — 휴대폰 결과 위치 · 빈칸 · 한도 넘을 때 줄 · 과세환율 칸 · 그래프 높이 (#247) | builder | 머지됨 | task/0208-design-calc | apps/web/src/features/import-calc/** |
| 0209 | 디자인 2 · 휴대폰 홈 사진 덮개 · 노란 표시줄 (#248 · 기본 나라 사진은 정정으로 뺌) | builder | 머지됨 | task/0209-design-hero | apps/web/src/features/home/** · packages/ui photo-header · emph |
| 0210 | 디자인 3 · 홈 첫 화면 — 고르기 버튼 · 이번 주 제목 · 간격 · 대비 (#249) | builder | 머지됨 | task/0210-design-home | apps/web/src/features/home/** |
| 0211 | 디자인 4 · /flights 비행기가 이름표 가림 · 같은 달 반복 문장 (#250) | builder | 머지됨 | task/0211-design-flights | apps/web/src/features/travel-price/** |
| 0212 | 디자인 5 · 통화 상세 · 여행 물가 다듬기 (#251) | builder | 머지됨 | task/0212-design-detail | apps/web/src/features/{currencies,travel-price}/** |
| 0213 | 디자인 6 · 접근성 · 기본기 묶음 (#252) | builder | 머지됨 | task/0213-design-a11y | packages/ui/src/** · apps/web/src/shared/** · globals.css |
| 0214 | 디자인 7 · /geo 시안 B(막대 · 카드 2열) · /log 시안 A(흰 카드) (#253) | builder | 머지됨 | task/0214-design-geo-log | apps/web/src/features/{geo,log}/** |
| 0215 | 디자인 8 · 색 숫자를 토큰으로 (#254) | builder | 머지됨 | task/0215-design-tokens | packages/ui/src/tokens.css · apps/web/src/features/** |
| 0216 | 새 디자인 공통 — 파랑 메뉴 띠 · B 로고 · 글자판 B 모양 · 카운트업 · 들어오기 부품 | builder | PR 대기 | task/0216-redesign-common | packages/ui/src/** · apps/web/src/shared/site-nav.tsx |
| 0217 | 새 디자인 홈 — 시안 B + 환전 타이밍 A · 국기 · 카운트업 | builder | PR 대기 | task/0217-redesign-home | apps/web/src/features/home/** |
| 0218 | 새 디자인 여행 타이밍 — 시안 A · 머리 글자판 · 탑승권 들어오기 · 지수 카운트업 | builder | PR 대기 | task/0218-redesign-flights | apps/web/src/features/travel-price/** (flights) |
| 0219 | 새 디자인 통화 상세 — 시안 A · 카운트업 · 1년 흐름 그리기 · 통화 검색 · 국기 칩 | builder | PR 대기 | task/0219-redesign-currency | apps/web/src/features/currencies/** |
| 0220 | 새 디자인 여행 물가 — 시안 B · 숫자 카운트업 | builder | PR 대기 | task/0220-redesign-prices | apps/web/src/features/travel-price/** (prices) |
| 0221 | 새 디자인 직구 계산 — 시안 A · 세관 꼬리표 결과 · 과세환율 글자판 | builder | PR 대기 | task/0221-redesign-calc | apps/web/src/features/import-calc/** |
| 0223 | 인트로 끝 '그냥 사라지기' — 비행기가 날아 나가며 파랑 면 · 로고가 메뉴 자리로 · 새 홈 | builder | PR 대기 | task/0223-intro-end-fade | apps/web/src/features/intro/** |
| 0222 | 사진 지우기 — 새 디자인 브랜치 합치기 → 사진 · 사진 부품 · 테스트 · 스크립트 삭제 · /about 사진 없는 머리 | builder | PR 대기 | task/0222-remove-photos | apps/web/public/images/photos/** · packages/ui photo 부품 · apps/web/src/features/about/** |
| 0233 | 패치(버그) — 메뉴 "오늘 환율"이 탑승권 카드로 감 → 환전 타이밍 구역으로 | test → builder → test | 머지됨 (#281) | task/0233-today-anchor | apps/web/src/features/home/** · apps/web/e2e/** |
| 0234 | 항공권 출발일 달력 — 여행 타이밍 새 구역 + SerpApi 수집 (Full · 보호 파일 2곳) | test → builder → test | 머지됨 (#282) | task/0234-airfare-calendar | apps/api/src/features/airfare/** · schema.ts · deploy-api.yml · features/travel-price/** |
| 0236 | 2026-11-20 AI 답변 세션 측정 결과 (claude-desktop 측정 · Quick) | geo | 머지됨 (#284) | task/0236-geo-answers-1120 | apps/api/data/geo-answers/2026-11-20.json |
| 0237 | 팀 구성 — geo 알리기 · 데이터 지킴이 자리(data) (Quick · 문서 · 템플릿) | builder → test | 머지됨 (#285) | task/0237-team-geo-data | .agents/orchestration/team.md · rigs/hav/rig.template.yaml |
| 0238 | CI e2e 병렬 — playwright workers · fullyParallel · 게이트 전후 시간 (Full) | builder → test | 머지됨 (#286) | task/0238-e2e-parallel | apps/web/playwright.config.ts |
| 0239 | 팀 규칙 다듬기 — 실패한 것만 다시 · 새 자료 빈 화면 알림 · 공용 파일 끝 금지 · 처음부터 한국어 · 묶음 끝 새로 열기 (Quick) | builder → test | 머지됨 (#287) | task/0239-team-rules | .agents/orchestration/team.md · rigs/hav/rig.template.yaml |
| 0240 | data · geo 첫 바퀴 — docs/data-health.md · 알림 초안 11-20 (Quick) | data · geo → test | 머지됨 (#288) | task/0240-data-geo-first | docs/data-health.md · docs/marketing/2026-11-20/** |
| 0241 | 패치(버그) — 항공권 달력 e2e 가 운영 자료로 돌아 실패 → 값 의존 테스트는 고정 자료 빌드에서만 (Full) | test | 머지됨 (#289) | task/0241-airfare-e2e-fixture-only | apps/web/e2e/airfare-calendar.spec.ts |
| 0242 | 흔들리는 e2e 고치기 — 고정 대기 대신 움직임 끝 기다리기 (Full) | test | 머지됨 (#290) | task/0242-flaky-e2e | apps/web/e2e/{currency-chart,detail-design,prices-route,pages}.spec.ts |
| 0243 | 게이트 — Quick PR 도 CI e2e(문서 · 측정만이면 건너뜀) · 작업 기록 검사 먼저 · 라벨 이벤트는 harness-approved 만 (Quick · 보호 파일 3곳) | test → builder | 진행 중 | task/0243-gate-quick-e2e | .agents/checks.sh · .agents/scripts/** · .github/workflows/checks.yml |
| (후보) | 흔들리는 e2e 다음 묶음 — calc-design.spec.ts:70(휴대폰) · prices-route.spec.ts:229 (0242 · 0238 CI 에서 흔들림) | test | 다음 작업 후보 | — | apps/web/e2e/{calc-design,prices-route}.spec.ts |

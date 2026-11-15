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
| 0175 | 화면별 사진 (사용자 사진 5장 · 맨 위 구간 · OG) | test → builder | PR 대기 | task/0175-user-photos | apps/web/public/images/photos/** · packages/ui/src/components/** · apps/web/src/app/opengraph-image.tsx · 다섯 화면 맨 위 구간 |

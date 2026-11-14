# 작업 보드 (상태 공유 · 충돌 방지)

> 작업을 시작하기 전에 행을 추가해 점유하고, 끝나면 상태를 바꾼다. 같은 파일을 두 작업이 동시에 잡지 않는다.

| 번호 | 작업 | 역할 · 담당 | 상태 | 브랜치 | 잡은 파일·폴더 |
| --- | --- | --- | --- | --- | --- |
| 0161 | 사이트맵 "가져올 수 없음" 원인 조사 (#157) | geo · dev-geo@hav (조사만) | 완료 (#157 댓글) | task/0161-sitemap-investigation | 없음 (조사만 · 파일 수정 없음) |
| 0162 | 2026-11-14 AI 답변 세션 측정 · #157 이어서 | geo · dev-geo@hav | PR 대기 | task/0162-geo-answers-1114 | apps/api/data/geo-answers/2026-11-14.json |
| 0163 | 관세청 과세환율 + 공용 시계열 테이블 | test · dev-test@hav → builder · dev-builder@hav | 진행 중 (builder) | task/0163-customs-rate | apps/api/src/features/indicators/** · apps/api/src/db/schema.ts · apps/api/drizzle/migrations/0010_* · apps/api/src/index.ts · apps/web/src/features/import-calc/** · apps/web/src/bff/proxy.ts |
| 0164 | KOSIS 여행 품목 + 3D 비행기 | test → builder | 대기 (0163 다음) | task/0164-kosis-travel-price | apps/web/src/features/travel-price/** · packages/ui/src/three/objects/plane.tsx · apps/api/src/features/indicators/kosis* |
| 0165 | ECOS 수입물가지수 | test → builder | 대기 (0164 다음) | task/0165-ecos-import-price | apps/api/src/features/indicators/ecos* · (화면 위치는 plan 에서) |

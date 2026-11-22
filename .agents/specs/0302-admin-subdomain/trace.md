# 추적 — 요구 ↔ 코드 ↔ 테스트

| 요구 | 코드 | 테스트 |
| --- | --- | --- |
| ADM-01 · 02 · 03 · 04 · 05 · 09 · 10 | apps/web/worker/host.ts · index.ts | apps/web/worker/host.test.ts · index.test.ts |
| ADM-06 | apps/web/src/shared/site-nav.tsx | redesign-foundation.test.ts · e2e common-design · pages · intro |
| ADM-07 | apps/web/src/shared/site.ts · app/log/page.tsx · app/geo/page.tsx | flights-page.test.ts |
| ADM-08 | apps/web/src/features/about/lib/criteria.ts | criteria.test.ts · e2e pages |
| (설정) | apps/web/wrangler.jsonc | worker/routes.test.ts |

## 작업 기록
- 2026-11-22 · claude-desktop 이 직접 구현(사용자: "굳이 팀에게 넘길 필요 없을 거 같고")
- 로컬: 단위 956 통과 · typecheck · 바꾼 파일 lint 통과 · e2e 는 main PR 의 전체 e2e 에서

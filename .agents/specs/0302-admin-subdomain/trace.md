# 추적 — 요구 ↔ 코드 ↔ 테스트

| 요구 | 코드 | 테스트 |
| --- | --- | --- |
| ADM-01 · 02 · 03 · 04 · 05 · 09 · 10 | apps/web/worker/host.ts · index.ts | apps/web/worker/host.test.ts · index.test.ts |
| ADM-06 | apps/web/src/shared/site-nav.tsx | 메뉴를 고정한 단위 · e2e(작업하며 채움) |
| ADM-07 | apps/web/src/shared/site.ts · app/log/page.tsx · app/geo/page.tsx | sitemap-entries.test.ts 등 |
| ADM-08 | apps/web/src/features/about/lib/criteria.ts | criteria.test.ts |

## 작업 기록
- 2026-11-22 · claude-desktop 이 직접 구현(사용자: "굳이 팀에게 넘길 필요 없을 거 같고")

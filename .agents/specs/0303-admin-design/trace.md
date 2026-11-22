# 추적 — 요구 ↔ 코드 ↔ 테스트

| 요구 | 코드 | 테스트 |
| --- | --- | --- |
| ADD-01 | packages/ui/src/components/admin/admin-shell.tsx · apps/web/src/shared/admin-nav.tsx | e2e admin.spec "어드민 틀" |
| ADD-02 | admin-shell.tsx(찾기 창) · packages/ui/src/lib/match.ts | match.test.ts · e2e admin.spec "찾기 창" |
| ADD-03 | admin-shell.tsx(단축키) | e2e admin.spec "숫자 단축키" |
| ADD-04 | features/log/components/** · hooks/use-site-status.ts · use-now.ts · lib/team.ts | team.test.ts · site-story.test.ts · e2e admin.spec "작업실" · pages.spec |
| ADD-05 | features/geo/components/** · hooks/use-question-table.ts · use-bot-kind.ts · use-day-pick.ts | e2e admin.spec "GEO 측정" · rename-compare.spec · geo-bot-pages.spec |
| ADD-06 · 07 | features/how/** · app/how/page.tsx | e2e admin.spec "만드는 방식" |
| ADD-08 | flap.tsx · admin.css(prefers-reduced-motion) | e2e admin.spec "움직임 줄이기" |
| ADD-09 | worker/host.ts · routes.ts · wrangler.jsonc | host.test.ts · routes.test.ts |

## 작업 기록
- 2026-11-22 · claude-desktop 이 직접 구현(어드민 작업 · 사용자 "이대로 진행")
- 로컬: 단위(웹 953 · ui 309) · typecheck · 바꾼 파일 lint · 하네스 80 · 바꾼 spec 6개(admin · rename-compare · common-design · pages · features · a11y) 통과 · admin.spec 세 번 흔들림 없음

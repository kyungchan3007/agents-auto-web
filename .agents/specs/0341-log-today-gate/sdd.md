# SDD: 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 수집: 기존 sync-tasks.yml(이슈 · PR 목록 → D1 github_items)에 단계 둘을 더한다.
  - 가장 최근 "오늘 할 일 " 제목 이슈 본문을 받아 체크 항목(`- [ ]` / `- [x]`)만 뽑는다. 본문 글은 데이터일 뿐(셸에 끼우지 않고 파일로만 · 변환기에서 이스케이프).
  - `gh api repos/{repo}/actions/workflows/checks.yml/runs?per_page=30` 에서 끝난 실행 최근 20번: 결과 · 시작 · 끝 시각 · 연결된 PR 번호.
  - 검사가 끝날 때도 갱신되도록 트리거에 `workflow_run: ["검사 · 자동 검사 (PR · main)"] completed` 를 더한다.
- 저장: 새 표 `team_snapshots`(key text PK: "today-issue" | "gate-runs", body text(JSON), synced_at). 새 마이그레이션 하나.
- API: 기존 tasks 응답(GET /tasks 계열)에 두 값을 더하거나 새 GET 하나. 계약은 packages/shared/tasks 에 타입 추가.
- 어드민: features/log/records/ 의 RecordCard 를 두 부분 카드로 바꾼다. 계산(개수 · 가운데 값)은 lib, 그리기만 tsx, 받기는 커스텀 훅.

## 대안 · 트레이드오프
- Worker 가 GitHub API 를 바로 부르기: 표 · 마이그레이션 · 워크플로가 필요 없지만, 토큰 없이 시간당 60번 한도를 Cloudflare 공용 IP 가 나눠 써 자주 실패할 수 있고 새 비밀값이 필요해 고르지 않음.
- github_items 에 열 더하기: 표의 뜻(이슈 · PR 한 줄)이 흐려져 고르지 않음.

## 파일 계획
- apps/api/src/db/schema.ts (보호 · 새 표)
- apps/api/drizzle/migrations/** (보호 · 새 파일 하나만 추가)
- .github/workflows/sync-tasks.yml (보호 · 단계 · 트리거 추가)
- apps/api/scripts/tasks-sql.ts · apps/api/scripts/team-snapshot-sql.ts
- apps/api/src/features/tasks/**
- packages/shared/src/tasks*
- apps/admin/src/features/log/records/**
- apps/admin/src/features/log/log-page.tsx
- apps/api/src/**/*.test.ts · apps/admin/src/**/*.test.ts · apps/admin/e2e/** (test)
- .agents/specs/0341-log-today-gate/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 위험
- 보호 파일 셋(schema.ts · 새 마이그레이션 · sync-tasks.yml): 사용자 승인 뒤에만.
- 이슈 본문은 남이 쓸 수 있는 글: 체크 항목만 뽑고 길이 제한 · 이스케이프.
- 첫 수집 전에는 두 부분 모두 "자료 없음"으로 보인다.

## 검증 계획
- 단위: 체크 항목 뽑기 · 실행 요약(개수 · 가운데 값 · 실패 PR) · SQL 이스케이프.
- 어드민 e2e: 자료 있음 · 없음 두 경우(고정 자료).
- CI gate.

## 계획과 달라진 점

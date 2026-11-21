# Trace — 과정 기록

> 판단과 이유를 작업하면서 남긴다. 나중에 재구성하지 않는다

| 순서 | 단계 | 한 일 | 판단 · 이유 |
| --- | --- | --- | --- |
| 1 | 받기 (lead) | 작업서를 0246 으로 받음 · worktree .tmp/wt-0246 에서 작업 | 작업서 주의: 주 작업 폴더에서 브랜치를 바꾸면 claude-desktop 게이트가 흔들림 |
| 2 | 설계 (lead) | 하루 마무리 판정 = 라벨 + 파일 규칙 재사용 · 라벨은 GITHUB_EVENT_PATH 로 읽음 · 워크플로 안 바꿈 | API 토큰 · 워크플로 변경 없이 되고, 틀려도 막는 쪽. 대신 design 라벨은 PR 열 때 달아야 함(지금 워크플로는 다른 라벨 이벤트로 다시 돌지 않음) |
| 3 | 문서 (builder) | AGENTS.md · verdict.md · team.md · rig 템플릿 · design-tests-pending.md (3cfea85) | test 와 파일이 겹치지 않아 test 먼저 단계와 나란히 진행 |
| 4 | 결정 (builder) | vitest -t 음의 전방탐색으로 @design 나누기 · 빈 경우 PASS | 설정 파일 · 새 의존성 없이 됨 |

## 허점

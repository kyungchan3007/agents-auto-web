# Trace — 과정 기록

> 판단과 이유를 작업하면서 남긴다. 나중에 재구성하지 않는다

| 순서 | 단계 | 한 일 | 판단 · 이유 |
| --- | --- | --- | --- |
| 1 | 받기 (lead) | 작업서를 0246 으로 받음 · worktree .tmp/wt-0246 에서 작업 | 작업서 주의: 주 작업 폴더에서 브랜치를 바꾸면 claude-desktop 게이트가 흔들림 |
| 2 | 설계 (lead) | 하루 마무리 판정 = 라벨 + 파일 규칙 재사용 · 라벨은 GITHUB_EVENT_PATH 로 읽음 · 워크플로 안 바꿈 | API 토큰 · 워크플로 변경 없이 되고, 틀려도 막는 쪽. 대신 design 라벨은 PR 열 때 달아야 함(지금 워크플로는 다른 라벨 이벤트로 다시 돌지 않음) |
| 3 | 문서 (builder) | AGENTS.md · verdict.md · team.md · rig 템플릿 · design-tests-pending.md (3cfea85) | test 와 파일이 겹치지 않아 test 먼저 단계와 나란히 진행 |
| 4 | 결정 (builder) | vitest -t 음의 전방탐색으로 @design 나누기 · 빈 경우 PASS | 설정 파일 · 새 의존성 없이 됨 |
| 5 | 테스트 먼저 (test) | 하네스 테스트 1e20933 (구현 전 FAIL 15개) | 함수 계약 designPr(files,{labels,target}) · readLabels(eventPath) 를 테스트 머리에 고정 |
| 6 | 구현 (builder) | design-pr.mjs · checks.sh 6229cf1 · 하네스 69/69 | lib.mjs 는 바꿀 필요 없었음 |
| 7 | 표시 (test) | @design e2e 31 · 단위 21 (c0f6657) · fonts 첫 테스트는 둘로 나눔 | 홈 spec 세 개는 0247 이 되돌리므로 뺌 · 사용자 조건(첫 화면 · 가로 넘침 · 입력 칸 높이) · 대비 · 겹침은 기능 |
| 8 | 확인 (test) | checks.sh 명령 그대로 로컬: 단위 기능 1215 · 디자인 21 = 전체 · @design 없는 패키지 exit 0 · e2e grep 나뉨 · 전부 표시된 spec 의 'No tests found' 는 막는 쪽 PASS | 이 PR 은 평소 PR 이라 CI 가 디자인 경로를 타지 않음 → 로컬로 대신 확인. 첫 디자인 PR 에서 CI 로그를 다시 본다 |

## 허점
- 새 worktree 는 의존성이 덜 깔려 로컬 게이트가 typecheck · lint 에서 실패함(0247 에서 확인) — 판정은 CI · 로컬 확인은 주 폴더 의존성이 있는 자리에서.
- spec:new 는 develop 기준 번호를 매겨, 아직 머지 안 된 작업(0246)과 같은 번호를 줌(0247 이 처음에 0246-home-revert 로 만들어짐) — 나란히 여는 작업은 번호를 직접 확인.
- 디자인 PR 경로는 이 PR 의 CI 로 검증되지 않음 — 첫 design 라벨 PR 의 CI 로그에서 '디자인 PR: 예' · 막지 않음 묶음을 확인한다.

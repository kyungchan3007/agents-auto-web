# 계획

## 무엇을 · 왜
- 팀 역할 문서(.agents/orchestration/team.md)에 "테스트 일은 전부 test · builder 는 구현만"을 적는다. 사용자가 builder 가 e2e 를 돌리는 것을 보고 정한 규칙이고, 새 디자인 마지막 묶음(그래프 2D)부터 이미 이렇게 나눠 진행했다.
- 바뀌는 곳: lead(builder 큐 · test 큐로 나눠 넣고 순서 조율 · 단계별 커밋 원칙 유지) · builder(구현만 · 테스트 실행 안 함 · 끝나면 커밋 · 푸시 · 보고) · test(테스트 일 전부 — 테스트 먼저 커밋 · 단위 · e2e · 게이트 · 미리보기 1280 · 390 확인 · 시안 비교 캡처)

## 애매한 곳
- 보호 파일(team.md) — 사용자 승인 받음(확인됨: '넣어'). PR 에 harness-approved 라벨은 사용자가 직접 담. ALLOW_PROTECTED 로 게이트를 넘기지 않음
- 작업 보드(TASKS.md)도 보호 파일이라 이번에는 줄을 더하지 않음(가정 · 승인 범위는 team.md 하나)

## 파일 계획
- .agents/orchestration/team.md
- .agents/specs/0224-team-role-split/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] team.md 에 승인받은 diff(.tmp/role-split-1118/team.md.diff)대로 반영
- [ ] bash .agents/checks.sh — 보호 파일 검사는 사람이 라벨을 달기 전까지 실패가 정상(그 밖은 PASS)

## 허점
-

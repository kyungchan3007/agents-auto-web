# 계획 — 작업 0239 · 팀 규칙 다듬기 (Quick · 문서)

## 무엇을 · 왜
- 작업서 B 절 1 ~ 5 를 team.md 와 rigs/hav/rig.template.yaml 시작 안내문에 넣는다. 근거는 0234 에서 test 가 e2e 를 고칠 때마다 파일 전체(64개)를 다시 돌린 것 · 빈 미리보기를 "시안이 안 들어갔다"로 받아들인 것 · globals.css 끝 머지 충돌 세 번 · 영어로 쓰다 훅에 걸린 횟수.

## 바뀌는 것 (builder · 0237 과 같은 방식)
1. test 절: 고치는 동안은 실패한 것만 다시(e2e `--last-failed` 또는 실패한 spec 이름 · 단위는 실패한 파일만). 파일 전체 · 로컬 전체 게이트는 다 고친 뒤 한 번. PR 전 로컬 전체 게이트도 한 번이 원칙.
2. lead 절(+ 공통): 새 자료를 받는 작업(수집 · 새 API)은 PR 본문과 사용자 회신 맨 위에 "운영에 자료가 생기기 전까지 미리보기 · 운영에 빈 상태로 보입니다. 첫 수집: 언제" + 고정 자료로 본 비교 캡처 경로.
3. builder 절(+ 공통): 같은 공용 파일 끝에 덧붙이지 않는다 — 화면 스타일은 기능 폴더 안 파일이나 tokens.css. globals.css 끝에 이어 쓰지 않는다.
4. 공통: 처음부터 한국어로 쓴다 — 중간 보고 · 커밋 메시지 · 생각 정리 한 줄도 한국어로 시작.
5. lead 절: 작업 묶음 하나가 끝나면 자리를 새로 연다 — 새로 여는 일은 claude-desktop, lead 는 "묶음 끝"을 알린다.
- rig 템플릿: 각 자리 시작 안내문에 해당 줄을 짧게.
- 횟수 숫자(lead 55 등)는 문서에 넣지 않는다(곧 낡음 · 근거는 request.md 에).

## 파일 계획
- .agents/orchestration/team.md
- rigs/hav/rig.template.yaml
- .agents/orchestration/TASKS.md
- .agents/specs/0239-team-rules/**

## 계획 밖 변경 이유
-

## 완료 기준
- [ ] bash .agents/checks.sh PASS (verdict.md 규칙)
- [ ] PR 최신 커밋 CI gate SUCCESS
- [ ] B 1 ~ 5 가 두 파일에 빠짐없이 (lead 대조)

## 허점
-

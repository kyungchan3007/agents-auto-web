# 계획 — 작업 0239 · 팀 규칙 다듬기 (Quick · 문서)

## 무엇을 · 왜
- 작업서 B 절 1 ~ 5 를 team.md 와 rigs/hav/rig.template.yaml 시작 안내문에 넣는다. 근거는 0234 에서 test 가 e2e 를 고칠 때마다 파일 전체(64개)를 다시 돌린 것 · 빈 미리보기를 "시안이 안 들어갔다"로 받아들인 것 · globals.css 끝 머지 충돌 세 번 · 영어로 쓰다 훅에 걸린 횟수.

## 바뀌는 것 (builder · 0237 과 같은 방식)
1. (09:11Z 수정 · request.md 끝 '수정 — B-1') test 절 · 공통 · verdict.md: 로컬에서는 바뀐 곳 · 실패한 곳만, 전체 e2e 는 CI 에 맡긴다.
   - Full 작업: 로컬 전체 e2e · 로컬 전체 게이트를 돌리지 않는다. 바뀐 화면 spec 과 실패한 spec 만(`--last-failed` · spec 이름). 푸시하면 CI 가 전체를 본다. CI 에서 실패한 spec 만 로컬에서 고치고 다시 푸시.
   - Quick 작업: CI 가 e2e 를 안 돌리므로 화면을 바꿨으면 그 화면 spec 만 로컬에서. 단위 · typecheck · lint 는 CI 가 돈다.
   - 판정은 verdict.md 그대로(최신 커밋 CI gate = COMPLETED + SUCCESS). 로컬 전체 게이트 PASS 는 더 이상 PR 전 조건이 아니다 — verdict.md "게이트 판정 규칙" 1절(로컬 게이트)과 첫 문장("둘 다"), 4절 보고 형식, team.md 의 lead · test · 공통 해당 문장을 이에 맞게 고친다.
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
- .agents/orchestration/verdict.md
- AGENTS.md
- .agents/specs/0239-team-rules/**

## 계획 밖 변경 이유
- AGENTS.md (보호 파일 · 사용자 승인 09:18Z) — 규칙 1 "완료 = checks.sh PASS" 를 "완료 = PR 최신 커밋 CI gate(checks.sh) 통과" 로. 로컬 전체 게이트를 돌리지 않는 새 규칙과 헷갈리지 않게

## 완료 기준
- [ ] bash .agents/checks.sh PASS (verdict.md 규칙)
- [ ] PR 최신 커밋 CI gate SUCCESS
- [ ] B 1 ~ 5 가 두 파일에 빠짐없이 (lead 대조)

## 허점
-

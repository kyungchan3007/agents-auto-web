# 계획

## 무엇을 · 왜
- 로컬 e2e 범위 규칙(team.md 43 · 49 ~ 51줄 · verdict.md 23 · 25줄 — "로컬 전체 e2e · 로컬 전체 게이트는 돌리지 않는다 · 바꾼 기능의 e2e 는 e2e-select.mjs 가 찍는 spec 목록으로")이 문서에만 있어 두 번 어겨졌다(2026-11-22 lead 가 test 지시에 spec 을 덧붙여 사실상 전체 · test 가 연결표 전체를 돌림). 실행 직전에 막는 PreToolUse 훅으로 강제한다.
- 막는 것
  - spec 을 지정하지 않은 로컬 e2e 실행(`playwright test` · `npm run test:e2e` · `turbo run test:e2e` 등) — 전체 실행
  - `e2e-select.mjs` 가 그 작업 폴더에서 고른 spec 목록 밖의 spec 실행
  - spec 이름이 아닌 걸러내기 인자(예: `prices`)로 고르는 실행 — 무엇이 돌지 알 수 없음
  - 로컬 전체 게이트: Full 작업(prd · sdd 있음 또는 LOOP=full)에서 `bash .agents/checks.sh` — 로컬에서 build + 전체 e2e 를 돌림
- 허용하는 것: 목록 안 spec 지정 실행 · `--last-failed`(CI · 앞선 실행에서 실패한 것만) · `--list` · 단위(vitest) · typecheck · lint · Quick 작업의 checks.sh(e2e 없음)
- 범위 계산은 명령이 실행되는 작업 폴더(첫 `cd` · 세션 cwd → git 최상위) 기준: 그 폴더의 바뀐 파일(origin/develop 갈림점부터) + 그 폴더의 `.agents/e2e-map.json` 으로 `selectE2e(target: develop)`.
- 훅 스크립트가 스스로 고장 나면(예외 · git 실패) 막지 않고 통과시킨다 — 훅 때문에 일이 멈추지 않게.

## 애매한 곳
- 막힐 때 사람이 풀 길(예: 환경 변수)은 두지 않는다 — 에이전트가 같은 변수로 빠져나갈 수 있어서. 전체 e2e 는 원래대로 main 으로 가는 PR 에서 CI 가 돈다. (가정)
- 프로젝트(넓은 화면 · 휴대폰)는 제한하지 않는다 — 규칙 문장이 spec 범위만 정함. (가정)
- `apps/web/e2e-responsive/**`(운영 화면 크기별 확인)는 로컬 대상이 아니므로 목록 밖으로 막힌다. (가정)

## 파일 계획
- .agents/scripts/e2e-guard.mjs — 새 훅(명령 읽기 · 범위 계산 · 판정)
- .claude/settings.json — PreToolUse(Bash)에 훅 연결
- .agents/scripts/harness.test.mjs — 훅 판정 테스트
- .agents/orchestration/team.md — test 절에 "훅이 막는다" 한 줄
- .agents/specs/0294-e2e-guard/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI gate · 보호 파일은 harness-approved 라벨)
- [ ] 하네스 테스트: 전체 실행 · 목록 밖 spec · 걸러내기 인자 · Full checks.sh 는 막고, 목록 안 spec · --last-failed · Quick checks.sh · 단위 · e2e 아닌 명령은 통과
- [ ] 머지 뒤 주 작업 폴더를 develop 최신으로 맞춰 훅이 실제로 켜짐(훅 설정은 주 작업 폴더의 .claude/settings.json 을 읽음)

## 허점
- 규칙이 문서에만 있으면 지시하는 쪽(lead)이 덧붙인 범위가 규칙을 이긴다. 같은 허점이 두 번 나와 훅으로 막는다.
- 명령을 다른 모양으로 감싸면(스크립트 파일 안에서 실행 등) 빠져나갈 수 있다. 흔한 모양(npx · pnpm exec · node_modules/.bin · npm/pnpm/yarn run · turbo · npm -w)은 잡는다.
- 훅 설정은 세션을 열 때 읽히므로, 이미 떠 있는 팀 자리에는 다시 열어야 적용될 수 있다.

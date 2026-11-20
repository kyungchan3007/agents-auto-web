# 계획 — 작업 0244 · develop 브랜치 흐름 + e2e 줄이기 (Quick · 워크플로 변경 없음 · 이 PR 은 e2e 없음)

## 무엇을 · 왜
- 푸시마다 게이트가 13 ~ 18분 걸려 일을 못 한다(사용자). 브랜치를 main(운영) · develop(모으는 곳) · task/NNNN(develop 에서 땀)으로 나누고, e2e 를 **PR 의 대상 브랜치**에 따라 다르게 돌린다.
  - 대상 develop: 연결표로 고른 spec 만 · 넓은 화면만
  - 대상 main(하루 마무리 · 반영 · 급한 버그): 전체 e2e · 넓은 화면 + 휴대폰
  - 둘 다: 조용한 파일(`.agents/**` · `docs/**` · `*.md` · `apps/api/data/**` · **`rigs/**` 추가**)뿐이면 e2e 없음
- 단위 · 타입 · 린트는 CI 에서도 그대로(약 40초 보험). 팀은 로컬에서 단위 전체를 돌린 뒤 푸시.

## 결정 (lead)
- **Full 루프라도 대상 develop 이면 같은 규칙**(연결표 e2e · 넓은 화면만). 전체는 하루 마무리 PR 에서 본다. (작업서 권장 그대로)
- **연결표 위치: `.agents/e2e-map.json`** — 조용한 파일이라 이 PR 에 e2e 가 돌지 않고, 연결표만 고치는 PR 도 가볍다. 형식: `{ "경로 접두어": ["spec 파일 이름", …] }` + `"smoke": [주요 페이지 spec …]` (홈 · 환율 · 여행 물가 · 여행 타이밍 · 직구 계산 — 고를 spec 은 test). 관리는 test.
- **연결표에 없는 화면 파일이 바뀌면**: 그 PR 은 smoke spec + 경고 줄(전체는 하루 마무리).
- 로컬 `checks.sh` 는 지금처럼 e2e 를 돌리지 않는다(CI 에서만 고름). 대신 `node .agents/scripts/e2e-select.mjs` 가 지금 바뀐 파일로 고른 spec 목록을 찍어 팀이 로컬에서 그것만 돌릴 수 있게 한다.
- main push 이벤트(fast-forward 뒤)는 지금처럼 e2e 없음 — PR 에서 이미 전체를 봄.

## 바뀌는 것
1. `.agents/scripts/lib.mjs` — `baseRef()`: CI(PR) 이면 `origin/$GITHUB_BASE_REF` 와의 갈림점 · 로컬은 `origin/develop` → `origin/main` 순서. protected-check · scope-check · stop-gate · e2e 판정이 같은 함수를 쓰니 함께 맞음(하네스 테스트로 확인).
2. `.agents/scripts/e2e-needed.mjs` — 조용한 파일에 `rigs/` 추가.
3. `.agents/scripts/e2e-select.mjs`(새로) — 바뀐 파일 + 연결표 → `{ mode: "none" | "selected" | "smoke" | "full", specs: [...], projects: [...], warn?: string }`. 대상 main → full · 두 프로젝트 / 대상 develop → selected(넓은 화면) · 연결표 밖 화면 파일 있으면 smoke + warn / 조용한 파일뿐 → none.
4. `.agents/checks.sh` — CI(PR) 에서 e2e-select 결과대로 build + `npm run -s test:e2e -- --project=<…> <spec…>`. 결과 줄 형식 · 작업 기록 먼저(0243)는 그대로.
5. `.agents/e2e-map.json`(새로 · test) — e2e/*.spec.ts 51개 전부를 경로 접두어에 연결 + smoke 목록.
6. `.agents/scripts/harness.test.mjs`(test) — (a) e2e/*.spec.ts 가 모두 연결표에 있음 (b) 고르기 결과(대상 main/develop · 조용한 파일 · 연결표 밖) (c) baseRef 가 GITHUB_BASE_REF 를 따름 (d) rigs/ 는 조용한 파일.
7. `.agents/orchestration/team.md` · `rigs/hav/rig.template.yaml` — 팀 규칙: 로컬 = 단위 · 타입 · 린트 전체 + 바꾼 기능 e2e(e2e-select) 뒤 푸시 · 새 기능은 연결표 한 줄까지가 작업(test) · 브랜치 · 작업 폴더는 origin/develop 에서 · PR base develop(예외만 main) · lead 는 하루 마무리 PR(develop → main · fast-forward) · data/geo 반영 PR(cherry-pick → main) 을 연다 · 머지는 "머지해" 뒤 claude-desktop · data · geo 안내문에 "develop PR → 반영 PR 로 같은 날 main".
- `.github/workflows/**` 는 건드리지 않는다.

## 누가 · 순서
1. test — 연결표 초안(.agents/e2e-map.json) + 하네스 테스트 먼저(FAIL 확인) · 커밋 · 푸시하지 않고 lead 보고(푸시는 묶어서)
2. builder — lib.mjs · e2e-needed · e2e-select · checks.sh · team.md · 템플릿 · 커밋
3. lead — 로컬 하네스 테스트 확인 · 한 번에 푸시 · PR(base develop) · 커밋 번호를 claude-desktop 에 · 사용자 harness-approved 라벨 필요(보호 파일)

## 파일 계획
- .agents/checks.sh
- .agents/scripts/lib.mjs
- .agents/scripts/e2e-needed.mjs
- .agents/scripts/e2e-select.mjs
- .agents/scripts/harness.test.mjs
- .agents/e2e-map.json
- .agents/orchestration/team.md
- .agents/orchestration/TASKS.md
- rigs/hav/rig.template.yaml
- .agents/specs/0244-develop-flow/**

## 계획 밖 변경 이유
-

## 완료 기준
- [ ] PR(base develop) 최신 커밋 CI gate SUCCESS · e2e 단계 없음(조용한 파일뿐) (verdict.md)
- [ ] 머지 뒤 첫 develop → main 반영도 e2e 없이 2 ~ 3분 (새 흐름 첫 시험)

## 허점
-

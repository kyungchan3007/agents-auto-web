# 요청 원문

> 2026-11-21 · 사용자 → claude-desktop → lead (큐 qitem-20261120155730-eae9351eadc738df · 작업서 .tmp/task-branch-e2e-1121.md). 사용자 원문은 아래 작업서 "사용자 요청 원문" 절. 작업서는 받은 그대로 붙인다.

# 작업서 — develop 브랜치 흐름 + e2e 줄이기 (2026-11-21 · claude-desktop → lead)

## 사용자 요청 원문 (request.md 에 그대로)
- "이거 푸시 할때마다 이렇게 길면 작업 못해 이거 관련된 에이전트 팀에서 일단 먼저 e2e 랑 단위테스트 할거 아니야"
- "자 그러면 단위테스트만 팀에서 전체 단위 테스트를 진행해 그리고 Action에서 CI 는 단위 테스트 할필요없고 e2e 테스트만 진행해 추가된 기능 또는 변경된 기능만 그리고 언제 전체 e2e를 돌리냐 오늘 하루 마무리 할때 돌리는거 어때"
- "오케이 그러면 단위 테스트는 그렇게 진행하고 e2e 는 어떻게 진행하는게 좋을까 이거 너무 오래 걸려"
- "나눠 돌리는건 하지말고"
- "공용 파일이나 연결표에 없는 파일이 바뀜: 전체 e2e 를 넓은 화면과 휴대폰 둘 다에서 돌립니다. 이거도 마지막에 하는게 좋지 않아?" · "작업이 느려 그러면"
- "그리고 브렌치 전략을 좀 세우자 그러면 좀 괜찮을거 같아"
- "데이터 geo 도 devlop으로 푸시하고 검증이 완료 되면 그떄 main으로 바로 푸시 하면되니까 이거는 그렇게 오래 안걸릴거 같으니까 이거는 오늘 할일에 들어가는거니까 바로바로 푸시 해야해"
- "응 맞아 이렇게 가야할거 같아"
- "이번 작업은 e2e 테스트 없지" → (답: Quick · 워크플로 안 건드림 · rigs/ 를 조용한 파일에 넣으면 없음) → "그렇게 작업서 만들어서 리드한테 넘겨"
- 단위 테스트에 대해 사용자와 정한 것: CI 에서도 단위 · 타입 · 린트는 그대로 돈다(약 40초 보험). 팀은 로컬에서 단위 전체를 돌린 뒤 푸시한다.

## 이미 된 것 (다시 하지 않는다)
- origin/develop 을 만들었다(= main dc887aa). 사용자가 develop 브랜치 보호(필수 검사 `gate`)를 걸었고 claude-desktop 이 확인했다.
- 로컬의 옛 브랜치 · .tmp/wt-* 작업 폴더를 모두 지웠다(백업 .tmp/local-branches-backup-1121.bundle). 메인 체크아웃은 develop 이다.

## 정한 흐름
### 브랜치
- main = 운영(머지되면 바로 배포). develop = 모으는 곳(미리보기만). task/NNNN-이름 = develop 에서 딴다.

### 경로 세 가지
1. 기능 작업: task → develop PR. CI = 작업 기록 · 보호 파일 → 타입 · 린트 · 단위 전체 → **연결표로 고른 e2e 만 · 넓은 화면만**. 공용 파일만 바뀌었으면 주요 페이지 가벼운 확인(홈 · 환율 · 여행 물가 · 여행 타이밍 · 직구 계산 정도 — 고를 spec 은 test 가 정함). "머지해" 뒤 develop 에 rebase 머지.
2. data · geo(오늘 할 일): task → develop PR → "머지해" → develop 머지 → lead 가 그 커밋만 cherry-pick 한 반영 PR(base main) → "머지해" → main 반영 → main 을 develop 에 합침. develop 에 다른 작업이 없으면 develop 을 그대로 main 에 올린다.
3. 하루 마무리: lead 가 develop → main PR 을 연다(그날 기록 PR · 본문에 그날 작업 목록). CI = **전체 e2e · 넓은 화면 + 휴대폰**. 통과 + "머지해" 뒤 **fast-forward**(develop 커밋 그대로 main 으로 · rebase 머지 금지 — SHA 가 갈라짐). 실패하면 develop 에서 고친 뒤 다시.
- 예외(운영 급한 버그): main 에서 따서 base main PR · 전체 e2e · 머지 뒤 main 을 develop 에 합침.
- 공통: 화면에 영향 없는 파일만 바뀌었으면(0243 의 조용한 파일) 대상이 main 이어도 e2e 를 건너뛴다 — data · geo 반영 PR 과 이 작업의 반영이 2~3분에 끝나게.

### 판정 규칙 (checks.sh · 판정 스크립트)
- 바뀐 파일은 **PR 의 대상 브랜치 기준**으로 구한다. 지금 `.agents/scripts/lib.mjs` 의 baseRef() 는 origin/main 고정이다 → CI 에서는 GITHUB_BASE_REF(origin/<base>) 기준, 로컬은 origin/develop → origin/main 순서. protected-check · scope-check · e2e 판정이 같은 함수를 쓰니 함께 맞는지 확인.
- 대상 develop: 연결표 e2e(넓은 화면 프로젝트만). 대상 main: 전체 e2e(두 프로젝트). 둘 다 조용한 파일뿐이면 e2e 없음.
- Full 루프(prd · sdd)라도 develop 대상이면 위 규칙을 따를지 — lead 가 정하고 plan 에 적는다(권장: 따른다. 전체는 하루 마무리에서 본다).
- 연결표: "경로 접두어 → spec 파일 목록". test 가 관리. 연결표에 없는 화면 파일이 바뀌면 → 그 PR 에서는 주요 페이지 가벼운 확인 + 경고(전체는 하루 마무리). 하네스 테스트로 (a) e2e/*.spec.ts 가 모두 연결표에 있는지 (b) 고르기 결과를 확인.
- 조용한 파일에 `rigs/` 를 더한다(팀 안내문 · 화면 영향 없음).

### 팀 규칙 (team.md · rigs/hav/rig.template.yaml 안내문)
- 로컬: 단위 · 타입 · 린트 전체 + 바꾼 기능 e2e(연결표) 뒤 푸시. 판정은 CI.
- 새 기능을 더하면 연결표 한 줄까지가 그 작업이다(test).
- 작업 브랜치 · 작업 폴더는 origin/develop 에서 딴다. PR base 는 develop(예외 경로만 main).
- lead: 하루 마무리 PR · data/geo 반영 PR 을 연다. 머지는 사용자 "머지해" 뒤 claude-desktop 이 한다.
- data · geo 안내문에 "develop PR → 반영 PR 로 같은 날 main" 을 적는다.

## 이번 작업에서 e2e 가 돌지 않게 (사용자와 정함)
- **Quick 루프**(request · plan 만 · prd/sdd 없음). 파일 10개 안팎.
- **.github/workflows/** 는 건드리지 않는다.** 하루 마무리는 develop → main PR 이라 지금 checks.yml(pull_request · 모든 base)로 돈다. 손 실행 워크플로는 만들지 않는다. 워크플로 이름 · 잡 이름 `gate` 는 그대로(필수 검사 · deploy-api 가 묶여 있음).
- 바뀌는 곳: .agents/checks.sh · .agents/scripts/**(판정 · 연결표 · 하네스 테스트) · .agents/orchestration/team.md · rigs/hav/rig.template.yaml. 이 PR 은 자기 판정 스크립트로 검사되므로 rigs/ 도 조용한 파일로 바로 적용된다.
- 이 PR 의 base 는 develop. 머지 뒤 첫 "develop → main" 반영도 조용한 파일뿐이라 2~3분이어야 한다 — 이것이 새 흐름의 첫 시험이다.
- 보호 파일(checks.sh · .agents/scripts/**) → PR 을 연 뒤 사용자가 harness-approved 라벨을 단다. 팀은 라벨을 달지 않는다.

## 하지 않는 것
- e2e 샤드(나눠 돌리기) · Playwright --only-changed(우리 spec 은 앱 코드를 import 하지 않아 고르지 못함) · 예약 실행 · checks.yml 변경.

## 순서 · 조건
- 구현 builder · 테스트(하네스 테스트 · 연결표 초안) test. 연결표 초안은 test 가 e2e 43개를 보고 만든다.
- 푸시는 묶어서 한다(CI · 미리보기 빌드마다 운영 D1 을 읽음).
- "통과"는 verdict.md 규칙대로. 머지는 사용자 "머지해" 뒤에만.
- CI 는 claude-desktop 도 지켜본다. 푸시하면 커밋 번호를 바로 알려 달라.

## 회신
- 작업 번호 · PR 번호 · 바뀐 파일 · 연결표 요약을 큐로 회신. 실패하면 .tmp/lead-reply-1121.md 에 시각과 함께.

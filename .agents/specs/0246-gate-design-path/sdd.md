# SDD — 어떻게

> 요구사항: [prd.md](prd.md) · 정책 원본: [handoff.md](handoff.md)

## 접근
1. **디자인 PR 판정** — 새 스크립트 `.agents/scripts/design-pr.mjs`
   - 입력: 바뀐 파일(lib.mjs `changedFiles()` · 0244 의 baseRef 그대로) + 라벨(`GITHUB_EVENT_PATH` JSON 의 `pull_request.labels[].name` · 읽기 실패 시 빈 목록).
   - 허용 목록(화면 쪽 · glob): `apps/web/src/features/*/components/**` · `apps/web/src/app/**/{page,layout}.tsx` 류 화면 코드 · `packages/ui/src/components/**` · `**/*.css` · `packages/ui/src/tokens.css` · 테스트 파일(`*.test.ts(x)` · `apps/web/e2e/**` · `apps/web/e2e-responsive/**`) · `.agents/specs/**` · `docs/**` · `*.md`(단 AGENTS.md · CLAUDE.md 제외 — 보호 파일). 정확한 목록은 builder 가 정하되 **허용 목록 방식**.
   - 출력 JSON: `{ design: boolean, reason: string, warn?: string, offending?: string[] }`
     - 라벨 없음 → design=false
     - 라벨 있음 + 전부 허용 → design=true
     - 라벨 있음 + 밖 파일 → design=false · warn "design 라벨인데 이 파일이 섞였다: …"
   - 대상 main(하루 마무리)도 같은 함수(바뀐 파일 = main...develop 구간). 라벨은 lead 가 그날 PR 이 모두 design 일 때만 단다.
2. **checks.sh** — CI PR 에서 design-pr 결과로
   - e2e: 평소엔 지금처럼 한 번. 디자인 PR 이면 (a) `--grep-invert @design` 로 고른 spec 을 돌려 막는 단계 (b) `--grep @design` 로 같은 spec 을 막지 않는 단계로 돌림 — 실패해도 결과를 FAIL 로 만들지 않고 "디자인 테스트 실패 N개 (막지 않음)" 묶음 + 실패 이름을 찍는다.
   - 단위(test): 디자인 PR 이면 두 번 — 기능(막음) `vitest run -t '^(?!.*@design)'`(-t 는 전체 이름 정규식 · 음의 전방탐색으로 제외) · 디자인(막지 않음) `vitest run -t '@design'` 을 결과 코드 무시로 돌려 실패 이름만 묶음으로. `@design` 이 하나도 없으면 PASS. e2e 도 같게 `--grep-invert @design` / `--grep @design`, 빈 spec 은 건너뜀. (builder 결정 07:37Z)
   - 평소 PR · 로컬 · push(main) 은 지금 그대로.
   - 결과 줄에 판정을 한 줄로: `디자인 PR: 예 · 디자인 테스트 실패 N개(막지 않음)` / `디자인 PR: 아니오(이유)`.
3. **@design 표시(test)** — 테스트 이름 끝에 ` @design`. 섞인 테스트는 둘로 나눔. 범위: handoff 6번(home-fix-0217 값 검사 · home-pill · home-design · calc-gap · light-only · tokens · fonts · *-design · 0245 에서 깨진 것) + 스타일 클래스 이름 단위 테스트. 사용자가 정한 조건(첫 화면에 듦 · 가로 넘침 없음 · 값 바뀌어도 밀리지 않음(넓은 화면))은 표시하지 않음.
4. **문서(builder)** — AGENTS.md 1번 아래 한 줄 · verdict.md "디자인 PR 판정" 절(handoff 3번 표) · team.md(lead: design 라벨은 PR 열 때 · 동작 변경엔 안 닮 · 하루 마무리 PR 은 그날 전부 design 일 때만 · 본문 "디자인 테스트 실패 N개" · 하루 마무리 본문 바뀐 화면 목록 + "미뤄 둔 디자인 테스트 N개" / builder: 구현만 / test: 기능 테스트가 깨졌을 때만 · 디자인 테스트 안 고침 · 캡처 안 함 · 빠진 표시만 붙임 · 표시 기준) · rig 템플릿 같은 내용 · docs/design-tests-pending.md 새로(맨 위 세 줄 + 쌓는 형식).

## 대안 · 트레이드오프
- 하루 마무리 판정에 GitHub API(머지된 PR 라벨 조회): 정확하지만 워크플로에 토큰 · 권한을 더해야 함(보호 파일 · 범위 확대) → 고르지 않음. 라벨 + 파일 규칙 재사용이 단순하고, 틀려도 막는 쪽으로 떨어짐.
- design 라벨 이벤트로 게이트 다시 돌리기: 워크플로 `if` 를 고쳐야 함 → 이번엔 하지 않고 "PR 열 때 라벨" 규칙으로 해결.
- `@design` 를 파일 단위(폴더 · 이름)로 나누기: 섞인 파일이 많아 테스트 이름 표시가 정확함 → 이름 표시.

## 파일 계획
- .agents/scripts/design-pr.mjs
- .agents/scripts/lib.mjs
- .agents/scripts/harness.test.mjs
- .agents/checks.sh
- AGENTS.md
- .agents/orchestration/verdict.md
- .agents/orchestration/team.md
- .agents/orchestration/TASKS.md
- rigs/hav/rig.template.yaml
- docs/design-tests-pending.md
- apps/web/e2e/**
- apps/web/src/**/*.test.ts
- apps/web/src/**/*.test.tsx
- packages/ui/src/**/*.test.ts
- packages/ui/src/**/*.test.tsx

## 계획 밖 변경 이유

## 위험
- 허용 목록이 넓으면 동작 변경이 디자인 PR 로 새어 기능 테스트만 보게 됨 → 허용 목록 방식 · `lib/` · `hooks/` · api · shared · 설정 · 하네스는 밖. 그래도 기능 테스트는 늘 막음.
- `--grep-invert` 와 고른 spec 이 겹쳐 spec 전체가 비면 playwright 가 "테스트 없음" 오류 → 빈 경우 처리(builder) · 하네스 테스트.
- 막지 않는 단계가 실수로 결과를 PASS 로 덮어 기능 실패를 가림 → 기능 단계 결과와 따로 셈 · 하네스 테스트로 "기능 실패 → FAIL" 확인.
- 이 PR 은 보호 파일 → 사람이 harness-approved 를 달아야 gate 가 통과.

## 검증 계획
- test: harness.test.mjs 에 prd 완료 기준의 경우들(먼저 FAIL) · `@design` 표시 뒤 단위 · 고른 e2e 로컬 실행(표시만 바꿨으므로 결과 같음).
- lead: 로컬 `checks.sh`(Full) · PR 최신 커밋 CI gate · harness-approved 뒤 재실행 결과.

## 계획과 달라진 점
- lib.mjs 는 바꾸지 않음(baseRef · changedFiles 그대로 씀).
- 홈 spec 세 개(home · home-redesign · home-fix-0217)는 0247 되돌리기와 겹쳐 @design 표시에서 뺌 — 이후 디자인 작업에서 깨질 때 표시.
- fonts.spec 첫 테스트는 가로 넘침(기능)과 글꼴 · 자간(디자인)으로 둘로 나눔.

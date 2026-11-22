# 작업서 — builder 가 푸시 전에 타입 검사 · lint (2026-11-22 · claude-desktop → lead · 사용자 결정)

팀 규칙 변경입니다. **지금 바로 적용**하고, 규칙 문서는 작은 PR 하나로 고칩니다(Quick · 하네스 문서만).

## 사용자 원문 (2026-11-22)
- "빌더가 빌드까지 해도 상관없잖아 test가 해야하는거야? 이유가 뭐야 답해봐"
- (claude-desktop 이 "타입 검사 같은 빠른 확인은 builder 가 해도 득이 크고, 전체 빌드와 e2e 는 test 한 곳에서 하는 편이 낫다"고 답한 뒤) "타입 검사는 빌더가 하게 바꿔"
- "린트 작업도 빌더가 해도 되지 않을까?" · "그니까 내가 말하는게 린트가 틀리면 test로 간다 이거야 그러며 왕복이 오히려 더 생기는거 아냐?"
- (claude-desktop 이 "builder 는 자기가 바꾼 파일만 lint 를 돌리고 테스트 파일 lint 는 지금처럼 test 가 하면 test 에게 넘어갈 일이 없다"고 답한 뒤) "그치그치 그렇게해 타입과 린트는 빌더가 하는거로"

## 바뀌는 것
- builder 는 구현을 마치고 **푸시 전에 타입 검사를 직접 돌립니다**: 바꾼 패키지에서 `npm run typecheck`(apps/web 은 `next typegen && tsc --noEmit`). 통과하면 커밋 · 푸시, 실패하면 고친 뒤 푸시합니다. 보고에 "타입 검사 통과"를 한 줄 적습니다.
- builder 는 푸시 전에 **lint 도 직접 돌립니다. 범위는 builder 가 이번에 바꾼 파일만**입니다(바뀐 파일 목록을 eslint 에 넘김 · `--fix` 도 그 파일에만). 테스트 파일(*.test.ts · *.test.tsx · apps/web/e2e/** · apps/web/e2e-responsive/**)은 builder 의 lint 대상이 아닙니다 — 테스트 파일 lint 는 지금처럼 test 가 자기 확인에서 돌리고 고칩니다. builder 가 테스트 파일 lint 결과를 test 에게 전달하는 일은 없게 합니다(왕복을 늘리지 않으려는 사용자 지적).
- 보고에 "타입 검사 · lint(바꾼 파일) 통과"를 한 줄 적습니다.
- 그대로인 것: 전체 빌드 · 단위 테스트 · e2e · 하네스 · gate · 미리보기 확인 · 테스트 작성 · 테스트 파일 lint 는 **모두 test** 입니다.
- 이유(사용자에게 답한 내용): 타입이 깨진 코드를 test 에게 넘겨 왕복하는 일을 줄임 · 타입 검사는 빠르고 빌드처럼 두 번 돌거나 컴퓨터 부하를 키우지 않음.

## 고칠 문서
- `.agents/orchestration/team.md` 의 "builder (구현)" 절: "구현만 한다. 테스트 실행(…)은 하지 않는다" 줄에 "단, 푸시 전 타입 검사(npm run typecheck)와 바꾼 파일의 lint 는 builder 가 한다 · 테스트 파일 lint 는 test (2026-11-22 사용자 결정)"를 더합니다. 보호 파일이 아닙니다.
- 같은 내용이 verdict.md 등 다른 팀 문서에 "builder 는 아무 검사도 하지 않는다"로 적혀 있으면 함께 맞춥니다.
- lead · builder 기억(test-owns-all-testing 등)도 같이 고칩니다.

## 끝나면
- 문서 PR 은 gate `결과: ✅ ALL PASS` 면 develop 머지 · morning-report.md 에 한 줄. 지금 진행 중인 0283 을 끊지 말고, 그 뒤 차례에 끼우거나 다음 작업 PR 에 커밋 하나로 함께 넣어도 됩니다.

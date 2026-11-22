# 계획 — 작업 0284 · builder 는 푸시 전 타입 검사 · 바꾼 파일 lint (Quick · 평소 PR · 팀 문서만)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
- `.agents/orchestration/team.md` 의 "builder (구현)" 절에: 구현만 한다 · 단 푸시 전 타입 검사(npm run typecheck)와 이번에 바꾼 파일의 lint(--fix 도 그 파일만)는 builder 가 한다 · 테스트 파일 lint 는 test · builder 는 테스트 파일 lint 결과를 test 에게 넘기지 않는다 · 보고에 "타입 검사 · lint(바꾼 파일) 통과" (2026-11-22 사용자 결정).
- 같은 절 · test 절에 "전체 빌드 · 단위 · e2e · 하네스 · gate · 미리보기 · 테스트 작성 · 테스트 파일 lint 는 test" 를 분명히. lead 절에 "builder 지시에 확인 일을 넣지 않는다"(11-22 재발 방지).
- 다른 팀 문서(verdict.md 등)에 어긋나는 문장이 있으면 함께.

## 애매한 곳
- team.md · verdict.md 는 보호 파일이 아님(.agents/protected.txt 확인). (작업서)
- 테스트 파일 범위: *.test.ts · *.test.tsx · apps/web/e2e/** · apps/web/e2e-responsive/**. (작업서)
- 지금 적용은 이미 됨(builder 확인 07:19Z · 07:22Z) — 이 PR 은 문서. (작업서)

## 누가
- builder — 문서 수정 · 푸시(문서라 타입 검사 · lint 대상 없음)
- test — gate 확인(하네스 테스트가 team.md 를 읽으면 로컬에서 함께)
- lead — PR · gate · 머지

## 파일 계획
- .agents/orchestration/team.md
- .agents/orchestration/verdict.md (어긋나는 문장이 있으면)
- .agents/specs/0284-builder-checks/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] team.md 에 builder 의 타입 검사 · 바꾼 파일 lint · 나머지는 test 가 적힘

## 허점
- 0268 ~ 0282 이중 테스트(0283 plan 허점 참고) — 문서에 lead 지시 규칙까지 적어 막음.

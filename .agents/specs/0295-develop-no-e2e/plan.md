# 계획

## 무엇을 · 왜
- develop 으로 가는 PR 의 CI gate 에서 e2e 를 뺀다(build 까지는 돎). 지금은 연결표로 고른 spec 이 PR 마다 19 ~ 27개 · 테스트 178 ~ 289개라 e2e 만 3.2 ~ 6.0분 · gate 전체 5 ~ 8분이 걸림(#336 · #338 · #340 · #342 실행 기록).
- 로컬 e2e 는 이 작업에서 새로 쓰거나 고친 spec 파일만 돌린다. 작업 0294 훅의 허용 목록을 "e2e-select 결과"에서 "바꾼 spec 파일"로 바꾼다.
- 전체 e2e(넓은 화면 + 휴대폰)는 지금처럼 main 으로 가는 PR 에서만 돈다.

## 애매한 곳
- build 는 남긴다 — 사용자는 "e2e 빼고"라고 함 · 빌드는 2분 남짓이고 깨진 코드를 일찍 잡음. (확인됨: "그러면 지금 develop에 머지 될때 e2e 빼고 하자")
- 로컬 범위는 "고친 테스트 파일만"(A안). (확인됨: "응 빼자" · "로컬에서는 변경된거만 하고")
- e2e 고르기가 실패해도 대상이 main 이 아니면 e2e 를 돌리지 않는다(예전엔 안전하게 전체). (가정)
- e2e-select.mjs 의 고르기 자체는 그대로 둔다 — main 판정 · 앞으로 쓸 수 있음. (가정)

## 파일 계획
- .agents/checks.sh — 대상 develop 이면 build 만 · test:e2e 건너뜀
- .agents/scripts/e2e-guard.mjs — 로컬 허용 = 이 작업에서 바꾼 apps/web/e2e/*.spec.ts
- .agents/scripts/harness.test.mjs — 게이트(대상 develop 은 build 만 · main 은 전체) · 훅(바꾼 spec 만) 테스트
- .agents/orchestration/team.md · .agents/orchestration/verdict.md — 규칙 문장
- .agents/specs/0295-develop-no-e2e/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI gate · 보호 파일은 harness-approved 라벨)
- [ ] 이 PR 의 CI 로그에 "test:e2e 건너뜀 — 대상 develop 은 build 만"이 찍힘
- [ ] 머지 뒤 주 작업 폴더를 develop 최신으로 맞춤(훅이 바뀐 허용 목록을 씀)

## 허점
- e2e 실패가 main 으로 가는 PR(하루 마무리)에서야 한꺼번에 드러난다. 그날 머지된 작업 중 무엇이 깨뜨렸는지 찾는 데 시간이 들 수 있다 — 사용자가 감수하기로 함.
- 자주 흔들리는 기존 spec(통화 칩 저장 깜빡임 · 통화 그래프 기간 버튼 · 흐름 기간 칩 · 여행 타이밍 그래프)은 main PR 에서 걸릴 수 있다.

# PRD — 작업 0242 · 흔들리는 e2e 고치기 (Full · CI 가 e2e 를 돌아야 확인됨)

> 원문(request.md)이 판정 기준.

## 문제
- CI(workers 4)에서 움직임 · 스크롤 화면 e2e 가 첫 시도에 실패하고 재시도에 통과한다(흔들림). 판정이 불안정하고 시간도 늘어난다.
- 대상: currency-chart.spec.ts:146 · detail-design.spec.ts:90 · prices-route.spec.ts:94 · prices-route.spec.ts:80(휴대폰) · pages.spec.ts:342

## 목표
- 고정 대기(waitForTimeout · 정해진 ms) 대신 움직임이 끝났다는 신호(요소 상태 · 애니메이션 끝 · 값이 멈춤)를 기다리게 바꿔, 같은 검사를 흔들림 없이 통과시킨다.
- 검사하는 내용(무엇이 맞아야 하는지)은 바꾸지 않는다. retries 를 늘리지 않는다.

## 비목표
- 화면 코드 변경(테스트가 기다릴 신호가 화면에 없으면 builder 에게 따로 요청 · lead 판단)
- 다섯 개 밖의 흔들림

## 애매한 곳
- 움직임 끝 신호가 화면에 없는 경우: test 가 찾아 보고 · 필요하면 builder 작업으로 (가정 · lead)

## 완료 기준
- [ ] PR 최신 커밋 CI gate = COMPLETED + SUCCESS · 대상 다섯 개가 흔들림 없이 통과 (verdict.md)

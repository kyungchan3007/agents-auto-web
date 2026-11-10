# 계획

## 무엇을 · 왜
- 작업 0147 에서 넣은 `HttpError` 의 생성자 매개변수 속성(`readonly status`)을 node 타입 지우기 실행이 읽지 못해 geo-ask 가 시작하자마자 멈췄다. 필드로 바꾼다.
- 다시 나오지 않게 `apps/api` 타입 검사에 `scripts` 를 넣고 `erasableSyntaxOnly` 를 켠다. 이 옵션은 node 가 못 읽는 문법(매개변수 속성 · enum 등)을 타입 검사 오류로 만든다.
- 옵션을 켜니 `SourceError`(rate.ts)도 같은 문법이라 필드로 바꾼다 (Worker 는 번들러가 처리해 문제가 없었지만 규칙을 하나로).

## 애매한 곳
- 없음

## 파일 계획
- apps/api/scripts/geo-ask.ts
- apps/api/tsconfig.json
- apps/api/src/features/fx/sources/rate.ts
- .agents/specs/0148-geo-ask-strip/**

## 계획 밖 변경 이유

## 완료 기준
- [x] bash .agents/checks.sh PASS
- [x] 키 없이 geo-ask 를 실행해 정상 종료 (확인: "키가 없어 측정하지 않음" 3줄 · exit 0)
- [ ] 머지 뒤 손으로 실행해 HTTP 400 의 실제 원인 확인

## 허점
- 작업 0147 에서 스크립트를 실제로 한 번도 실행하지 않고 테스트(순수 함수)만 돌렸다. GitHub Actions 가 node 로 바로 실행하는 스크립트는 타입 검사에도 들어 있지 않았다 → 이번에 타입 검사로 막음.

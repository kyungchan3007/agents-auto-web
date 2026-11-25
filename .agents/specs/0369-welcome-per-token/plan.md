# 계획

## 무엇을 · 왜
- 안내 창 "봤음" 표시(localStorage)가 브라우저에 하나만 있어, 한 회사 링크에서 "둘러보기"를 누르면 다른 회사 링크로 들어와도 안내 창이 뜨지 않았다. 표시를 토큰 이름마다 따로 저장한다(`adm-gate-welcome-seen:<이름>`).
- 닫기 함수가 이름을 쓰므로 useCallback 의존 값에 이름을 넣는다.

## 파일 계획
- apps/admin/src/shared/gate/use-gate-welcome.ts
- apps/admin/e2e/admin-gate.spec.ts
- .agents/specs/0369-welcome-per-token/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [x] 로컬 admin-gate.spec.ts 38개 통과(넓은 화면 · 휴대폰)

## 허점
- 0326 시험이 "같은 브라우저에서 다시 안 뜸"만 보고 "다른 회사면 다시 뜸"은 보지 않았다.

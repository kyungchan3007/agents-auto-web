# 계획

## 무엇을 · 왜
- 접속 기록 표가 리뷰어 토큰으로 들어온 사람에게도 보였다(다른 회사 토큰 이름까지 드러남). 본인(owner)에게만 보이게 막는다.
- Worker: `/bff/admin-visits` 는 owner 세션만 API 로 넘기고, 다른 토큰은 404.
- 화면: `/session` 으로 owner 인지 확인한 뒤에만 표를 그리고 자료를 부름. 확인 전 · 실패 · 리뷰어면 표를 그리지 않음.

## 파일 계획
- apps/admin/worker/index.ts · apps/admin/worker/index.test.ts
- apps/admin/src/shared/gate/use-is-owner.ts (새로) · apps/admin/src/shared/gate/session-view.ts
- apps/admin/src/features/how/visits/how-visits.tsx
- apps/admin/e2e/admin-gate.spec.ts
- .agents/specs/0339-admin-visits-owner-only/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 리뷰어 토큰: 표 없음 · /bff/admin-visits 404 / owner: 표 그대로

## 허점
- 0326 에서 접속 기록을 어드민 화면에 넣으면서 "어드민에 들어온 사람 모두"가 본다는 점을 놓쳤다. 어드민 안에서도 본인만 볼 것은 Worker 에서 세션 이름으로 막는다.

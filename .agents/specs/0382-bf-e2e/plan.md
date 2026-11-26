# 계획

## 무엇을 · 왜
- #452 (develop 7b3c980c · run 45870210197) 전체 e2e 실패 2개:
  1. a11y.spec.ts:19 '/ — h1 하나': 블프 hero 와 기본 hero 를 둘 다 그리고 CSS 로 하나만 보이게 해서 DOM 에 h1 이 둘("$200 넘기 전에…" · "11월에 떠나세요"). display:none 인 쪽은 보조 기술에 안 읽히므로, 검사가 보이는(접근성 트리에 있는) 제목만 세게 고치거나, 숨은 hero 에 hidden/inert 처리. test 가 판단 · 코드가 필요하면 builder.
  2. home-redesign.spec.ts:178 움직임 줄이기: 'Element is not attached to the DOM' · 원인 확인 뒤 고침.
- 블프 기간이 2026-12-01 17:00 까지라 빠르게.

## 파일 계획
- apps/web/e2e/a11y.spec.ts · apps/web/e2e/home-redesign.spec.ts (test)
- 코드가 필요하면 apps/web/src/features/home/** (builder · 이유 적음)
- .agents/specs/0382-bf-e2e/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate)
- [ ] develop 머지 뒤 #452 전체 e2e 통과 · main 머지

## 허점
-

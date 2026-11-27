# 계획

## 무엇을 · 왜
- 첫 페이지 hero 아래 예전 hero(TodayBoard · 파란 띠 위 "내가 고른 여행지 · 오늘 환율" 탑승권 카드)를 블프 · 기본 기간 모두에서 지움. 새 기본 hero(0380)가 입력창 · 칩 · 탑승권을 가지고, 블프 기간엔 블프 hero 가 맡아 이제 쓰지 않음.
- apps/web/src/features/home/today/ 는 home.tsx 와 테스트만 가져다 씀(인트로 탑승권 · 고른 여행지 공유 훅은 shared/trip · @hav/shared/travel 에 따로 있음) → 폴더 통째로 지움. 남길 함수 없음.
- 지운 뒤 hero 다음 구역(12달 막대)이 바로 이어지게 간격만 맞춤(카드가 띠 경계에 걸치려고 둔 여백이 있으면 줄임).
- 블프 hero · 기본 hero · 12달 막대 · 도착지별 환전 타이밍 · 바닥 띠는 그대로.
- 진행(사용자 지시): Quick · develop PR gate 통과 → develop 머지 → 바로 develop → main fast-forward(force 금지) · main 반영 PR · 전체 e2e 없음 · 그 사이 다른 작업을 develop 에 넣지 않음 · 릴리스 없음.

## 파일 계획
- builder: apps/web/src/features/home/home.tsx · apps/web/src/features/home/today/** 삭제 · 간격(hero.css · year-bars 쪽 스타일 중 필요한 곳)
- test: apps/web/src/checks/{home-band-trim,home-flap-board,intro-structure,home-redesign}.test.ts · apps/web/src/features/home/destinations/new-home.test.ts · apps/web/e2e/ 의 카드 검사(home-redesign · pass-auto-hide · intro · click-events · home-guide · home-fix-0217 · flap-board · home-design) — 카드만 검사하는 것은 지우고, 섞인 것은 카드 부분만 뺌
- .agents/specs/0384-old-hero/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate)
- [ ] develop 머지 → develop → main fast-forward · 릴리스 없음

## 허점
- main 전에 전체 e2e 를 돌리지 않음(사용자 지시) · 홈 e2e 여러 개에서 카드 검사를 빼므로 test 가 로컬에서 바꾼 spec 을 모두 확인.

# 계획

## 무엇을 · 왜
- run 45991018655: ① tap-44 '/' 390: more-currencies "다른 통화 18개 모두 보기 ›" 가운데를 누르면 다른 요소(앞 실행은 year-link 위 3.5px) ② home-carousel:502 390: hero 높이 1042.9 ↔ 1090.9(48px).
- 로컬은 첫 그림부터 1090.9 로 일정 · CI 첫 그림만 1042.9 → CI 에서 웹 글꼴(Pretendard)이 늦게 와 대체 글꼴로 먼저 그려졌다가 글꼴이 오며 줄바꿈이 바뀌어 hero 가 48px 늘어나는 것으로 봄(0389 bf-note 와 같은 종류). 측정 중 아래 요소가 밀려 tap-44 도 흔들림.
- test: 390px 에서 글꼴 파일 요청을 막은 상태(대체 글꼴)와 실은 상태를 비교해 두 장(bf · sea) hero 안에서 높이가 달라지는 요소를 찾음 · 그 상태로 tap-44 · home-carousel:502 재현.
- builder: 찾은 요소의 자리를 글꼴과 상관없이 고정(min-height · 줄 수 예약) — 사용자 원칙: 글꼴 로딩으로 hero 높이 · 위치가 바뀌면 안 됨.
- 고친 뒤 develop 머지 → #470 다시 · 릴리스(v1.5.0)는 이미 develop 에 있음.

## 파일 계획
- builder: apps/web/src/features/home/{hero/hero.css,blackfriday/bf-hero.css,carousel/carousel.css} (찾은 요소에 따라)
- test: 필요하면 apps/web/e2e/home-carousel.spec.ts(글꼴 막은 재현 검사)
- .agents/specs/0395-font-shift/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate)
- [ ] develop 머지 뒤 #470 전체 e2e 통과

## 허점

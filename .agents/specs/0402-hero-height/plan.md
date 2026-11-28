# 계획

## 무엇을 · 왜
- #478 재실행에서 남은 실패: home-carousel.spec.ts:502 (390px · 첫 그림부터 7초 동안 hero 높이 · 아래 구역 위치 변화 0 · 작업 0389) — hero 높이가 48px 커짐. 지난 실행에서는 통과.
- '입력 · 응답 · 모션 · 글꼴로 hero 높이가 움직이면 안 됨' 원칙이라 먼저 원인을 잰다. 화면 문제면 claude-desktop 에 알리고 고치고, 측정 문제면 테스트를 고친다.

## 파일 계획
- test: 원인 측정 · 필요하면 apps/web/e2e/home-carousel.spec.ts
- builder: 화면 문제로 확인되면 그 파일(원인 확인 뒤 여기에 적음)
- .agents/specs/0402-hero-height/** · .agents/orchestration/TASKS.md

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate) → develop 머지 → #478 다시 실행(main 머지는 claude-desktop)

## 허점
- 흔들림 4개(home-bars:181 두 프로젝트 · pages:356 · prices-redesign:211)는 고치지 않음.

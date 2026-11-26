# 계획

## 무엇을 · 왜
- #455 (develop f871778e · run 45887716811) 전체 e2e 실패 11개 중 10개가 새 기본 hero(0380) 코드가 사이트 공통 규칙을 어긴 것(test 분석).
  1. focus-ring.spec:83 · :126 — hero.css 의 `.hp-ask input:focus{outline:none}` · `.hp-chips button:focus-visible{outline:none}` 로 입력창 · 칩에 고리 없음, `.hp-ask button:focus-visible` 고리가 남색. → outline:none 지우고 공통 고리(2px · 파랑 · 간격 2 또는 -4)를 쓰게. 노랑 `.hp-ask:focus-within` 은 빼거나 보조로만.
  2. fonts.spec:24 — `.hp-h1` 자간 -0.035em → 규칙 -0.03em.
  3. min-12.spec:71 — 데이터 출처 줄 `.hp-src` 11px → 12px(0.75rem) 이상. 탑승권(aria-hidden 장식)은 이미 검사 밖.
- 4. calc-design.spec:70(휴대폰 · /calc 그래프 높이)은 hero 와 무관하게 흔들리던 테스트. 재시도에서도 실패해 main 을 막으므로 test 가 원인 확인 · 테스트 문제면 함께 고침.

## 파일 계획
- apps/web/src/features/home/hero/hero.css (builder)
- 4번이 테스트 문제면 apps/web/e2e/calc-design.spec.ts (test) · 코드 문제면 이유 적고 builder
- .agents/specs/0383-hero-rules/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋 CI gate)
- [ ] develop 머지 뒤 #455 전체 e2e 통과 · main 머지 · 릴리스 없음

## 허점

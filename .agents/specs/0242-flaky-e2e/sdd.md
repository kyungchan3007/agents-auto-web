# SDD — 작업 0242

> 요구사항: [prd.md](prd.md)

## 접근
- 다섯 테스트마다 실패 증상(CI 로그)을 읽고, 무엇을 너무 일찍 읽었는지 찾는다 → 그 값이 안정될 때까지 기다리는 조건으로 바꾼다 (예: expect.poll · toHaveCSS · data-state 속성 · getAnimations().length === 0 · 스크롤 위치 멈춤).
- 확인(0239 규칙): 로컬에서는 이 다섯 spec 만, 병렬 조건을 흉내 내 여러 번(예: --repeat-each=5 --workers=4) → 푸시 → CI 전체.

## 대안 · 트레이드오프
- timeout · retries 늘리기 — 흔들림을 숨김 · 금지

## 파일 계획
- apps/web/e2e/currency-chart.spec.ts
- apps/web/e2e/detail-design.spec.ts
- apps/web/e2e/prices-route.spec.ts
- apps/web/e2e/pages.spec.ts
- apps/web/e2e/helpers.ts
- apps/web/e2e/today-anchor.spec.ts
- .agents/specs/0242-flaky-e2e/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- .agents/orchestration/TASKS.md — lead 가 0238 ~ 0241 머지됨 · 0242 줄을 이 브랜치에 함께 적음 (CI 경고)
- apps/web/e2e/helpers.ts — 다섯 테스트가 모두 '하이드레이션(이어받기) 끝'을 기다려야 해서 공용 도움 hydrated() 를 한 곳에 둠 (test · aa1796e)

## 위험
- 기다리는 조건이 영원히 안 오면 시간 초과 — 상한은 기존 timeout 그대로

## 검증 계획
- 로컬 반복 실행 결과 · CI gate 흔들림 수(0 목표)를 trace 에

## 계획과 달라진 점
- (lead · CI 1차 44733240150 @08afd19 FAILURE) 대상 다섯 개는 흔들리지 않았지만 today-anchor.spec.ts:34 '다른 페이지에서 메뉴'(390 실패 · 1280 흔들림)와 pages.spec.ts:128(휴대폰 흔들림)이 남음. 둘 다 0238 측정 때도 흔들렸고 같은 계열(이어받기 전 누르기 · 읽기)로 보여 0242 범위에 더함 — 게이트를 통과시키려면 필요

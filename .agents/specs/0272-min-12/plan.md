# 계획 — 작업 0272 · 12px 보다 작은 글자를 12px 로 (Quick · 디자인 PR · 시안 45)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
- 화면에 보이는 12px 미만 글자를 모두 12px 로 올리고, 그 글자의 음수 자간을 0 으로 푼다.
- 겹침 · 잘림 · 가로 넘침이 없어야 한다. 자리가 모자라면 눈금 수를 줄이는 식으로 풀고 PR 에 적는다.

## 애매한 곳
- 작업서의 곳 수(여행 타이밍 넓은 화면 110 · 휴대폰 121 · 음수 자간 42 / 홈 28 · 28 / 통화 상세 휴대폰 9 / 직구 5~7 / 여행 물가 휴대폰 1)는 claude-desktop 측정 → builder 가 로컬 빌드로 대조, 크게 다르면 고치기 전에 보고. (작업서)
- 대상 아님: /geo · /log · 글자판(안내판 숫자) · 통화 상세 큰 환율 숫자. (작업서)
- SVG 글자(그래프 눈금 · 달력)도 화면에 보이는 크기 기준. (가정)
- "가로로 넘치지 않는다 · 12px 미만 없음"은 기능 테스트(사용자가 정한 조건). 글자 크기 · 자간을 고정한 @design 테스트가 깨지면 개수와 이름을 claude-desktop 에 알림. (작업서 · verdict.md)
- 디자인 PR(`design` 라벨) · builder 는 구현만 · hooks · lib 를 바꾸게 되면 lead 에 알림. (verdict.md)

## 누가
- builder — 대조 → 구현 · 로컬 빌드로 12px 미만 0 · 넘침 없음 확인 · 한 번에 푸시
- test — 기능 e2e(대상 페이지 넓은 화면 · 휴대폰: 보이는 글자 ≥ 12px · 가로 넘침 없음) · 깨진 표시 없는 테스트 고침 · 푸시 전 로컬 · @design 깨짐 개수 보고
- lead — 작업표 · PR(design 라벨을 열 때 달기) · gate · ALL PASS 면 develop 머지

## 파일 계획
- packages/ui/src/** (그래프 · 부품 · tokens.css)
- apps/web/src/shared/**
- apps/web/src/features/{home,currencies,travel-price,import-calc,intro,about}/**
- apps/web/src/app/globals.css
- apps/web/e2e/** · apps/web/src/**/*.test.ts(x) · packages/ui/src/**/*.test.ts(x) · .agents/e2e-map.json · docs/design-tests-pending.md (test)
- .agents/specs/0272-min-12/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 대상 페이지 넓은 화면 · 휴대폰에서 보이는 글자 12px 미만 0 · 가로 넘침 0
- [ ] 눈금 수를 줄인 곳은 PR 에 적음

## 허점
-

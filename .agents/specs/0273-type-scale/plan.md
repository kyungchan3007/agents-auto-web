# 계획 — 작업 0273 · 글자 크기를 11단계로 (Quick · 디자인 PR · 시안 46)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
- 글자 크기 단계 12 · 13 · 15 · 16 · 18 · 22 · 28 · 36 · 48 · 56 · 72px 를 토큰(tokens.css)으로 두고, 화면 글자를 가장 가까운 단계로 옮긴다(같은 거리면 큰 쪽). 시안에서 옮긴 값 목록은 handoff.md.
- 여행 물가 큰 제목 79.4 → 72px · 여행 타이밍 · 직구 56px 제목 그대로.

## 애매한 곳
- 바뀌는 곳 수(여행 타이밍 74 · 78 / 여행 물가 36 / 통화 상세 5 / 홈 1 / 직구 약 4)는 claude-desktop 측정 → builder 대조, 크게 다르면 먼저 보고. (작업서)
- 파일이 10개를 넘으면 lead 가 나눈다(작업서). 나누는 기준: 토큰 + 공용 부품 / 페이지별. builder 가 바꿀 파일 수를 먼저 알려 주면 그때 정한다. (가정)
- 옮긴 뒤 줄바꿈이 바뀌어 겹치거나 넘치면 멈추고 보고. (작업서)
- 대상 아님: /geo · /log · 글자판 · 통화 상세 큰 환율 숫자. 12px 미만은 0272 로 이미 없음. (작업서)
- 크기를 고정한 @design 테스트가 깨지면 미뤄 둔 목록(docs/design-tests-pending.md)에 쌓이고 개수 · 이름을 claude-desktop 에 알림. 표시 없는 테스트가 깨지면 멈춤. (작업서 · verdict.md)

## 누가
- builder — 대조 · 바꿀 파일 수 보고 → 구현 · 로컬 빌드로 넘침 · 겹침 없음 확인 · 한 번에 푸시
- test — 깨진 표시 없는 테스트 고침 · 기존 min-12 · 가로 넘침 e2e 로 확인 · @design 깨짐 개수 · 이름(목록에 기록) · 푸시 전 로컬
- lead — PR(design 라벨) · gate · ALL PASS 면 develop 머지

## 파일 계획
- packages/ui/src/** (tokens.css · 부품)
- apps/web/src/shared/**
- apps/web/src/features/{home,currencies,travel-price,import-calc,intro,about}/**
- apps/web/src/app/globals.css
- apps/web/e2e/** · apps/web/src/**/*.test.ts(x) · packages/ui/src/**/*.test.ts(x) · docs/design-tests-pending.md (test)
- .agents/specs/0273-type-scale/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 대상 페이지 글자 크기가 11단계 밖에 없음 · 넘침 · 겹침 없음
- [ ] @design 깨짐 개수 · 이름 알림

## 허점
-

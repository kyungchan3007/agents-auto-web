# 계획 — 작업 0274 · 글자 크기 11단계 (2/3) — 여행 물가 · 인트로 (Quick · 디자인 PR · 시안 46)

## 무엇을 · 왜
- 0273(#326) 의 토큰 위에서 여행 물가(price-route · price-bands · budget-planner · mini-board)와 인트로(4파일)의 글자를 가장 가까운 단계로(같은 거리면 큰 쪽). 여행 물가 큰 제목 79.4 → 72 · 휴대폰 반응형 제목 40 → 36. (0273 작업서 · plan)
- 줄 높이는 비율 유지(0273 과 같음).

## 애매한 곳
- 줄바꿈이 바뀌어 겹침 · 넘침이 생기면 멈추고 보고. 대상 아님 /geo · /log · 글자판. (작업서)
- @design 깨짐은 개수 · 이름 기록. 표시 없는 테스트 깨짐은 의도된 값 변경인지 가려 보고. (작업서 · 0273 처리 그대로)

## 누가
- builder — 구현(준비해 둔 변경) · 로컬 빌드 확인 · 한 번에 푸시
- test — 깨진 테스트 맞춤 · 로컬 e2e · @design 개수 보고
- lead — PR(design 라벨) · gate · 머지

## 파일 계획
- apps/web/src/features/travel-price/** (prices 쪽)
- apps/web/src/features/intro/**
- packages/ui/src/** (여행 물가 부품이 있으면)
- apps/web/e2e/** · apps/web/src/**/*.test.ts(x) · docs/design-tests-pending.md (test)
- .agents/specs/0274-type-scale-2/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- apps/web/src/app/globals.css — 여행 물가 카드 도시 이름(34 → 36 · 휴대폰 26 → 28) 크기가 이 파일에 있음.

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 여행 물가 · 인트로 글자 크기 11단계 밖 0 · 넘침 · 겹침 없음

## 허점
- 0273: PR 을 열 때 design 라벨을 함께 달았는데도 첫 gate 가 '디자인 PR: 아니오(design 라벨 없음)' 로 돌았다(0269 와 같음) — 결과는 디자인 테스트까지 막는 쪽으로 돌아 더 엄격했고 통과. 라벨 반영 시점 문제로 보임.

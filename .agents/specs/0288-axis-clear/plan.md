# 계획 — 작업 0288 · 그래프 눈금 글자 투명도 빼기 (Quick · 디자인 PR · 시안 54)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
- 그래프 눈금 글자에 걸린 투명도를 뺌(색 #4a5a8c 그대로): 홈 12달 막대 왼쪽 눈금(75%) · 여행 타이밍 선 그래프 눈금(70%) · 같은 색에 투명도를 건 다른 그래프 눈금도 함께. 흰 글자 · 강조 색 이름표는 그대로.

## 애매한 곳
- 대상 수(홈 4 · 여행 타이밍 7)는 claude-desktop 측정 → builder 대조. 공용 그래프 부품(line-chart · month-bars · year-chart 등)에 있으면 그 부품을 쓰는 통화 상세 그래프 눈금도 함께 바뀜(같은 규칙이라 대상). (가정 · 작업서 "다른 그래프에도")
- 색 값을 그대로 쓰는지(토큰 · no-raw-color 규칙)도 그대로. (0271 교훈)

## 누가
- builder — 대조 → 구현 · 푸시 전 타입 검사 · 바꾼 파일 lint · 푸시 · 보고
- test — 깨진 테스트(투명도 고정) · 로컬(4399 점검) · @design 개수
- lead — PR(design 라벨) · gate · 머지

## 파일 계획
- packages/ui/src/** (그래프 부품)
- apps/web/src/features/{home,travel-price,currencies}/**
- apps/web/e2e/** · **/*.test.ts(x) · docs/design-tests-pending.md (test)
- .agents/specs/0288-axis-clear/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 눈금 글자(#4a5a8c)에 투명도 없음 · 흰 글자 · 강조 이름표 그대로

## 허점
-

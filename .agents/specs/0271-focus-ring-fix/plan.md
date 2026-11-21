# 계획 — 작업 0271 · 패치(버그) — 출발일 달력 키보드 초점 고리가 사라짐 · 남은 고리 색 (Quick · 평소 PR)

## 무엇을 · 왜
- 0269(#322) 머지 뒤 test 측정: 출발일 달력의 도시 칩 · 앞뒤 단추 · 날짜 칸에서 키보드 초점 고리가 보이지 않음(기능 회귀). 원인은 airfare-calendar.css 의 층 밖 `all:unset` 이 @layer base 의 공용 :focus-visible 을 이김.
- 0269 작업서 규칙과 다르게 남은 색: 홈 pick-chip · 입력 칸 · select 고리가 남색 #16246E · 파란 면 메뉴 링크가 흰색 85%.

## 애매한 곳
- 고치는 방법은 builder: 공용 규칙이 층 밖 규칙에 지지 않게(예: 달력 CSS 를 층 안으로 · 또는 세 곳에 공용 값 `var(--hav-ring)` 다시 적기). 날짜 칸은 안쪽(-4px) 그대로. (0269 작업서)
- 남은 남색 · 85% 흰색도 공용 값으로 맞춘다 — 0269 작업서 "밝은 면 파랑 · 파란 면 흰색" 그대로. (0269 작업서)
- 키보드 초점 고리가 보이는지는 기능 조건(사용자가 정한 조건) → 기능 e2e 로 지킨다: 대상에 Tab 으로 갔을 때 outline-style 이 none 이 아니고 굵기 2px. (가정 · verdict.md)

## 누가
- builder — 구현 · 로컬 빌드로 확인 · 한 번에 푸시
- test — 기능 e2e(초점 고리 있음 · 색) · 푸시 전 로컬에서 그 파일만 먼저 · CI 보고
- lead — PR(패치 제목) · gate · ALL PASS 면 develop 머지

## 파일 계획
- apps/web/src/features/travel-price/components/airfare-calendar.css
- packages/ui/src/** (pick-chip · field · select · nav-bar · tokens.css)
- apps/web/src/features/{home,travel-price,import-calc}/** (select · 입력 칸 고리 값이 있으면)
- apps/web/e2e/** (test)
- .agents/specs/0271-focus-ring-fix/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- apps/web/src/features/currencies/components/currency-chips.tsx — test 의 새 e2e 에서 선택된 통화 칩(진한 채움) 안쪽 고리가 파랑이라 보이지 않음이 드러나 흰색으로(0269 작업서 "남색 면 흰색").
- .agents/e2e-map.json — 새 focus-ring.spec 을 연결표에 추가(test).

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 출발일 달력 도시 칩 · 앞뒤 단추 · 날짜 칸에 키보드 초점 고리 있음
- [ ] 밝은 면 고리 #2438A8 · 파란 면 #FFF

## 허점
- 0269: 공용 규칙을 @layer base 에 두었는데 층 밖 `all:unset` 이 있는 CSS 파일을 확인하지 않음 · 초점 고리를 지키는 기능 테스트가 없어 gate 가 통과함 → 이번에 기능 e2e 추가.

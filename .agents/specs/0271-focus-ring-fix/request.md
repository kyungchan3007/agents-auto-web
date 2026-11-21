# 요청 원문

## 원래 요청 (작업 0269 · 사용자 원문 그대로)
- (3차를 누르는 자리 · 초점 표시부터 추천안대로 시작할지 묻자) "시안 먼저"
- (시안 42 · 43번을 보고 · "42번은 A안(영역만 넓힘), 43번은 고친 모습대로 진행할까요?"에) "둘 다 추천안으로"
- 작업서: [../0269-focus-ring/handoff.md](../0269-focus-ring/handoff.md) — "2px 실선 · 바깥 간격 2px · 밝은 면에서는 파랑(#2438A8) · 파란 · 남색 면에서는 흰색" · "출발일 달력의 날짜 칸은 … 칸 안쪽"

## 머지 뒤 test 측정 보고 (2026-11-22 16:33Z · dev-test@hav · 원문 그대로)
[그런데 고리가 아예 없는 곳 — 실제 문제] /flights 출발일 달력: airfare-chip(도시 칩 8개) · airfare-prev/next(앞 · 뒤 단추) · airfare-day(날짜 칸 42개 · 안쪽 고리 예정이던 곳) 가 키보드로 가도 outline 이 none(:focus-visible 은 true) → 초점 표시 없음. 원인: 공용 규칙(@layer base 안 :focus-visible)을 airfare-calendar.css 의 층 밖 규칙 'all:unset'(.af-chips button · .af-nav button · .af-d)이 이김(층 밖 규칙은 특이도와 무관하게 층 안 규칙을 이김) + 0269 가 그 파일의 옛 고리 3줄(.af-chips button:focus-visible · .af-nav button:focus-visible · .af-d:focus-visible 의 outline)을 지움. 고치기: airfare-calendar.css 에서 세 곳에 outline:2px solid var(--hav-ring) 를 다시 적기(칩 · 단추 outline-offset:2px · 날짜 칸 outline-offset:-4px) 또는 그 CSS 를 @layer 안으로. 이 상태로는 기능 회귀(키보드 초점이 안 보임)라 고쳐서 머지 권장. [색] 규칙은 '밝은 면 파랑 #2438A8'인데 홈 pick-chip · 입력 칸(input) · select(물가 · 직구) 고리는 남색 #16246E 로 남음(고리 값이 층 밖/유틸리티로 따로 있음) · 파란 면 nav 링크는 흰색 85%(#FFF 아님)·나머지는 맞음.

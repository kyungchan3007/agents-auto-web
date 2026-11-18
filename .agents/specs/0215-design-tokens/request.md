# 요청 원문

디자인 검사 수정부터 진행해

(2026-11-18 · claude-desktop@external 전달 · .tmp/lead-design-1118.md)

## 이슈 #254 — 디자인 8: 색 숫자를 토큰으로 (안쪽 정리)
- 그림자 rgba(22,36,110,…) 8곳 → --shadow-* 토큰
- intro/window-transition.tsx #EAF4F2 · #FFFFFF · #F4F6F8 · intro/intro.tsx #AFD4E6 → 토큰
- 화면 모양은 바뀌지 않아야 함 (전후 캡처 비교)
- 예외: opengraph-image.tsx (공유 이미지 생성기는 CSS 토큰을 못 읽음)

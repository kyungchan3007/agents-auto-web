# 요청 원문

디자인 검사 수정부터 진행해

(2026-11-18 · claude-desktop@external 전달 · .tmp/lead-design-1118.md)

## 이슈 #252 — 디자인 6: 접근성 · 기본기 묶음
- SectionTitle 이 h2 로 그려지는지 확인 · 섹션 제목을 제목 태그로 (destinations · budget-planner · converter · customs · story 등)
- 본문 바로가기(skip link) — 첫 Tab 이 로고
- 버튼 눌림(:active) 상태 (packages/ui form/button.tsx)
- 탭 밑줄이 left · width 를 직접 움직임 → transform (packages/ui form/tabs.tsx)
- html · body overflow-x: clip (globals.css)
- 경고 표시 이모지 ⚠ (shared/outage-notice.tsx · ui feedback/freshness-note.tsx) → 그림(SVG) 아이콘

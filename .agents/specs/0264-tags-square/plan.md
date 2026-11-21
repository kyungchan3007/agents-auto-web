# 계획 — 작업 0264 · 읽기 전용 꼬리표를 모서리 6px 네모로 (여행 타이밍 두 곳 · Quick · 디자인 PR)

요구 · 기준 원본: [handoff.md](handoff.md) (시안 36 A안).

## 무엇을
- `window-tag`(창밖 카드 · window-months.tsx) `rounded-pill` → 모서리 6px
- `airfare-tag`(출발일 달력 탑승권 · airfare-calendar.css `.af-pass .tag`) → 모서리 6px
- 색 · 크기 · 글 · 높이 그대로. 다른 꼬리표 · 핀 · 도장 · 누르는 알약은 그대로

## 결정 (lead)
- 화면 파일 두 개 → 디자인 PR(`design` 라벨).
- airfare-calendar.css 는 열린 #315(0263 · 640px 이하 .af-card)와 같은 파일 · 다른 규칙 → 머지 순서대로 정리.

## 누가
- builder — 한 커밋 · 푸시
- test — 깨진 기능 테스트만 · 보고
- lead — PR · CI gate · 회신

## 파일 계획
- apps/web/src/features/travel-price/components/window-months.tsx
- apps/web/src/features/travel-price/components/airfare-calendar.css
- apps/web/e2e/** (test · 깨진 것만)
- docs/design-tests-pending.md (생기면)
- .agents/specs/0264-tags-square/** · .agents/orchestration/TASKS.md

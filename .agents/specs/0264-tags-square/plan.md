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
- apps/web/src/features/travel-price/components/price-route.tsx (두 번째 요청 가 · 나)
- packages/ui/src/components/data/stamp.tsx · (필요하면) signal-pin.tsx (두 번째 요청 다 · 나)
- apps/web/e2e/** (test · 깨진 것만)
- docs/design-tests-pending.md (생기면)
- .agents/specs/0264-tags-square/** · .agents/orchestration/TASKS.md

## 두 번째 요청 (13:25Z · handoff-2.md · 시안 37) — 같은 PR(#316)에 묶음
- 가: 여행 물가 노선 `route-kr-tag`("한국 100 기준") 모서리 6px · 안의 국기는 둥글게 · 커지는 움직임 그대로
- 나: 정거장 카드 판정 꼬리표 두 종류("한국 100 기준" · `route-card-signal` 안) 모서리 6px · 움직임 줄이기 목록 · 스크롤 노선 둘 다
- 다: 직구 "면세 한도 안" 도장(`stamp.tsx`) 모서리 6px · 기울기 · 테두리 · 글 그대로 · 도장을 쓰는 다른 곳을 PR 에 적음
- 판정 핀 부품이 공용이라 누를 수 있는 줄 · 링크 안의 핀까지 바뀌면 바뀌는 화면 목록을 PR 에 적음(읽기 전용 자리만 바꾸는 것이 목표 — 선택 값 권장)
- 한 커밋 = 한 항목(가 → 나 → 다). 묶는 이유: 같은 규칙 · 작업서가 묶어도 된다고 함 · PR · CI 한 번 줄임

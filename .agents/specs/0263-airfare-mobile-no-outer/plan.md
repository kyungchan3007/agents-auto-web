# 계획 — 작업 0263 · 출발일 달력: 휴대폰에서만 바깥 테두리 카드 없앰 (Quick · 디자인 PR)

요구 · 기준 원본: [handoff.md](handoff.md) (시안 34 A안 · 휴대폰).

## 무엇을
- `airfare-calendar.css` 의 `.af-card` 를 휴대폰에서만 border 0 · background none · padding 0. 안의 구성 · 순서 · 움직임 그대로
- 적용 폭은 900px 또는 640px 중 builder 가 택하고 PR 에 적음. 넓은 화면(두 단)은 바뀌지 않음
- 카드가 없어진 뒤 탑승권 · 날짜 판이 구간 좌우 여백 선에 맞는지 · 가로 넘침 없음

## 결정 (lead)
- CSS 한 파일 → 디자인 PR(`design` 라벨). builder 는 0260 다음.

## 누가
- builder — 한 커밋 · 푸시
- test — 깨진 기능 테스트만 · 가로 넘침(사용자 조건) 확인 · 보고
- lead — PR · CI gate · 회신

## 파일 계획
- apps/web/src/features/travel-price/components/airfare-calendar.css
- apps/web/e2e/** (test · 깨진 것만)
- docs/design-tests-pending.md (생기면)
- .agents/specs/0263-airfare-mobile-no-outer/** · .agents/orchestration/TASKS.md

# 계획 — 작업 0252 · 여행지 고르기 팝업 움직임 · 출발일 달력 문장 옮기기 (Quick · 디자인 PR)

요구 · 항목별 기준 원본: [handoff.md](handoff.md) (항목 1 · 2 그대로).

## 무엇을
- 1 여행지 고르기 팝업 — 넓은 화면은 scale in(0.96 → 1 · 불투명도 0 → 1 · ease-out) · 휴대폰은 바텀 시트 slide in · 배경 fade · 닫을 때 같은 움직임 거꾸로(닫기 · 배경 · Esc · 골라 닫힘 모두) · 움직임 줄이기는 바로
- 2 출발일 달력 비교 문장(`airfare-sub`) — 날짜 띠 상자(`.af-stage`) 맨 아래 범례 아래로 · 옅은 가로선(위 14px · 아래 12px)

## 결정 (lead)
- 0251(PR #301)과 묶지 않고 따로 연다. 0251 은 hooks 를 바꿔 평소 PR 이 됐고, 이 두 건은 화면 파일만이라 디자인 PR 로 둘 수 있다. 파일도 겹치지 않는다.
- 한 커밋 = 한 항목(1 → 2).
- 닫는 움직임에 상태가 필요해 `hooks/` · `lib/` 를 바꾸게 되면 평소 PR 이 된다 — builder 는 가능하면 CSS(`starting:` · `transition-discrete` · `data-*` 상태) · 부품 안에서 처리하고, 허용 목록 밖 파일을 바꾸면 보고에 적는다.
- 탑승권 3초 뒤 사라짐(시안 25번)은 넣지 않는다.
- 작업 폴더 번호: `spec:new` 가 origin/develop 기준이라 0251 로 만들었다가 0252 로 옮김(0251 은 PR #301).

## 누가
- builder — 1 · 2 구현 · 항목별 커밋 · 푸시
- test — 표시 없는 테스트가 깨질 때만(팝업 닫힌 직후 "없다"를 보는 테스트는 움직임이 끝나기를 기다리게) · 로컬 확인 · 보고
- lead — PR(`design` 라벨 · 판정 확인 뒤) · CI gate · 회신

## 파일 계획
- packages/ui/src/components/form/pick-trip.tsx
- apps/web/src/features/travel-price/components/airfare-calendar.tsx
- apps/web/src/features/travel-price/components/airfare-calendar.css
- apps/web/e2e/** · packages/ui/src/**/*.test.tsx · apps/web/src/**/*.test.ts(x) (test · 깨진 것만)
- docs/design-tests-pending.md (미뤄 둔 디자인 테스트가 생기면)
- .agents/specs/0252-unslop-fix-two/** · .agents/orchestration/TASKS.md

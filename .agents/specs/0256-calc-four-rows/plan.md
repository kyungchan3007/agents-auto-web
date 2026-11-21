# 계획 — 작업 0256 · 직구 계산 입력 카드 네 줄 간격 같게 · 안쪽 여백 늘림 (Quick · 디자인 PR)

요구 · 기준 원본: [handoff.md](handoff.md). 작업 0251 ㄱ 을 다시 고친다(앞 작업서의 "위아래에 붙이고 사이에 나눔"이 잘못 적힌 것).

## 무엇을 (넓은 화면 lg 이상만)
- 입력 카드를 가로 줄 네 개(① 통화 · 물건 값 ② 보내는 곳 라벨 + 미국 ③ 그 밖 나라 ④ 배송비 · 관세율)로 보고 세 간격(①↔② · ②↔③ · ③↔④)을 같은 값으로
- 위 · 아래 안쪽 여백을 py-6 보다 늘려, 남는 높이를 줄 사이에만 몰지 않고 여백과 나눔 → 결과 카드와 아래 선 맞춤 유지(결과 카드 높이가 바뀌어도)
- ② · ③ 이 한 묶음(fieldset · 라디오)인 구조 · 접근성 이름 유지 · 휴대폰 그대로

## 결정 (lead)
- 화면 파일 하나 → 디자인 PR(`design` 라벨). hooks · lib 는 바꾸지 않는다.
- 높이를 맞추는 방법(예: 카드는 늘이고 네 줄 묶음을 세로 가운데 · 줄 간격 고정 · 위아래 여백이 남는 높이를 나눠 가짐)은 builder 가 정한다. 목표는 "위 여백 · 줄 사이 · 아래 여백이 비슷한 값".

## 누가
- builder — 구현 한 커밋 · 푸시
- test — 0251 간격 기능 테스트가 "위아래에 붙는다"를 보면 새 조건(세 간격 같음 · 아래 선 맞음)으로 · 보고
- lead — PR · CI gate · 회신

## 파일 계획
- apps/web/src/features/import-calc/components/calc-form.tsx
- apps/web/e2e/** · apps/web/src/**/*.test.ts(x) (test · 깨진 것만)
- docs/design-tests-pending.md (생기면)
- .agents/specs/0256-calc-four-rows/** · .agents/orchestration/TASKS.md

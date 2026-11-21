# 계획 — 작업 0256 · 직구 계산 입력 카드: 입력 칸 사이 간격 64px (Quick · 디자인 PR)

요구 · 기준 원본: [handoff.md](handoff.md) (11:27Z 고친 판 · 시안 29 B안). 작업 0251 ㄱ 을 다시 고친다.

## 무엇을 (넓은 화면 lg 이상만)
- 줄 = **입력 칸 상자**(테두리 있는 칸). 라벨 · 도움말은 줄이 아니라 간격 안에 든다.
  - ① 통화 · 물건 값 칸 ② 미국 · 목록통관 칸 ③ 그 밖 나라 · 일반통관 칸 ④ 국제 배송비 · 관세율 칸
- 간격(윗칸 아래 선 → 아랫칸 위 선) ①↔② · ②↔③ · ③↔④ 모두 **64px** (지금 139 · 8 · 109)
- 카드 높이 = 결과 카드(아래 선 맞춤 유지). 남는 높이는 카드 위 · 아래 안쪽 여백이 똑같이 나눔(시안: 583px 기준 83 / 83). 64px 는 고정
- 라벨은 칸 위 약 6px · 도움말은 칸 아래 약 6px 그대로 · 라디오 묶음 · 접근성 이름 유지 · 휴대폰 그대로

## 결정 (lead)
- 11:19Z 판(줄 = 라벨 포함 덩어리 · 세 간격 같게)은 폐기. builder worktree 에 남은 커밋 안 된 수정(subgrid · content-evenly)은 새 기준과 다르면 버리고 새로 한다 — builder 판단.
- 화면 파일 하나 → 디자인 PR(`design` 라벨). hooks · lib 는 바꾸지 않는다.

## 누가
- builder — 구현 한 커밋 · 푸시
- test — 0251 간격 기능 테스트가 있으면 새 조건(칸 사이 64px · 위아래 여백 같음 · 아래 선 맞음)으로 · 보고
- lead — PR · CI gate · 회신

## 파일 계획
- apps/web/src/features/import-calc/components/calc-form.tsx
- apps/web/e2e/** · apps/web/src/**/*.test.ts(x) (test · 깨진 것만)
- docs/design-tests-pending.md (생기면)
- .agents/specs/0256-calc-four-rows/** · .agents/orchestration/TASKS.md

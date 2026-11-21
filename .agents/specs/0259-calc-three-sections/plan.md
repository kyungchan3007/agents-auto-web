# 계획 — 작업 0259 · 직구 계산 입력 카드를 세 구역으로 (Quick · 디자인 PR)

요구 · 기준 원본: [handoff.md](handoff.md) (시안 31 B안). 작업 0256(입력 칸 사이 64px)을 바꾼다.

## 무엇을
- 입력 카드를 세 구역(① 물건: 통화 · 물건 값 ② 보내는 곳: 두 선택지 위아래 · 사이 8px ③ 더 정확하게 (선택): 배송비 · 관세율)으로 묶고 구역 제목(15px · 700 · 본문색) · 제목 ↔ 칸 14px
- 구역 사이 가는 가로선(1px · --hav-line · 카드 안쪽 폭 전체)
- 0256 의 lg:absolute 라벨 · 도움말 · lg:gap-y-16 · lg:py-10 걷어 냄 → 라벨 ↔ 칸 6px · 칸 ↔ 도움말 6px 보통 흐름
- 넓은 화면: 카드 높이 = 결과 카드 · 남는 높이는 구역 ↔ 선 ↔ 구역 사이 네 곳에 똑같이(space-between · 최소 20px) · 위아래 안쪽 여백 28px
- 휴대폰: 세 구역 · 제목 · 선은 같게, 간격은 보통(구역 사이 약 20px) · 칸 배치 그대로
- 접근성: 구역은 fieldset/legend 또는 role=group + 이름 · 라디오 묶음 이름 "보내는 곳" 유지 · 제목 단계(h2 등) 건드리지 않음

## 결정 (lead)
- builder(구현)와 test(새 조건 테스트)를 나란히 한다. 0256 에서 넣은 calc-gap 64px 테스트는 사용자가 조건을 바꿨으므로 새 조건(구역 · 선 사이 네 간격 같음 ±1 · 두 선택지 사이 8px · 두 카드 아래 선 같음)으로 바꾼다 — 표시 없는 기능 테스트.
- 화면 파일만 → 디자인 PR(`design` 라벨). PR 은 builder · test 커밋이 모두 올라온 뒤 연다(라벨이 첫 CI 부터 반영되게).

## 누가
- builder — calc-form.tsx 한 커밋 · 푸시
- test — calc-gap.spec.ts 새 조건 · 제목 구조 · 접근성 이름 테스트 확인 · 보고
- lead — PR(`design`) · CI gate · 회신

## 파일 계획
- apps/web/src/features/import-calc/components/calc-form.tsx
- apps/web/e2e/calc-gap.spec.ts · apps/web/e2e/** · apps/web/src/**/*.test.ts(x) (test)
- docs/design-tests-pending.md (생기면)
- .agents/specs/0259-calc-three-sections/** · .agents/orchestration/TASKS.md

# 계획 — 작업 0262 · 흔들리는 e2e — rename-compare 휴대폰 위치 비교 (Quick · 테스트만)

## 확인한 것 (lead)
- #310 CI(@2274bd9)에서 이 테스트는 휴대폰 한 번 실패 뒤 재시도 통과(흔들림 1) — gate 를 막은 것은 보호 파일 승인뿐.
- 오늘 바뀐 파일 중 /geo 화면 코드는 없음(geo-design.spec.ts 테스트 파일만).
- 테스트가 boundingBox 를 한 번만 재서 비교 → 휴대폰에서 배치가 자리 잡기 전이면 실패 가능.

## 무엇을
- 위치 비교를 최종 배치를 기다리게(예: `expect.poll` 로 두 상자 위치를 다시 재기) — 조건(맨 위 구간이 수치 카드보다 위)은 그대로.
- /geo 화면 코드는 바꾸지 않는다.

## 누가
- test — 고침 · 휴대폰 폭으로 해당 spec 여러 번(--repeat-each) 로컬 확인 가능하면 · 보고
- lead — PR(라벨 없음 · 테스트만) · CI gate · 회신

## 파일 계획
- apps/web/e2e/rename-compare.spec.ts
- .agents/specs/0262-flaky-rename-compare/** · .agents/orchestration/TASKS.md

# 계획 — 작업 0250 · 미뤄 둔 디자인 테스트 8개 정리 (Quick · 테스트 · 목록 파일만)

요구 · 항목별 기준 원본: [handoff.md](handoff.md).

## 무엇을
- docs/design-tests-pending.md 에 쌓인 8개(0248 6 · 0249 2)를 지금 모양에 맞게 줄인다. 겹침 · 화면 밖 · 주요 구역 안 보임은 남기고, 여백 · 좌표 · 색 · 모서리 정확한 값 고정은 걷어 내거나 느슨하게.
- 그림자 검사는 유지하되 pick-trip.tsx(팝업) · flag.tsx(국기 테두리)를 파일 이름으로 예외 + 이유 주석.
- 고친 뒤 "쌓인 목록" 비움(형식 설명은 남김).

## 결정 (lead)
- PR #299(0249 머지 뒤 목록 기록 · 작업표)는 닫고 이 브랜치에 합친다 — 이 브랜치는 #299 브랜치(task/0249-pending-doc) 위에서 시작.
- 이 PR 은 **design 라벨 없이** 평소 PR 로 통과해야 한다(목적: develop 게이트가 라벨 없이 통과).
- 화면 코드는 바꾸지 않는다. 테스트가 화면이 틀렸다고 보이면 고치지 말고 lead 에게 보고.

## 누가
- test — 8개 정리 · 목록 비우기 · 넓은 화면 + 휴대폰 로컬 실행 · 로컬 `bash .agents/checks.sh`(라벨 없음) 통과 확인 · 커밋 · 푸시
- lead — PR(라벨 없음) · CI gate · 회신

## 파일 계획
- apps/web/src/shared/prices-title.test.ts
- apps/web/src/shared/redesign-foundation.test.ts
- apps/web/src/shared/number-emphasis.test.ts
- apps/web/e2e/prices-redesign.spec.ts
- apps/web/e2e/prices-route.spec.ts
- apps/web/e2e/detail-design.spec.ts
- apps/web/e2e/calc-gap.spec.ts
- apps/web/e2e/**
- apps/web/src/**/*.test.ts
- packages/ui/src/**/*.test.tsx
- docs/design-tests-pending.md
- .agents/orchestration/TASKS.md

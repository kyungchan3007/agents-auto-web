# 계획 — 작업 0251 · develop 확인 뒤 지적 네 건 (Quick · 디자인 PR)

요구 · 항목별 기준 원본: [handoff.md](handoff.md) (요약하지 않음 — 항목 ㄱ · ㄴ · ㄷ · ㅁ 그대로).

## 무엇을
- ㄱ 직구 입력 카드 줄 간격 — 넓은 화면에서 첫 줄 · 마지막 줄은 안쪽 여백에 붙이고 사이 간격만 같게 (카드 높이 · 아래 맞춤 유지)
- ㄴ 여행 물가 노선 — 앞뒤 정거장 값이 같으면 비행기 제자리(뛰기 0 · 고리 다시 안 퍼짐 · 좌우 안 뒤집힘), 나라 쪽만 바뀜
- ㄷ 노선 제목 위 여백을 0249 이전 값으로 · "한국 = 100" 라벨과 그 자리(mt-3) 삭제
- ㅁ 여행 타이밍 창밖 막대 받침 선 — 휴대폰에서도 막대 아랫변에 딱 닿게 (선 위치를 막대 아랫변에 묶는 쪽)

## 결정 (lead)
- 한 커밋 = 한 항목(ㄱ · ㄴ · ㄷ · ㅁ 순).
- **디자인 PR 판정:** ㄴ 은 `lib/price-route.ts`(lib)를 바꾼다. 허용 목록(`.agents/scripts/design-pr.mjs`)에 lib 가 없으면 `design` 라벨을 달아도 평소 PR 로 떨어진다(경고 줄). 그때는 @design 실패도 막으므로, test 가 깨진 @design 테스트를 이 PR 에서 맞춘다. 판정 결과는 builder 커밋 뒤 lead 가 `design-pr.mjs` 로 확인한다.
  - lib 를 건드리지 않고 컴포넌트에서만 처리할 수 있으면 builder 가 그쪽을 고른다(디자인 PR 유지). 단, `routeHop` 의 같은 값 처리가 lib 에 있으므로 무리하게 옮기지 않는다 — 동작이 맞는 쪽이 우선.
- 표시 없는 테스트 중 "같은 값이면 제자리 뛰기"를 고정한 것은 새 동작(같은 값이면 0)으로 바꾼다(사용자 결정 · 작업서 ㄴ).

## 누가
- builder — ㄱ · ㄴ · ㄷ · ㅁ 구현 · 항목별 커밋 · 푸시
- test — 표시 없는 테스트가 깨질 때만(ㄴ 의 제자리 뛰기 테스트 · 평소 PR 로 떨어지면 깨진 @design 도) · 로컬 확인 · 보고
- lead — PR(`design` 라벨 여부는 판정 뒤) · CI gate · 회신

## 파일 계획
- apps/web/src/features/import-calc/components/calc-form.tsx
- apps/web/src/features/travel-price/lib/price-route.ts
- apps/web/src/features/travel-price/components/price-route.tsx
- apps/web/src/features/travel-price/components/price-page.tsx
- apps/web/src/features/travel-price/components/window-months.tsx
- apps/web/src/features/travel-price/**/*.test.ts(x) · apps/web/e2e/** (test · 깨진 것만)
- docs/design-tests-pending.md (미뤄 둔 디자인 테스트가 생기면)
- .agents/specs/0251-unslop-fix-four/** · .agents/orchestration/TASKS.md

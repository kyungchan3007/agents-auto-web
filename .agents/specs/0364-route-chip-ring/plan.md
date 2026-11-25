# 계획

## 무엇을 · 왜
- 0363 에서 골라진 노선 칩에 data-surface=dark 를 달았는데, #430 두 번째 실행에서 "인도" 칩이 흰 고리 · 밝은 면으로 실패(0363 전과 반대). 어두운 면 표시가 남색 바탕이 아닌 칩(또는 바탕이 바뀌기 전 칩)에 붙은 것으로 보임.
- 실제 화면에서 Tab 으로 칩에 갈 때 칩 바탕 · data-surface · 골라진 칩 판정을 재서 원인을 찾고, 바탕이 남색일 때만 어두운 면 표시가 붙게 고침(코드 · builder). 테스트는 고치지 않음.

## 파일 계획
- apps/web/src/features/prices/route/** (builder)
- .agents/specs/0364-route-chip-ring/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] #430 전체 e2e 통과(focus-ring /prices)

## 허점
- 0363 의 초점 고리 수정을 focus-ring.spec 으로 확인하지 못하고(로컬 가드) 냈다가 반대 방향으로 다시 실패.

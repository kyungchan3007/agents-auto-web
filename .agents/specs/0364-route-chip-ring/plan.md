# 계획

## 무엇을 · 왜
- 0363 에서 골라진 노선 칩에 data-surface=dark 를 달았는데, #430 두 번째 실행에서 "인도" 칩이 흰 고리 · 밝은 면으로 실패(0363 전과 반대). 어두운 면 표시가 남색 바탕이 아닌 칩(또는 바탕이 바뀌기 전 칩)에 붙은 것으로 보임.
- 실제 화면에서 Tab 으로 칩에 갈 때 칩 바탕 · data-surface · 골라진 칩 판정을 재서 원인을 찾고, 바탕이 남색일 때만 어두운 면 표시가 붙게 고침(코드 · builder). 테스트는 고치지 않음.

## 파일 계획
- apps/web/src/features/prices/route/** (builder)
- .agents/specs/0364-route-chip-ring/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 판정
- 원인: 0363 의 data-surface=dark 가 토큰 전체를 뒤집어 골라진 칩이 밝은 바탕이 됨(화면 퇴행) · 고리만 흰색.
- 고침: data-surface 를 떼고 골라진 칩에만 토큰 클래스 [--hav-ring:var(--hav-ring-on-dark)](통화 칩과 같은 방식 · 직접 색 숫자 없음).

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] #430 전체 e2e 통과(focus-ring /prices)

## 허점
- data-surface 는 고리 색만이 아니라 토큰 전체를 바꾼다는 것을 모르고 고침을 제안 · 확인 없이 냄. 고리 색만 바꿀 때는 --hav-ring-on-dark 토큰.
- 0363 의 초점 고리 수정을 focus-ring.spec 으로 확인하지 못하고(로컬 가드) 냈다가 반대 방향으로 다시 실패.

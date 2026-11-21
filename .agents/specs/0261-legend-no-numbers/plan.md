# 계획 — 작업 0261 · 여행 타이밍 그래프 범례에서 숫자 빼기 (Quick · 디자인 PR)

요구 · 기준 원본: [handoff.md](handoff.md) (시안 33).

## 무엇을
- /flights 그래프 범례(`travel-legend`) 세 단추를 선 이름만: "국제항공료" · "해외단체여행비" · "원/달러 월평균"
- 그대로: 그래프 끝 말풍선 숫자 · 오른쪽 칸 숫자 · 범례 단추 모양 · 켜고 끄기 · 선 색
- 낭독 이름도 선 이름으로(숫자는 말풍선 · 오른쪽 칸에서 읽힘을 확인)
- 같은 그래프 부품을 다른 페이지가 쓰면 그곳은 그대로 — 공용이면 선택 값으로 여행 타이밍에서만

## 결정 (lead)
- 화면 파일만 → 디자인 PR(`design` 라벨). 범례에 숫자가 있어야 한다는 표시 없는 테스트가 있으면 사용자가 조건을 바꾼 것이므로 test 가 새 조건으로.
- 0260(통화 표 · test 가 테스트 쓰는 중)과 파일이 겹치지 않아 나란히 진행.

## 누가
- builder — 구현 한 커밋 · 푸시
- test — 깨진 테스트만(0260 테스트 다음) · 보고
- lead — PR(`design`) · CI gate · 회신

## 파일 계획
- apps/web/src/features/travel-price/components/** (범례 · 그래프 부품)
- packages/ui/src/components/** (범례 부품이 공용이면)
- **/*.test.ts(x) · apps/web/e2e/** (test · 깨진 것만)
- docs/design-tests-pending.md (생기면)
- .agents/specs/0261-legend-no-numbers/** · .agents/orchestration/TASKS.md

# 계획

## 무엇을 · 왜
- data 가 11-23(월) 12:00 환율 수집 · 과세환율 · 항공권 첫 예약 수집을 점검한 기록을 docs/data-health.md 에 남긴다 (#370 둘째 항목)
- 작업 종류 ①(자료 · 문서만) — 새 테스트 없음 · 운영 화면 변화 없음이라 변경 기록(.changeset) 없음

## 애매한 곳
- 항공권 출발일 범위가 12-31 로 고정이라 회차마다 줄 수가 줄어듦(336 → 312). 의도인지는 사용자 확인 대상으로 남김 (가정: 이번 작업에서는 기록만)

## 파일 계획
- docs/data-health.md
- .agents/specs/0314-data-health-1123/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 점검 기록에 받지 못한 값을 채워 넣지 않음

## 허점
- 

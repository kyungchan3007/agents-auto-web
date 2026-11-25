# 계획

## 무엇을 · 왜
- 11-25(수) 수집 상태를 점검해 docs/data-health.md 에 기록한다(작업 종류 ①: 자료 기록 · 새 테스트 없음).
- 환율 12:00 회차: 공식 값 개수 · 받은 날짜(공개 API · 워크플로 결과로만).
- 새벽 예약 수집: 오늘 gsc-sync(03:04Z) · ig-insights(03:10Z) · ga4-sync(03:12Z) 모두 예약(schedule)으로 성공 · 예정 시각(04:20 · 04:40 · 04:50 KST)보다 약 7시간 늦음. GA4 는 새 페이지별 머무름(0349 · team_snapshots 키 두 개)이 저장됐는지 실행 기록으로.

## 파일 계획
- docs/data-health.md

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 받지 못한 값은 "없음" · 운영 D1 직접 조회 없음

## 허점
-

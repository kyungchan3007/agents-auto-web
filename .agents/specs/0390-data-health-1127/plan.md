# 계획

## 무엇을 · 왜
- 11-27(금) 환율 12:00 회차가 들어왔는지 · 공식 값 개수 · 받은 날짜를 확인해 docs/data-health.md 에 기록한다.
- develop 빌드(371b8202 이후)에서 빌드 자료 검사(작업 0388)가 통과했는지 한 줄 적는다(Cloudflare 빌드 기록 또는 CI gate 로그의 '[빌드 자료 검사]' 줄).
- 새벽 예약 수집(검색 노출 04:20 · 인스타 유입 04:40 · GA4 유입 04:50)이 오늘 돌았는지 실행 기록으로 확인 · 안 돌았으면 gh workflow run 으로 직접 실행. 운영 D1 직접 조회는 하지 않는다. 숫자는 실제 확인한 것만.
- 작업 종류 ①: 자료 · 새 테스트 없음.

## 파일 계획
- docs/data-health.md
- .agents/specs/0390-data-health-1127/** · .agents/orchestration/TASKS.md(0390 · 0391 줄)

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] develop 머지까지 · main 반영은 사용자가 말할 때

## 허점
-

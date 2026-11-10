# 계획

## 무엇을 · 왜
- IndexNow 가 "오늘(한국 날짜) 바뀐 주소"만 보내서, GitHub 예약이 밤 12시를 넘겨 늦게 돌면 그날 바뀐 페이지를 하나도 보내지 못한다 (2026-11-09 16:00 예약이 11-10 02:18 에 실행됨).
- 보낼 범위를 "어제 · 오늘(한국 날짜) 바뀐 주소"로 넓힌다. 같은 주소를 하루 더 보내도 IndexNow 는 문제없이 받는다.

## 애매한 곳
- 범위를 이틀로 (가정 · 지연이 하루를 넘긴 적은 아직 없음)
- `.github/workflows/indexnow.yml` 주석의 "오늘"은 보호 파일이라 그대로 둔다

## 파일 계획
- apps/web/scripts/indexnow.ts
- apps/web/scripts/indexnow-lib.ts
- apps/web/scripts/indexnow-lib.test.ts
- README.md
- docs/geo-measurement.md
- .agents/specs/0146-indexnow-window/**

## 계획 밖 변경 이유

## 완료 기준
- [x] bash .agents/checks.sh PASS
- [x] 밤 12시를 넘겨 실행돼도 전날 바뀐 주소가 들어가는 테스트
- [ ] 머지 뒤 손으로 실행해 11-09 · 11-10 바뀐 주소를 보냄

## 허점
- 작업 0145 계획의 파일 목록에 "- " 를 빼먹어 범위 검사가 파일 계획을 빈 것으로 보고 경고했는데 놓쳤다 (경고는 실패가 아니라 게이트 마지막 줄만 봄).
- 작업 0144 에서 GitHub 예약이 몇 시간씩 늦는다는 것(작업 0094 기록)을 알면서 "오늘"만 보냈다.

# 계획

## 무엇을 · 왜
- 작업서 2번: 인스타 팔로워 수 수집 + 어드민 인스타 표에 추가. 11-24 첫 캐러셀(17919490152498537) 11-25 · 26 행이 왜 비는지 원인 확인.
- 팔로워 수는 계정 insights 지표가 아니라 계정 필드(followers_count)일 수 있음. 공식 문서로 확인하고, 매일 하루 값 하나를 기존 계정 값 줄(account row)로 쌓는다(스키마를 바꾸지 않는 쪽 우선).
- 빈 행 원인 후보: 게시물 종류(캐러셀)가 지원하지 않는 지표 하나로 요청 전체가 400 이 나서 값이 버려짐(작업표 후보 "지표별 다시 부르기"). 실행 로그로 확인 뒤 고친다. 확인 못 하면 "확인하지 못함".
- 받지 못한 값은 빈 칸(지어내지 않음). 비밀값 출력 금지.
- 작업 종류 ③(숫자): 요구마다 단위 테스트. 순서 test → builder.

## 애매한 곳
- 팔로워 수를 쌓는 곳: 기존 계정 값 줄에 지표 이름 하나 더 (가정 · 스키마 변경이 필요하면 멈추고 lead 에게)
- 워크플로 · wrangler 변경 필요 없음 (가정 · 필요하면 먼저 알림)

## 파일 계획
- apps/api/scripts/ig-insights.ts · apps/api/scripts/ig-insights 관련 lib(apps/api/src/** 안 인스타 계산)
- packages/shared/src/** (인스타 계약에 팔로워 수가 필요하면)
- apps/admin/src/features/instagram/**
- *.test.ts · apps/admin/e2e/** (test)
- .agents/specs/0375-ig-followers/** · .agents/specs/0376-search-engine-api/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 빈 행 원인 확인 결과(확인된 것 · 못 한 것)를 PR 본문에
- [ ] develop 머지 뒤 develop → admin fast-forward · 함께 나간 커밋 목록 회신

## 허점
-

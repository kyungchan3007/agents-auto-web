# 계획

## 무엇을 · 왜
- 이탈 줄이기 묶음(0344 · 0345 · 0346 · 0347 · 0349)이 develop 에 들어간 뒤 main PR #409 전체 e2e 실패(run 45457945440). main 에 보내기 전에 고친다.
- 운영(web) 실패 다섯 spec: 실패마다 시안대로 바뀐 의도된 변경이면 테스트를 새 시안에 맞게(test), 시안과 다르게 깨졌으면 코드를 고침(builder). 사용자가 정한 조건(누르는 자리 44px · 밀림 없음 · 판정 줄 등)은 테스트를 바꾸지 않고 코드를 고친다.
- 어드민 실패(basics /geo 제목 · geo-bot-pages 콘솔 오류 · ⌘K · 숫자 단축키 · log-today-gate · GEO 카드): 이번 묶음 전 develop(0349 머지 전 커밋)에서도 깨지는지 먼저 구분. 전에도 깨졌으면 이번 작업 범위 밖으로 기록하고 claude-desktop 에 알림.
- 판단 근거를 PR 에 실패마다 한 줄씩.

## 파일 계획
- apps/web/e2e/** · apps/admin/e2e/** (test)
- apps/web/src/features/{home,currencies,prices}/** · apps/admin/src/** (builder · 코드가 원인일 때만)
- .agents/specs/0351-main-e2e-fix/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] develop 머지 뒤 #409 전체 e2e 통과 → 그때만 main ff

## 허점
- develop 대상 PR 은 e2e 를 돌리지 않고 로컬은 바꾼 spec 만 돌려, 기존 spec 이 깨진 것을 main PR 에서야 알았다. 공용 부품 · 경로를 바꾼 작업은 연결표로 고른 기존 spec 을 main 전에 한 번 돌리는 단계가 필요하다(하네스 후보 · claude-desktop 에 제안).

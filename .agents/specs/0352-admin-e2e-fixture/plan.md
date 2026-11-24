# 계획

## 무엇을 · 왜
- 어드민 e2e 여섯 곳이 이번 묶음 전(58a3381f)부터 깨져 있었다. 원인은 작업 0326 이 API 읽기에 어드민 열쇠를 요구해, 열쇠가 없는 빌드(로컬 · CI)에서 /geo 가 HTTP 401 로 정적 빌드되기 때문(test 확인). 운영 어드민은 Worker 가 열쇠를 가져 영향 없음.
- 테스트만 고쳐 main 전체 e2e 를 통과시킨다(코드 · 빌드 · 보호 파일 변경 없음).
  - admin.spec:113 GEO 카드 · admin.spec:48 ⌘K · admin.spec:74 숫자 단축키 · basics /geo 제목: /bff/geo 를 가짜 응답(봇 · 날짜별 · 질문 '관세청 과세환율' · 검색 · 인용)으로 채움.
  - geo-bot-pages:110 콘솔 오류: /session 도 가짜 응답(안내 창 안 뜨는 모양 200)으로 채움(admin-gate.spec 방식).
  - admin.spec:127 서버가 그린 HTML 검사: 빌드에 자료가 없을 때(HTTP 401 문구)는 건너뜀으로 표시하고 이유를 테스트에 적음 (lead 결정).

## 애매한 곳
- ⑥ 건너뜀은 검사를 약하게 만드는 것. 서버 그림에 자료가 들어간다는 약속은 빌드에 열쇠를 넘기거나 CI 에 빌드용 고정 자료 API 를 둬야 다시 검증된다(보안 · 보호 파일) → claude-desktop 에 알림.

## 파일 계획
- apps/admin/e2e/**
- .agents/specs/0352-admin-e2e-fixture/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- 실패는 처음 본 여섯이 아니라 열 가지(로그가 잘려 있었음): 추가 ⑦ 가로 막대 숫자 · ⑧ 움직임 줄이기 · ⑨ basics /geo 큰 제목 · 카드 · 읽는 법(같은 원인 · 테스트로 고침), ⑩ log-today-gate:47(코드 원인).
- apps/admin/src/features/log/records/record-card.tsx: 실패 줄 키가 PR 주소라 같은 PR 실패 둘이면 겹쳐 옛 줄이 남음(0341 버그) → 키를 실행 주소로(builder).

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] main PR 전체 e2e 에서 어드민 여섯 곳 통과 또는 ⑥ 건너뜀

## 허점
- 작업 0326 뒤 어드민 e2e 가 계속 깨져 있었지만 main 전 전체 e2e 를 돌리지 않아 몰랐다.
- 서버 그림 검사(admin.spec:127)는 열쇠 없는 빌드에서 검증할 수 없다. CI 에 어드민 빌드용 고정 자료 API 를 두는 작업이 필요하다(보호 파일 · 사람 승인).

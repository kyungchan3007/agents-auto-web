# 계획

## 무엇을 · 왜
- 어드민 Worker(flapfx-admin)의 운영 브랜치를 main 에서 admin 으로 나눈다. develop · task 빌드가 어드민에 미리보기 버전을 올려 admin:token 의 비밀값 넣기가 실패했다(11-23 · 11-25).
- admin 브랜치는 origin/main 에서 만들었다(claude-desktop). Cloudflare 대시보드의 운영 브랜치 변경 · 다른 브랜치 빌드 끄기는 사용자가 한다.
- 팀 규칙 · 구조 문서에 "어드민은 admin 브랜치로 fast-forward" 를 적는다. 0367(admin:token 버전 확인 보완)은 필요 없어져 취소.

## 파일 계획
- .agents/orchestration/team.md
- docs/architecture.md
- .agents/specs/0368-admin-branch/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 대시보드 설정 뒤 develop 커밋에 어드민 미리보기 버전이 생기지 않음(사용자 확인)

## 허점
- 어드민과 운영 사이트가 한 운영 브랜치(main)를 같이 써서, 어드민만 따로 반영하거나 비밀값을 넣을 때마다 다른 브랜치 빌드와 부딪혔다.

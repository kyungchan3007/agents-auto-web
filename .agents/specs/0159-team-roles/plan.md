# 계획

## 무엇을 · 왜
- 여러 에이전트 팀(lead · builder · test · geo)의 역할과 고칠 수 있는 파일 범위를 한 문서로 정한다. 같은 파일을 두 역할이 동시에 고치지 않게 하고, 누가 PR 을 여는지 정한다.

## 애매한 곳
- 서버 담당 칸이 양식에 없음 → builder 가 apps/api 도 맡는다 (가정 · 사용자가 초안 확인 후 "저장해")
- GEO 와 builder 가 겹치는 공용 파일(layout.tsx 등) → GEO 가 lead 에게 제안 (가정)
- PR 은 lead 만 연다 — spec 번호 충돌 방지 (가정)

## 파일 계획
- .agents/orchestration/team.md
- .agents/specs/0159-team-roles/**

## 계획 밖 변경 이유

## 완료 기준
- [x] bash .agents/checks.sh PASS
- [x] 양식의 빈칸이 모두 채워짐

## 허점
- 앞서 운영자 에이전트에게 팀 구성을 맡겼을 때 사용자 확인 없이 설정 파일 · 브랜치를 만들어 되돌렸다. 팀 구성은 역할 문서부터 사람과 정한 뒤 진행한다.

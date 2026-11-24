# 계획

## 무엇을 · 왜
- 팀 규칙의 "머지는 사람이 머지해 한 뒤에만" 을 "gate 통과하면 lead 가 바로 --rebase 머지"로 바꾼다. 이 줄 때문에 lead 가 PR 마다 멈췄다(11-24 #396 · #399 · #400 · #401).
- main 반영 규칙(fast-forward · 보내기 전 목록 확인 · 어드민은 바로)을 같은 곳에 적는다.
- rig 템플릿의 lead 시작 문구도 같게 고친다(로컬 rig.yaml 은 저장소 밖에서 같이 고침).

## 파일 계획
- .agents/orchestration/team.md
- rigs/hav/rig.template.yaml
- .agents/specs/0343-lead-merge-on-pass/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] team.md · 템플릿에 "머지해" 대기 규칙 없음

## 허점
- 사용자 결정(gate 통과 즉시 머지)이 메모리 · 인계서에만 있고 팀 규칙 문서에는 옛 규칙이 남아 있었다. 사용자 결정은 팀 규칙 문서에 바로 옮긴다.

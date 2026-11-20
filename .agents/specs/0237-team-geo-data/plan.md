# 계획 — 작업 0237 · 팀 구성: geo 알리기 · 데이터 지킴이 자리 (Quick Loop)

## 무엇을 · 왜
- 사용자 결정: geo 역할에 "알리기"(바깥 링크 후보 · 이름 알리기 소개 글 · 매일 알림 글 · 광고 소재 초안)를 더하고, 수집 상태를 지키는 자리 data(dev-data@hav)를 새로 둔다.
- 바꾸는 것은 팀 문서와 팀 템플릿 두 파일뿐이다. 내용은 request.md 작업서 1 ~ 3 절 그대로 옮긴다(요약 · 추가 해석 없이).

## 누가
- builder: 두 파일 수정 (0224 와 같은 방식 · 문서라 테스트 먼저 없음). team.md · rig.template.yaml 은 어느 자리의 범위에도 없어 이번 작업에 한해 builder 에게 맡긴다.
- test: 게이트(Quick) 판정 — 템플릿 YAML 이 읽히는지(파싱)도 확인
- lead: PR

## 바뀌는 것
1. `.agents/orchestration/team.md`
   - geo 절: 하는 일에 "알리기" 네 줄 · 지킬 것(바깥에 올리지 않음 · 숫자는 그날 공개 값만 + 받은 날짜 · 예측 · 투자 권유 금지 · 제공처 설명 금지 · 계정 · 예산 · 내부 절차는 저장소에 적지 않음) · 고칠 수 있는 곳에 `docs/marketing/**`
   - data 절 새로 (작업서 2절: 왜 · 하는 일 · 지킬 것 · 고칠 수 있는 곳 `docs/data-health.md`)
   - 공통 절에 한 줄: PR · 이슈 본문 · 댓글에는 팀 내부 절차 문장을 쓰지 않는다(게이트 결과 한 줄만)
   - lead 절 "고칠 수 있는 곳"은 그대로
2. `rigs/hav/rig.template.yaml`
   - geo 시작 안내문에 알리기 · 지킬 것 · docs/marketing/** 추가
   - data 자리 추가: agent_ref research/analyst · runtime claude-code · model sonnet · profile · permission_policy · cwd 는 다른 자리와 같게 · 시작 안내문(작업서 2절 요약 · 고칠 수 있는 곳 docs/data-health.md · lead 배정을 기다림)
   - edges: lead → data `delegates_to`
   - lead 시작 안내문에 data(수집 상태 점검) 한 줄 · summary 한 줄
- `rigs/hav/rig.yaml`(이 PC 전용 · gitignore)은 바꾸지 않는다. 자리 띄우기는 머지 뒤 claude-desktop.

## 애매한 곳
- Meta 광고: 08:42Z 작업서 덧붙임으로 사용자 답 받음(확인됨) → geo 절 · geo 시작 안내문에 덧붙임 4줄 반영(매일 초안 묶음 docs/marketing/YYYY-MM-DD/ · 이미지 4:5 1080×1350 · 사이트 토큰 · 사진 없음 · 유료 후보는 사용자가 고름 · 계정 전에도 초안은 매일)
- data 세션 이름 dev-data@hav (확인됨: 작업서)

## 파일 계획
- .agents/orchestration/team.md
- rigs/hav/rig.template.yaml
- .agents/specs/0237-team-geo-data/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
-

## 완료 기준
- [ ] bash .agents/checks.sh PASS (verdict.md 규칙)
- [ ] PR 최신 커밋 CI gate = COMPLETED + SUCCESS
- [ ] 작업서 1 ~ 3 절이 두 파일에 빠짐없이 들어감 (lead 가 대조)

## 허점
- team.md · 팀 템플릿을 고칠 자리가 정해져 있지 않음 — 이번엔 builder 에게 맡김. 계속 생기면 lead 범위에 넣을지 사용자에게 묻기

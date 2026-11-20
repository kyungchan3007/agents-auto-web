# 계획

## 무엇을 · 왜
- 2026-11-20 AI 답변 세션 측정 결과(claude-desktop 이 측정)를 남긴다. 질문 3판 24개 · WebSearch standard · 질문 원문 그대로 검색.
- 결과 파일을 내용 바꾸지 않고 `apps/api/data/geo-answers/2026-11-20.json` 으로 옮긴다 (0225 와 같은 방식).

## 애매한 곳
- 형식: 2026-11-19.json 과 같음 (확인됨: lead 가 키 구조 비교 · results 24개 · found 0 · cited 0)
- 측정은 이 팀이 하지 않았다. 파일은 받은 그대로 옮기고 값은 고치지 않는다.

## 파일 계획
- apps/api/data/geo-answers/2026-11-20.json
- .agents/specs/0236-geo-answers-1120/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
-

## 완료 기준
- [ ] bash .agents/checks.sh PASS (verdict.md 규칙)
- [ ] PR 최신 커밋 CI gate = COMPLETED + SUCCESS
- [ ] 머지 뒤 #157 바로잡는 댓글 (geo) · #283 한 줄 (lead)

## 허점
- 0236 전에 #157 댓글(08:15Z)이 "오늘 분은 측정하지 않았습니다"로 먼저 달림 — 측정이 다른 자리에서 진행 중인 것을 geo 가 몰랐음

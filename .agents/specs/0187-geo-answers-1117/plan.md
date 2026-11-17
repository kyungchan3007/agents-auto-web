# 계획

## 무엇을 · 왜
- 2026-11-17 AI 답변 세션 측정 결과를 남긴다. PR #200 에서 바꾼 질문 2판(main 의 `apps/api/src/features/geo/questions.ts`, 24개)을 처음 측정하는 날이다.
- 질문마다 세션 웹 검색(WebSearch standard)을 한 번씩 하고, found(검색 결과에 tripfx.pages.dev 주소) · cited(답의 출처로 씀)를 기록한다.
- 어제(0185 · 0181 · 0182) 머지된 작업의 TASKS.md 상태를 고친다.

## 애매한 곳
- 판 번호 필드: questions.ts 나 결과 형식에 판 번호가 생겼으면 그 형식을 따르고, 없으면 2026-11-16.json 과 같은 형식으로 쓴다 (가정).
- 검색이 실패한 질문은 실패로 기록하고 값을 지어내지 않는다 (확인됨: 오늘 할일 지시).

## 파일 계획
- apps/api/data/geo-answers/2026-11-17.json
- .agents/specs/0187-geo-answers-1117/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 질문 24개 모두 기록 (실패한 질문은 실패로)
- [ ] PR 본문 · #157 댓글에 1판과 비교한 소견 · 새 질문에서 tripfx 가 처음 나왔는지

## 허점
-

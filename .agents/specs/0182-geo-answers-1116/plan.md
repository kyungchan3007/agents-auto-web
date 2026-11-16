# 계획

## 무엇을 · 왜
- 2026-11-16 AI 답변 세션 측정 (사용자: "오늘 GEO 실행한 내역이 없네"). 11-14 작업 0162 와 같은 방식.
- 질문 24개(`apps/api/src/features/geo/questions.ts`)를 세션 웹 검색으로 하나씩 직접 검색 → found(검색 결과에 tripfx.pages.dev) · cited(답의 출처로 씀) 를 기록. 지어내지 않음 · 검색이 실패한 질문은 실패로.
- 결과는 `apps/api/data/geo-answers/2026-11-16.json` (2026-11-14.json 과 같은 형식). 머지되면 워크플로가 D1 에 저장 → /geo 반영.
- 11-15(일)는 측정하지 않았음 — 지난 날짜를 채우지 않음.
- 담당: geo.

## 애매한 곳
- 없음.

## 파일 계획
- apps/api/data/geo-answers/2026-11-16.json
- .agents/specs/0182-geo-answers-1116/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] 질문 24개 모두 기록 (성공 · 실패)
- [ ] LOOP=quick bash .agents/checks.sh PASS
- [ ] #157 댓글 · 일일 기록 #197 에 결과 한 줄

## 허점

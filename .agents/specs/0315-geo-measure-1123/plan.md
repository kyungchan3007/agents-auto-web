# 계획

## 무엇을 · 왜
- geo 가 측정한 11-23 AI 답변 결과(24개 · found 0 · cited 0)를 apps/api/data/geo-answers/2026-11-23.json 으로 남긴다
- #157 11-23 조사 댓글은 이슈에 직접 남김(저장소 변경 없음)
- #370 다섯째 항목(흔들리는 e2e 후보) 결과도 작업표에 반영: 두 테스트 모두 흔들리지 않아 후보 줄을 닫고, 같은 기간 흔들린 테스트를 새 후보 줄로 적는다
- 작업 종류 ①(자료만) — 새 테스트 없음 · 운영 화면 변화 없음 · 변경 기록 없음

## 애매한 곳
- 없음

## 파일 계획
- apps/api/data/geo-answers/2026-11-23.json
- .agents/specs/0315-geo-measure-1123/**
- .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)

## 허점
- geo 가 커밋 메시지에 작업 번호를 스스로 붙여(0314) data 작업과 겹쳤다. lead 가 cherry-pick 하며 0315 로 고침 — 번호는 lead 가 정해 넘긴다.

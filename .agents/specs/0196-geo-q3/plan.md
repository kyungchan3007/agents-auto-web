# 계획

## 무엇을 · 왜
- AI 답변 측정 질문 3판: 브랜드 질문 속 "Tripfx" → "플랩 · flapfx", "tripfx.pages.dev" → "flapfx.com" (#215). 일반 질문은 그대로 두어 이름 · 주소 말고는 비교가 이어지게 한다.
- 측정 목적(사용자): 비슷한 사이트가 많아도 GEO 작업을 하면 노출이 늘어나는지 — Tripfx 시기(1~2판 · 색인 안 됨)와 flapfx 시기(3판)를 나눠 볼 수 있어야 한다.
- /geo 에 판이 바뀐 날을 표시해 앞뒤를 나눠 볼 수 있게 한다 (지금 판 표시 방식이 있으면 따름).

## 애매한 곳
- 적용일: 다음 측정일 2026-11-18 부터 (가정 · 작업서 "다음 측정일부터").
- 브랜드 질문 id 는 1 · 2판과 같은 id 를 쓸지 새 id 를 쓸지 — 지난 결과와 섞이지 않게 기존 판 방식(0183 · #200)을 따른다 (가정).
- 지난 측정 결과 파일(apps/api/data/geo-answers/*)은 고치지 않는다 (확인됨: 작업서).

## 파일 계획
- apps/api/src/features/geo/** (questions.ts · 테스트)
- apps/web/src/features/geo/** (판 바뀐 날 표시)
- docs/geo-measurement.md
- apps/web/e2e/** (필요할 때)
- .agents/specs/0196-geo-q3/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [ ] 브랜드 질문만 바뀌고 일반 질문은 그대로 (단위 테스트)
- [ ] docs 에 3판 이유 · 비교 구간
- [ ] /geo 에 판 바뀐 날 표시 · 지난 결과 파일 변경 없음
- [ ] 브랜치 미리보기에서 /geo 확인

## 허점
-

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
- 위 파일 계획의 apps/api/src/features/geo/** · apps/web/src/features/geo/** 안의 파일(questions.ts · ask.test.ts · geo-view.ts · geo-view.test.ts · geo-detail.test.ts · geo-detail.tsx)은 계획 안이고, 게이트 경고는 경로를 정확한 파일 이름으로만 비교해서 뜬 것이다.
- .agents/orchestration/TASKS.md: 작업 보드 상태 갱신(lead 가 만든 줄 그대로 · 이 작업에서 고치지 않음).
- geo-view.test.ts: 날짜별 기록 줄에 "질문 판" 칸이 늘어 기존 기대값을 맞춤.

## 완료 기준
- [x] bash .agents/checks.sh PASS (LOOP=quick)
- [x] 브랜드 질문만 바뀌고 일반 질문은 그대로 (단위 테스트)
- [x] docs 에 3판 이유 · 비교 구간
- [x] /geo 에 판 바뀐 날 표시 · 지난 결과 파일 변경 없음
- [ ] 브랜치 미리보기에서 /geo 확인 (빌드 · e2e 는 D1 읽기 한도 때문에 돌리지 않음 · lead 확인)

## 허점
- 브랜드 질문은 번호가 새로라 3판 앞뒤 브랜드 결과를 바로 비교할 수 없다(일반 질문으로만 이어짐).
- 판 날짜(1판 11-05 · 2판 11-17 · 3판 11-18)는 web 의 geo-view.ts 와 api 의 questions.ts 머리말에 각각 적혀 있어 다음 판에서 두 곳을 같이 고쳐야 한다.
- 3판 첫 측정(2026-11-18) 결과 파일은 b14 ~ b21 번호를 써야 한다(옛 번호는 읽히기만 함).

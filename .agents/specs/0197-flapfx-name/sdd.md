# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 이름은 `apps/web/src/shared/site.ts` 의 `SITE_NAME` 한 곳에서 가져다 쓰게 하고, 글 안에 박힌 "플랩"은 SITE_NAME 또는 "Flapfx" 로.
- 측정 질문은 `apps/api/src/features/geo/questions.ts` 의 b14~b21 문구만 바꾸고 ask.test · geo-detail.test · geo-view.ts · docs/geo-measurement.md 를 맞춤.
- 검사 테스트 `apps/web/src/shared/site-name.test.ts`: git 추적 파일 중 apps · packages · docs · README 에서 "플랩" 을 찾아, "스플릿 플랩" 과 지난 기록 경로(`.agents/specs` · `apps/api/data` 등)를 뺀 나머지가 0 인지.

## 대안 · 트레이드오프
- 한 줄씩 sed 치환: "스플릿 플랩" · 조사가 깨짐 → 파일마다 보고 바꿈.

## 파일 계획
- apps/web/src/** · apps/web/e2e/** · apps/web/public/** (manifest 등)
- apps/api/src/features/geo/**
- packages/ui/src/** (사이트 이름으로 쓰인 곳만)
- docs/** · README.md
- .agents/specs/0197-flapfx-name/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 위험
- 인트로 말풍선 문구를 보는 e2e 가 깨짐 → 같은 PR 에서 맞춤.
- 11-18 측정 전에 머지 · API 배포가 안 되면 내일 측정이 "플랩" 질문으로 돔 → PR 에 적어 머지 시점을 알림.

## 검증 계획
- 단위 + 검사 테스트 · Full 게이트 한 번 · 미리보기 실제 브라우저(탭 제목 · 홈 제목 · 인트로 말풍선 · 404)

## 계획과 달라진 점

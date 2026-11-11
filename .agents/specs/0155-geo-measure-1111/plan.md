# 계획

## 무엇을 · 왜
- 2026-11-11 AI 답변 인용 세션 측정 결과 파일을 추가한다 (24개 · 인용 0 · 검색 결과 0).
- 측정 페이지 아래의 손으로 쓴 "AI 검색 인용 측정" 표(2026-11-05 한 줄)가 갱신되지 않아 최신이 아닌 것처럼 보였다. 같은 방법의 기준선이므로 결과 파일(2026-11-05.json)로 옮겨 D1 의 기록에 합치고, 표 · MEASUREMENTS 를 지운다.
- "각 서비스의 웹 검색 API 기준" 문구를 세션 측정 기준으로 고친다.
- 저장소의 결과 파일이 모두 올바른 모양인지 테스트로 확인한다 (틀리면 저장되지 않음).

## 애매한 곳
- 봇 방문 · 검색 노출이 11-08 까지인 것은 실제 자료 (구글 크롤링 통계 11-04 이후 거의 0 · Search Console 은 2~3일 늦게 반영) — 고치지 않음

## 파일 계획
- apps/api/data/geo-answers/**
- apps/api/src/features/geo/ask.test.ts
- apps/web/src/features/geo/components/geo-page.tsx
- apps/web/src/features/geo/components/geo-report.tsx
- apps/web/src/features/geo/lib/geo-view.ts
- apps/web/src/features/geo/lib/geo-view.test.ts
- docs/geo-measurement.md
- .agents/specs/0155-geo-measure-1111/**

## 계획 밖 변경 이유

## 완료 기준
- [x] bash .agents/checks.sh PASS
- [x] 결과 파일 3개가 SQL 로 바뀜 (확인: 각 24개)
- [ ] 머지 뒤 측정 페이지에 11-05 · 11-11 기록이 보임

## 허점
- 작업 0149 에서 측정 방식을 바꾸면서 페이지의 손으로 쓴 표와 "API 기준" 문구를 함께 정리하지 않았다.

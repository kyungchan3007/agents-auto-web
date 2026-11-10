# 계획

## 무엇을 · 왜
- AI 답변 인용 측정을 API(크레딧 소진) 대신 Claude Code 세션에서 한다. 사용자가 말하면 세션이 질문 24개를 직접 웹 검색해 결과를 `apps/api/data/geo-answers/날짜.json` 으로 PR 에 올리고, 머지되면 `geo-ask.yml` 이 D1 에 저장해 측정 페이지에 나온다.
- 매일 05:00 API 예약은 끈다 (크레딧이 없어 매일 실패 24개만 쌓임). 손으로 실행하면 예전처럼 API 측정.
- 오늘(2026-11-10) 측정을 세션에서 한 번 해서 첫 결과 파일을 같이 올린다.

## 애매한 곳
- 세션 측정은 서비스 이름을 claude 로 저장 (확인됨: 사용자 "세션 안에서 처리") — 스키마의 서비스 목록은 보호 파일이라 새 이름을 만들지 않음 (가정)
- cited 판정: 세션이 답의 출처로 tripfx 주소를 썼을 때만 (가정)

## 파일 계획
- apps/api/scripts/geo-ask.ts
- apps/api/src/features/geo/ask.ts
- apps/api/src/features/geo/ask.test.ts
- apps/api/data/geo-answers/**
- .github/workflows/geo-ask.yml
- apps/web/src/features/geo/components/geo-report.tsx
- docs/geo-measurement.md
- README.md
- .agents/specs/0149-geo-session/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS
- [x] 결과 파일 읽기 테스트 (모르는 질문 · 이상한 값 버림)
- [x] 결과 파일로 SQL 이 만들어짐 (확인: 24줄)
- [ ] 머지 뒤 워크플로가 D1 에 저장 · 측정 페이지에 2026-11-10 결과가 실패 대신 24개 측정으로 보임

## 허점
- `.github/workflows/geo-ask.yml` 은 보호 파일 — 사람 승인(harness-approved 라벨) 필요

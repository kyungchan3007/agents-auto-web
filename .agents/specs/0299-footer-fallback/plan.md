# 계획 — 작업 0299 · 바닥 띠에 예비 환율 출처 적기 (Quick · 평소 PR · 시안 68 · 사용자 결정)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
- 환율을 쓰는 다섯 페이지(홈 · 통화 상세 · 직구 계산 · 여행 물가 · 여행 타이밍) 바닥 띠의 "한국수출입은행"을 "한국수출입은행 · Frankfurter(수출입은행 값을 받지 못한 날)"로. 다섯 곳 같은 문구 · 공용 상수 한 곳에서.
- 그대로: 홈 안내판의 예비 출처 줄(그 날에만) · 소개의 환율 설명 · 바닥 띠의 다른 출처 이름.

## 애매한 곳
- 파일 위치는 claude-desktop 이 찾은 것 → builder 대조 · 환율을 쓰는데 빠진 페이지가 있으면 같은 문구로 더하고 목록을 PR 에. (작업서)
- 작업 종류: ③(출처 문구 규칙) → 다섯 페이지 바닥 띠 새 문구 · 넘침 없음 기능 테스트(#348). (작업서)
- 문구 · 공용 상수(shared) 변경이라 평소 PR. (verdict.md)

## 누가
- builder — 대조 → 구현 · 푸시 전 타입 검사 · 바꾼 파일 lint · 푸시 · 보고
- test — ③ 기능 테스트 · 고친 spec(0286 footer-same 등 옛 문구 고정) · 단위(builder 커밋 받으면 먼저) · 로컬은 새로 쓰거나 고친 spec 만
- lead — PR · gate · 머지

## 파일 계획
- packages/shared/src/domain/** (출처 상수)
- apps/web/src/features/{home,currencies,import-calc,travel-price}/**
- apps/web/e2e/** · **/*.test.ts(x) · .agents/e2e-map.json (test)
- .agents/specs/0299-footer-fallback/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 다섯 페이지(+ 빠진 페이지) 바닥 띠에 같은 문구 · 넘침 없음

## 허점
-

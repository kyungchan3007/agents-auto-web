# 계획 — 작업 0292 · 통화 상세 링크 모양 (Quick · 디자인 PR · 시안 61)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
- 통화 상세 "이 통화 쓰는 나라 물가 보기 ›"(굵기 400 · 밑줄 없음)를 홈 "다른 통화 18개 모두 보기 ›"와 같은 모양(굵게 · 파랑 · 밑줄 2px) · 같은 부품 · 클래스로.
- 이 링크가 없는 통화(예: 바레인 디나르)에서도 아래 구간 간격이 다른 통화와 같게.
- 다른 페이지의 따로 선 링크가 어긋나 있으면 같은 PR 에서 맞추고 목록을 적음.

## 애매한 곳
- 모양만 바뀌어 디자인 PR(design 라벨). 간격 그대로는 기능 조건이라 테스트로. (verdict.md)
- 번호: develop 에 사용자 작업 0294(e2e 범위 훅)가 먼저 들어가 spec:new 가 0295 를 냈으나, 브랜치 · 지시를 0292 로 이미 보내 0292 로 둠(0293 은 비어 있음).

## 누가
- builder — 구현 · 푸시 전 타입 검사 · 바꾼 파일 lint · 푸시 · 보고
- test — 로컬은 단위 · typecheck · lint + e2e-select 목록(team.md 49 ~ 51) · 링크 없는 통화 간격 확인 · @design 개수
- lead — PR(design 라벨) · gate · 머지

## 파일 계획
- apps/web/src/features/currencies/**
- packages/ui/src/** (링크 부품)
- apps/web/src/features/{home,travel-price}/** · apps/web/src/app/** (어긋난 링크를 더 찾으면)
- apps/web/e2e/** · **/*.test.ts(x) · docs/design-tests-pending.md (test)
- .agents/specs/0292-link-one/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 통화 상세 링크 = 홈 링크 모양 · 링크 없는 통화 간격 같음

## 허점
-

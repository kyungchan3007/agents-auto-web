# 계획 — 작업 0286 · 바닥 띠 같은 형식 (Quick · 평소 PR · 시안 52)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
1. "소개 · 판단 기준" 링크를 여행 타이밍 · 여행 물가 · 직구 계산 바닥 띠 끝에도(홈 · 통화 · 없는 주소와 같은 모양)
2. 여행 물가 바닥 띠의 지표 코드 "(PA.NUS.PRVT.PP ÷ PA.NUS.FCRF)" 빼고 "자료: 세계은행 물가 수준 · 한국수출입은행 · 소개 · 판단 기준" · 코드는 소개 물가 항목에
3. 통화 바닥 띠 " (예비: Frankfurter)" 빼고 소개 환율 항목에 예비 출처(이미 있으면 그대로)
4. 각 페이지 출처 문장 자체 · 소개 바닥 띠는 그대로

## 애매한 곳
- 소개에 옮기는 지표 코드 · 예비 출처 문장은 실제 수집 코드 · docs/domain 과 대조해 사실만(Frankfurter 를 실제로 예비로 쓰는지 · 지표 코드가 맞는지). 어긋나면 고치기 전에 보고. (작업서)
- 문구 · 링크 변경이라 평소 PR. 메타 · 구조화 자료에 같은 문구가 있으면 함께. (작업서)

## 누가
- builder — 사실 대조 → 구현 · 푸시 전 타입 검사 · 바꾼 파일 lint · 푸시 · 보고
- test — 옛 문구 고정 테스트 맞춤 · 바닥 띠 링크 · 문구 확인 · 로컬(4399 점검 · 새 spec 이면 연결표 + 하네스)
- lead — PR · gate · 머지

## 파일 계획
- apps/web/src/features/{travel-price,import-calc,currencies,about}/**
- apps/web/src/shared/** · packages/ui/src/** (바닥 띠 부품)
- apps/web/e2e/** · **/*.test.ts(x) (test)
- .agents/specs/0286-footer-same/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- packages/shared/src/domain/currency.ts — 통화 바닥 띠의 출처 문장(SOURCE_NOTE)이 여기 있어 '(예비: Frankfurter)'를 뺌. 쓰는 곳은 통화 바닥 띠 한 곳.

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 여섯 페이지 바닥 띠 끝에 "소개 · 판단 기준" · 지표 코드 · 예비 출처는 소개로

## 허점
-

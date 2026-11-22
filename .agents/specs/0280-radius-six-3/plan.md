# 계획 — 작업 0280 · 모서리 여섯 가지 (3/3) — 통화 상세 · 직구 (Quick · 디자인 PR · 시안 47)

## 무엇을 · 왜
- 0278 · 0279 에 이어 통화 상세(converter · currency-kicker · chip-more-box 등) · 직구(calc-form · calc-result · import-price-section 등) 8파일의 모서리를 여섯 단계로. 옮긴 값은 작업서 · 12px 는 14. 그대로: 꼬리표 6 · 알약 · 국기 50%. 카드 · 입력 칸 토큰 값은 그대로(대상 쪽만).

## 애매한 곳
- 모서리 값을 고정한 테스트 · 예전 결정과 부딪침은 0278 과 같이 처리. 직구 결과 카드 크기 고정(0208 · "값이 바뀌어도 밀리지 않는다")에 영향이 없게. (작업서)

## 누가
- builder — 준비해 둔 변경 · 로컬 빌드 · 한 번에 푸시
- test — 로컬 e2e(4399 점검) · @design 개수
- lead — PR(design 라벨) · gate · 머지

## 파일 계획
- apps/web/src/features/{currencies,import-calc}/**
- apps/web/e2e/** · **/*.test.ts(x) · docs/design-tests-pending.md (test)
- .agents/specs/0280-radius-six-3/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 통화 상세 · 직구 모서리 여섯 단계 밖 0(그대로 두는 것 제외)

## 허점
-

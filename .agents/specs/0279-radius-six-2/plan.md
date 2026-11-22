# 계획 — 작업 0279 · 모서리 여섯 가지 (2/3) — 여행 타이밍 · 여행 물가 · 홈 (Quick · 디자인 PR · 시안 47)

## 무엇을 · 왜
- 0278(#331)에 이어 여행 타이밍 · 물가(airfare-calendar.css · window-months · flights-page · price-route · budget-planner) · 인트로 flight-hint · 홈 3(ticket · destinations-pill 등)의 모서리를 여섯 단계로. 옮긴 값은 작업서 · 12px 는 14 로(0278 과 같음). 그대로: 꼬리표 6 · 알약 · 창문 88~118 · 국기 50%.
- 소개 페이지에 남은 8px 모서리 8곳은 출처를 찾아 대상이면 함께(builder 확인 · 파일 계획 밖이면 이유 적음).

## 애매한 곳
- 카드 · 입력 칸 토큰 값은 그대로(0278 판단). (lead)
- 모서리 값을 고정한 테스트 · 예전 결정과 부딪침은 0278 과 같이 처리. (작업서)

## 누가
- builder — 준비해 둔 변경 · 로컬 빌드 · 한 번에 푸시
- test — 로컬 e2e(4399 점검) · @design 개수
- lead — PR(design 라벨) · gate · 머지

## 파일 계획
- apps/web/src/features/{travel-price,intro,home,about}/**
- apps/web/e2e/** · **/*.test.ts(x) · docs/design-tests-pending.md (test)
- .agents/specs/0279-radius-six-2/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 여행 타이밍 · 여행 물가 · 홈 · 소개 모서리 여섯 단계 밖 0(그대로 두는 것 제외)

## 허점
-

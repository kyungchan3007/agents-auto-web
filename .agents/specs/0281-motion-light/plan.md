# 계획 — 작업 0281 · 움직임 방식만 가볍게 (Quick · 평소 PR · 시안 48 · 보이는 변화 없음)

요구 · 기준 원본: [handoff.md](handoff.md)

## 무엇을 · 왜
1. 너비 · 위치를 직접 움직이는 세 곳을 같은 모습의 transform 으로: 요일 막대(airfare-calendar.css `.af-row .fill` width) · 탑승권 비행기(`.af-pass .fly svg` left) · 통화 범위 카드(range-card.tsx transition-[left]).
2. 스크롤 등장 · 올라가는 숫자가 스크립트가 늦거나 실패하면 숨은 채 남는 곳을, 스크립트 없이도 최종 값이 보이게. 평소 보이는 움직임은 그대로.

## 애매한 곳
- 튀는 움직임 · 올라가는 숫자의 곡선 · 시간 · 모양은 그대로. 움직임 줄이기 설정의 지금 동작 유지. (사용자 · 작업서)
- 같은 모습을 낼 수 없는 곳은 바꾸지 말고 보고. (작업서)
- 2번은 공용 움직임 부품(fade-up · count-up 등)이나 hooks 를 바꿀 수 있어 평소 PR(design 라벨 없음). (verdict.md)
- "스크립트 없이도 최종 값이 보인다"는 기능 조건 → 기능 테스트로 지킴(예: JavaScript 끔 · 또는 정적 HTML 에 최종 값과 보이는 상태). (가정)

## 누가
- builder — 위치 대조 → 구현 · 로컬 빌드로 움직임 전후 같은지 확인(같은 시각 화면 비교) · 한 번에 푸시
- test — 기능 e2e(스크립트 없이 최종 값 보임 · 움직임 줄이기 동작 유지) · 깨진 테스트 · 로컬(4399 점검 · 새 spec 이면 연결표 + 하네스 테스트)
- lead — PR · gate · 머지

## 파일 계획
- apps/web/src/features/travel-price/components/airfare-calendar.css
- apps/web/src/features/currencies/components/range-card.tsx
- packages/ui/src/** (움직임 부품 · count-up · fade-up · hooks)
- apps/web/src/features/{home,currencies,travel-price,import-calc,about}/** (등장 · 숫자를 쓰는 곳이 바뀌어야 하면)
- apps/web/src/app/globals.css
- apps/web/e2e/** · **/*.test.ts(x) · .agents/e2e-map.json (test)
- .agents/specs/0281-motion-light/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (CI `결과: ✅ ALL PASS`)
- [ ] 세 곳이 width · left 대신 transform · 보이는 움직임 같음
- [ ] 스크립트 없이도 등장 내용 · 숫자의 최종 값이 보임

## 허점
-

# 계획

## 무엇을 · 왜
- 모션 시안 1번(창밖으로 넘어가는 12달)을 여행 타이밍(/flights) hero **바로 아래 새 구역**으로 더한다. hero 글자판 등 지금 화면은 그대로.
- 기준: 스크린샷 `.tmp/lead-motion-1119/02-flights-1.png` · 참고 구현 `.tmp/motion-pages/m-flights.js` · `m-flights.css`(만드는 스크립트 `make-flights.py`) · 원본 `.tmp/motion-1119/window2/index.html`. DOM 덮어쓰기 대신 React 부품 · 훅, 그림 · 움직임 · 시간 · 문구는 시안과 같게. 날개 그림 없음.
- 지수: 시안의 대략 값이 아니라 홈 12달 막대와 같은 계산(같은 달 평균 · `monthlyAverages`)의 실제 값 · 소수 한 자리 · 문구 "국제항공료 지수 · 같은 달 평균". 페이지가 이미 받는 `kosis-cpi:air-fare` 자료로 계산 — 빌드 때 추가 API 호출 없음.
- 창 덮개: 처음부터 닫힌 채 시작 → 화면에 보이면 바로 올라감(닫히는 모습이 보이면 안 됨). "다시 보기"를 누를 때만 닫혔다 열림.

## 애매한 곳
- 자료가 없으면(air-fare 실패) 구역 전체를 숨기지 않고 기존 "준비 중"과 같은 빈 상태 (가정 · 숫자 지어내지 않음)
- 처음 보이는 달 = 오늘 달 (가정 · 시안 동작)
- 움직임 줄이기면 덮개 열린 최종 상태 · 계절 그림 정지 (확인됨: 브리프)

## 파일 계획
- apps/web/src/features/travel-price/components/flights-page.tsx (구역 끼워 넣기)
- apps/web/src/features/travel-price/components/window-months*.tsx (새) · 그림 부품(새)
- apps/web/src/features/travel-price/lib/window-months.ts (새 · 계절 · 지수 계산) · hooks(새)
- 기존 계산 재사용: apps/web/src/features/home/lib/travel-timing.ts (monthlyAverages) — 옮기지 않고 가져다 씀
- 테스트(test): apps/web/src/features/travel-price/lib/*.test.ts · apps/web/src/shared/flights-window.test.ts · apps/web/e2e/flights-window.spec.ts
- .agents/specs/0229-flights-window/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (test)
- [ ] hero 아래 새 구역 · hero 그대로 · 지수 = 홈 12달 막대와 같은 값
- [ ] 다른 페이지에서 넘어와도 덮개가 닫힌 채 시작해 바로 올라감 · "다시 보기"만 닫혔다 열림
- [ ] 움직임 줄이기 최종 상태 · 1280 / 390 가로 넘침 · 콘솔 오류 없음
- [ ] 미리보기 /flights 에서 test 가 스크린샷 02 와 같은 구도로 확인

## 허점
-

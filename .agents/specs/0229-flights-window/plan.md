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
- apps/web/src/features/travel-price/lib/window-scene.ts (새) — 시안의 창밖 풍경 그리기 · 흐름(캔버스)을 옮긴 장면 파일 · 파일 계획의 "그림 부품(새)" 에 해당 · 시안 색을 그대로 써서 흰색만 WHITE(#FEFEFE) 한 단계 낮춤(no-raw-color 검사)
- apps/web/src/features/travel-price/hooks/use-window-months.ts (새) — 상태 훅(파일 계획의 hooks(새))
- apps/web/src/app/globals.css — 서버 그림부터 닫힌 덮개 CSS(@media (scripting: enabled) and (prefers-reduced-motion: no-preference)) · 0228 알약과 같은 방식 · 보호 파일 아님
- 홈 travelTiming 은 가져다 쓰지 않음: features 끼리 직접 import 금지라 둘이 같이 쓰는 @hav/shared/travel 의 monthlyAverages 를 쓰고 싼 달 · 비싼 달 규칙(`<` · `>=`)만 같게 둠 — 홈 쪽 동작은 그대로
- 덮개 열린 위치는 시안의 -88% 대신 -96%: 열린 뒤 덮은 비율이 0.05 이하여야 하는 e2e 계약 때문(위쪽 손잡이만 살짝 보임)

## 완료 기준
- [ ] bash .agents/checks.sh PASS (test)
- [ ] hero 아래 새 구역 · hero 그대로 · 지수 = 홈 12달 막대와 같은 값
- [ ] 다른 페이지에서 넘어와도 덮개가 닫힌 채 시작해 바로 올라감 · "다시 보기"만 닫혔다 열림
- [ ] 움직임 줄이기 최종 상태 · 1280 / 390 가로 넘침 · 콘솔 오류 없음
- [ ] 미리보기 /flights 에서 test 가 스크린샷 02 와 같은 구도로 확인

## 허점
- 서버가 그린 처음 화면의 data-state 는 closed 라, 움직임 줄이기를 쓰는 사람은 문서 안 작은 스크립트가 바로 open 으로 맞춤(없으면 하이드레이션 전 몇 프레임 closed) — 스크립트 꺼짐은 CSS 가 열린 모양으로 보임
- 처음 보이는 달은 가장 싼 달(서버 그림 · 움직임 줄이기와 같게) — 계획의 '오늘 달'과 다름(빌드 시점 오늘과 보는 날이 달라 서버 그림과 어긋남)
- 장면 그리기는 시안 코드를 옮긴 것 — 휴대폰 · 사파리 성능은 직접 못 봄(캔버스 해상도 최대 2배 · 입자 수는 휴대폰에서 줄임)
- 글자판 칸 색은 flap-cell 토큰(시안 #1B2A7E 와 약간 다름)

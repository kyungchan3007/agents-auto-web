# 계획

## 무엇을 · 왜
- 모션 시안 4번(숫자 굴러가기)을 직구 계산에 더한다. 값을 바꾸면 큰 금액 · 막대 아래 $ 금액 · 내역 금액이 자리마다 굴러 맞춰진다.
- 굴러가기는 `packages/ui` 공용 부품(`RollingNumber`)으로 만든다. 0231 통화 "실제로 바꿀 때" 글자판에서 다시 쓴다.
- 기준: 스크린샷 `.tmp/lead-motion-1119/07-calc-4.png` · 참고 구현 `.tmp/motion-pages/m-calc.js` · `m-calc.css` · 원본 시안 `.tmp/motion-1119/roll/index.html`. 움직임 · 시간 · 순서는 시안과 같게, DOM 덮어쓰기 대신 React 부품 · 훅.
- 지금 화면에서 빼는 것 없음(더하기만). 6번 도장은 넣지 않는다.

## 애매한 곳
- 첫 화면에 처음 나오는 값도 굴러야 하는가 → 시안처럼 처음 값은 그대로 보이고, 바뀔 때만 굴러감 (가정 · 시안 동작 그대로)
- prefers-reduced-motion 이면 굴리지 않고 최종 값을 바로 보인다 (확인됨: 브리프)
- 화면 읽기 프로그램에는 최종 값 한 번만 읽힘 (가정 · 시안의 sr 글 그대로)

## 파일 계획
- packages/ui/src/components/motion/rolling-number.tsx (새 부품)
- packages/ui/src/components/motion/*.test.ts · packages/ui/src/index.ts(내보내기)
- packages/ui/src/tokens.css 또는 부품 css (굴러가기 스타일)
- apps/web/src/features/import-calc/components/calc-result.tsx · calc-page.tsx
- apps/web/src/shared/calc-roll.test.ts (test)
- apps/web/e2e/calc-roll.spec.ts (test)
- .agents/specs/0227-calc-roll/** · .agents/orchestration/TASKS.md 는 보호 파일이라 건드리지 않음

## 계획 밖 변경 이유
- packages/ui/src/lib/rolling-number.ts (새 파일) — test 의 단위 계약(rolling-number.test.ts)이 계산 함수를 이 위치에 두도록 정함. 부품과 같은 값을 두 번 계산하지 않기 위한 순수 함수 분리
- 부품 css 는 따로 만들지 않고 Tailwind 클래스로 부품 안에 둠 (파일 계획의 tokens.css 변경 없음 · index.ts 내보내기도 `./*` 경로로 충분해 변경 없음)

## 완료 기준
- [ ] bash .agents/checks.sh PASS (test 가 돌림)
- [ ] 값을 바꾸면 세 곳(큰 금액 · 막대 아래 $ · 내역 금액)이 자리마다 굴러 최종 값과 정확히 같게 멈춤
- [ ] 움직이는 중 새 값이 오면 끊김 없이 이어 감 · 쉼표 · '원'은 굴러가지 않음
- [ ] reduced-motion 이면 바로 최종 값 · 가로 넘침 없음 1280 / 390
- [ ] 미리보기 주소 /calc/ 에서 test 가 스크린샷 07 과 같은 구도로 확인

## 허점
- 자리 수가 줄어들 때 사라지는 칸은 폭이 부드럽게 줄지 않고 바로 없어짐 (시안은 폭 전환 0.42초)
- 글자판형(board · 통화 0231)은 아직 받지 않음 — 칸 구성은 rollCells 와 Digit 으로 나뉘어 있어 앞 빈 칸 · 맨 끝 칸 옵션을 더하면 됨

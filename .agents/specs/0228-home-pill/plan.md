# 계획

## 무엇을 · 왜
- 모션 시안 13번(요약 알약 펼치기)을 홈 "도착지별 환전 타이밍" 카드에 더한다. 끝난 상태는 지금 운영 화면과 똑같다.
- 기준: 스크린샷 `.tmp/lead-motion-1119/01-home-13.png` · 참고 구현 `.tmp/motion-pages/m-home.src.js` · `m-home.css` · 원본 시안 `.tmp/motion-1119/today2/index.html`(13번). DOM 덮어쓰기 대신 React 부품 · 훅.
- 동작: 카드가 화면 아래에 있으면 알약(국기들 + "도착지 N곳 중 M곳이 최근 90일 중 싼 편")으로 접어 둠 → 카드 윗부분이 들어오자마자 펼침(높이 약 0.46초 · 모서리 알약 반지름 → 24px · 줄 0.07초 간격 · 점은 가운데 선 → 오늘 자리 0.62초 · 금액은 90일 중간값 → 오늘 값 카운트업 같은 시간 · 신호 글 마지막 · 전체 약 1초).
- M 은 사이트 신호 규칙(하위 30% 이하)으로 센다. 숫자를 지어내지 않는다.
- 빼는 것 없음. "이 구역 움직임 다시 보기" 버튼은 이 모션도 다시 보이게 한다(가정 · 시안과 같게).

## 애매한 곳
- 첫 화면에서 이미 카드가 보이면 → 알약 없이 바로 펼침 시작(가정 · 시안 동작)
- reduced-motion 이면 알약 없이 최종 카드(확인됨: 브리프)
- 90일 중간값이 없는 도착지는 카운트업 없이 오늘 값(가정 · 숫자 지어내지 않음)

## 파일 계획
- apps/web/src/features/home/components/destinations-section.tsx · destination-table.tsx
- apps/web/src/features/home/components/destinations-pill.tsx (새)
- apps/web/src/features/home/lib/destinations.ts (싼 편 개수) · hooks 필요하면 packages/ui/src/hooks/*
- 테스트(test): apps/web/src/features/home/lib/*.test.ts · apps/web/src/shared/home-pill.test.ts · apps/web/e2e/home-pill.spec.ts
- .agents/specs/0228-home-pill/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (test)
- [ ] 아래에서 스크롤해 오면 알약 → 약 1초 안에 펼침 · 끝 상태가 운영과 같음
- [ ] 알약 문구 M 이 신호 규칙(하위 30% 이하)과 일치
- [ ] reduced-motion 최종 상태 · 1280 / 390 가로 넘침 없음
- [ ] 미리보기 / 에서 test 가 스크린샷 01 과 같은 구도로 확인

## 허점
-

# 계획

## 무엇을 · 왜
- 모션 시안 3번(스크롤 물가 노선)을 여행 물가(/prices)의 정적 자(제목 "한국보다 싼 곳 · 비슷한 곳 · 비싼 곳" + 자 그림) **자리에** 넣는다. 시안이 그 자를 움직이게 만든 판이라 이것만 예외로 바뀐다(사용자 확인).
- 노선 바로 아래로 기존 세 칸 목록 → "나라 더 보기 (N곳)" → "자료가 없어 뺀 나라" 줄이 그대로 이어진다. 그 밖에 빼는 것 없음.
- 기준: 스크린샷 `.tmp/lead-motion-1119/06-prices-3.png` · 참고 구현 `.tmp/motion-pages/m-prices.js` · `m-prices.css` · 원본 `.tmp/motion-1119/scale/index.html`. React 부품 · 훅으로, 움직임 · 시간 · 문구는 시안과 같게.
- 값: 페이지가 이미 가진 나라별 물가 수준(한국 = 100) · 예산 계산을 그대로 씀 — 추가 API 호출 없음 · 숫자 지어내지 않음.
- 배치: 노선 화면은 세로 가운데가 아니라 메뉴 띠 바로 아래에 붙는다. 예산 카드 아래 → 노선 제목 간격은 운영 정적 자와 같게(넓은 화면 167px · 휴대폰 125px, 화면 높이와 상관없이). 정거장 사이 스크롤 길이 넓은 화면 36vh · 휴대폰 30vh.

## 애매한 곳
- 정거장(나라) 목록 · 순서 = 시안과 같은 규칙(고른 나라 + 대표 나라, 물가 낮은 순) — 시안 코드에서 확인해 그대로 (가정)
- 움직임 줄이기 · JS 꺼짐이면 스크롤 고정 없이 정적인 노선(모든 정거장 보임) (가정 · 브리프 "최종 상태")
- 통화로 거르기(?currency=) 때도 노선이 같은 나라 집합을 따름 (가정 · 기존 세 칸 목록과 같은 자료)

## 파일 계획
- apps/web/src/features/travel-price/components/price-ruler.tsx · price-page.tsx · price-view.tsx (자 자리 바꾸기)
- apps/web/src/features/travel-price/components/price-route*.tsx (새) · lib/price-route.ts (새) · hooks(새)
- apps/web/src/app/globals.css (필요하면 · 서버 그림 조건 CSS)
- 테스트(test): lib/*.test.ts · apps/web/src/shared/prices-route.test.ts · apps/web/e2e/prices-route.spec.ts · 정적 자를 기대하던 옛 테스트 보정
- .agents/specs/0230-prices-route/**

## 계획 밖 변경 이유

## 완료 기준
- [ ] bash .agents/checks.sh PASS (test)
- [ ] 정적 자 자리에 노선 · 아래 세 칸 목록 · 나라 더 보기 · 뺀 나라 줄 그대로
- [ ] 예산 카드 → 노선 제목 간격 167px / 125px (화면 높이 무관) · 정거장 간격 36vh / 30vh
- [ ] 움직임 줄이기 · JS 꺼짐 정적 노선 · 1280 / 390 가로 넘침 · 콘솔 오류 없음
- [ ] 미리보기 /prices 에서 test 가 스크린샷 06 과 같은 구도로 확인

## 허점
-

# 계획

## 무엇을 · 왜
- /prices "나라 더 보기 (N곳)" 버튼을 눌러도 펼쳐지지 않는 버그 수정.
- 원인: `price-bands.tsx` 버튼이 `onClick={() => toggle}` — 함수를 부르지 않고 돌려주기만 해서 상태가 바뀌지 않음. `onClick={toggle}` 로 고친다.

## 애매한 곳
- 없음.

## 파일 계획
- .agents/specs/0178-price-bands-more/**
- apps/web/src/features/travel-price/components/price-bands.tsx
- apps/web/src/features/travel-price/components/price-bands.test.ts

## 계획 밖 변경 이유

## 완료 기준
- [ ] 테스트 먼저: 버튼이 toggle 을 실제로 부르는지 확인 (구현 전 FAIL)
- [ ] bash .agents/checks.sh PASS
- [ ] 미리보기에서 눌러 펼쳐짐 · 접힘 확인

## 허점
- 클릭 동작을 확인하는 테스트가 없어 시안 맞춤(작업 0170) 때 들어온 잘못된 onClick 이 게이트를 통과함. 펼침 버튼 같은 상호작용은 최소한 손으로 한 번 눌러 보거나 단위 테스트로 막는다.

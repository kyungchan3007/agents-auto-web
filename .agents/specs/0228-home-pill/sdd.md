# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- API: `computeSignal` 이 창 안 값(inWindow)으로 중간값을 계산해 `median` 을 돌려준다(값 2개 이상일 때, 짝수면 가운데 두 값 평균). `signalsByCurrency` 가 목록 줄에 `median` 을 싣는다. 계약 `packages/shared/src/contracts/signal.ts` 의 목록 줄 · SignalResult 에 `median: z.number().nullable().optional()` — 예전 응답과 호환.
- 웹: 홈 신호 목록 → 도착지 줄 데이터에 `rateStart`(median 을 화면 단위로 바꾼 값, 없으면 없음). 새 부품 `destinations-pill.tsx` 가 알약 ↔ 카드 상태(pill|expanding|final)와 시간을 맡고, 줄 · 점 · 금액 카운트업은 기존 부품에 더한다. 화면에 들어옴은 기존 `use-in-view-once` 류 훅.
- DOM 계약: e2e `apps/web/e2e/home-pill.spec.ts` 맨 위 주석(test 316f507).

## 대안 · 트레이드오프
- 웹 빌드 때 통화마다 90일 기록을 따로 받아 중간값 계산 → 빌드마다 D1 읽기가 늘어 고르지 않음(D1 읽기 한도).
- 카운트업을 가운데 선 위치 값 없이 0 에서 → 시안과 다르고 의미 없는 숫자가 지나감, 고르지 않음.

## 파일 계획
- packages/shared/src/contracts/signal.ts · packages/shared/src/contracts/*.test.ts
- apps/api/src/features/signal/** (signal.ts · 테스트)
- apps/web/src/features/home/** (destinations-section · destination-table · destinations-pill(새) · lib/destinations · lib/destinations-pill · 테스트)
- packages/ui/src/hooks/** (필요하면)
- apps/web/src/shared/home-pill.test.ts · apps/web/e2e/home-pill.spec.ts
- docs/domain/** (신호 계약에 median 한 줄, 있으면)
- .agents/specs/0228-home-pill/**

## 계획 밖 변경 이유

## 위험
- 계약 변경: optional 이라 예전 API 응답에도 웹이 깨지지 않아야 함 → test 가 median 없는 응답으로도 확인.
- API 배포는 머지 뒤 → 미리보기에서는 카운트업이 없음(정상).

## 검증 계획
- test: 단위(신호 median · 알약 문구 · 개수) · 소스 검사 · e2e home-pill 20 · 게이트 full(가짜 API 에 median 추가) · 미리보기 / 1280 · 390.

## 계획과 달라진 점

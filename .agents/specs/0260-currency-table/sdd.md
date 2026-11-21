# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- **API:** `apps/api/src/features/signal` 의 `signalsByCurrency` 가 이미 통화마다 90일 창의 `range{min,max}` 를 계산한다. 전체 응답(`SignalList.signals[]`)에 `max`(1 외화당 원 · 선택 · 옛 응답 호환)를 더한다 — 0228 의 `median` 과 같은 방식. D1 쿼리는 그대로(읽는 줄 수 변화 없음).
- **계약:** `packages/shared/src/contracts/signal.ts` 의 SignalList 항목에 `max: z.number().nullable().optional()`.
- **웹:** `features/currencies/lib` 에 순수 함수 — `dropFromHigh(latest, max)` → 숫자 · "최고" · null, 표 줄 만들기 · 내린 순 정렬 · 두 단 나누기. `components/currency-list.tsx`(또는 browse-layout) 를 표로. 데이터는 지금처럼 browse-layout 이 받는 `signals` · `latest` 를 그대로 쓴다(상세 22장도 같은 응답 · 추가 요청 없음).
- **단위:** 오늘 환율은 `latest.rates` 의 고시 값(엔 100 등 단위 그대로 표기) · 내린 폭 계산은 1 외화당 원(latest.value 와 max 모두 같은 단위)이라 단위와 무관.

## 대안 · 트레이드오프
- 통화마다 `/fx/{c}/history?days=90` 22번(시안 방식) — 목록 + 상세 23 페이지 × 22 = 빌드당 약 500 요청 · 수만 줄 추가 읽기. D1 한도 위험으로 고르지 않음.
- 웹에서 상세용으로 받는 365일 기록에서 계산 — 목록 페이지에는 기록이 없어 불가.

## 파일 계획
- packages/shared/src/contracts/signal.ts
- apps/api/src/features/signal/** (signal.ts · routes.ts · 테스트)
- apps/web/src/features/currencies/** (lib · components · 테스트)
- apps/web/src/shared/api.test.ts (계약 확인이 깨지면)
- apps/web/e2e/** · .agents/e2e-map.json (test)
- docs/domain/fx.md (규칙 한 줄: 90일 최고보다)
- .agents/specs/0260-currency-table/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 위험
- API 배포 전에는 운영 `/signal` 응답에 `max` 가 없다 → 웹은 없으면 "—" 로 보여야 한다(지어내지 않음). API 배포 · 사이트 빌드 순서 확인.
- 카드에서 표로 바뀌며 기존 e2e(currency-list · 카드 셀렉터)가 깨질 수 있다 → test 가 새 구조로.

## 검증 계획
- 단위: 계약(선택 필드) · signalsByCurrency 가 max 를 실음 · dropFromHigh(최고 · 빈 값 · 소수 한 자리) · 정렬 · 두 단 나누기
- e2e: 넓은 화면 두 단 · 휴대폰 한 단 · 막대는 넓은 화면만 · 줄 링크 · 지금 보는 통화 · 이름 순서 · 낭독 이름
- CI gate(평소 PR)

## 계획과 달라진 점

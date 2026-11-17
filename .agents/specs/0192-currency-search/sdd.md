# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 도시 표 이동: `apps/web/src/features/intro/lib/places.ts` 의 `INTRO_CITIES` 를 `packages/shared/src/domain/travel.ts` 의 `TRAVEL_CITIES` 로 옮기고, 인트로는 공용 것을 가져다 쓴다 (기능 폴더끼리 서로 가져다 쓰지 않는 경계 유지).
- 검색 계산: `packages/shared/src/domain/currency-search.ts`(공용 `@hav/shared/currency-search` 또는 travel 안) 순수 함수 `searchCurrencies(query, codes, limit)`
  - 대상: 빌드 때 받은 통화 코드 목록만
  - 맞는 이유: code · name · country · city (공백 · 대소문자 무시)
  - 순위: 코드 앞글자 > 통화 이름 앞글자 > 나라 앞글자 > 도시 앞글자 > 가운데 일치, 같은 순위는 목록 순서
  - 같은 통화는 한 줄로 묶고 맞은 나라 · 도시를 붙임
- 화면: `features/currencies/components/currency-search.tsx` (콤보박스) + `hooks/use-currency-search.ts` (열림 · 활성 줄 · 키보드) · `currency-list.tsx` 위에 놓음. 고르면 `router.push('/currencies/CODE')`.

## 대안 · 트레이드오프
- 기존 `matchCurrency` 를 넓히기: 목록 거르기만 되고 자동완성 · 이유 표시가 안 되어 새 함수로 (matchCurrency 는 그대로 둠).
- 외부 콤보박스 라이브러리: 의존성 추가(보호 파일 package-lock) 대신 직접 구현 · 테스트로 접근성 확인.

## 파일 계획
- packages/shared/src/domain/travel.ts · travel.test.ts
- packages/shared/src/domain/currency-search.ts · currency-search.test.ts
- packages/shared/package.json (exports 한 줄 · 필요할 때)
- apps/web/src/features/intro/lib/places.ts · flow.ts (공용 표로)
- apps/web/src/features/currencies/**
- apps/web/e2e/currencies*.spec.ts · apps/web/e2e/currency-search.spec.ts
- .agents/specs/0192-currency-search/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 위험
- 인트로 출발 안내판 검색 회귀 → 기존 intro 단위 · e2e 로 확인.
- 휴대폰에서 자동완성 목록이 가로 목록 · 키보드와 겹침 → e2e 휴대폰 프로젝트로 확인.

## 검증 계획
- 단위(vitest): searchCurrencies · TRAVEL_CITIES 이동 뒤 intro flow
- e2e(playwright): currency-search.spec.ts (넓은 화면 · 휴대폰)
- Full 게이트 한 번 · 브랜치 미리보기에서 실제 브라우저 확인

## 계획과 달라진 점

# SDD — 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- **전환 방식 (lead 판단):** 페이지는 지금처럼 통화마다 정적 페이지(/currencies/[code])를 그대로 둔다. 칩 · 목록 · 상자 선택은 Next 클라이언트 이동(`router.push(…, { scroll: false })`)으로 주소를 바꾼다 — 받는 것은 빌드 때 만든 정적 자료라 **실행 중 API · D1 읽기 없음**. 칩 줄은 이미 `currencies/layout.tsx` 에 있어 이동 중에도 남는다.
- **이전 값에서 이어 가기:** 상세 부품이 새로 그려질 때 "직전에 보이던 통화의 값"(큰 환율 · 최저 · 최고 · 평균 · 비행기 위치 · 글자판 금액 · 국기 칩 위치)을 모듈 단위 작은 저장소(전환 기억)에서 읽어 거기서 새 값으로 카운트업 · 이동한다. 처음 들어오거나 새로 고침이면 기억이 없어 움직임 없이 최종.
- **순서:** 고름 → (환율 자리가 화면 위로 벗어나 있으면) 부드럽게 올라감 → 다 올라가면 이동 시작 → 새 페이지에서 국기 날아감 · 글 바뀜 · 카운트업 · 비행기 · 글자판(0227 `RollingNumber`, 글자판형 옵션 추가) · 그래프.
- **고른 칩:** `recent-currencies` 계산(맨 앞 붙이기 · 중복은 앞으로 · 5개 넘으면 더보기 · 쪽 나누기)은 lib, 저장은 use-favorites 와 같은 useSyncExternalStore + localStorage 패턴의 새 훅. 밀림 · 빠짐은 FLIP(위치 기억 → 바뀐 뒤 transform 으로 옮김). 더보기 상자는 칩 줄 기준 absolute(문서 흐름 밖).
- 0227 브랜치 위에서 시작 — 0227 머지 뒤 main 으로 다시 얹는다.

## 대안 · 트레이드오프
- 한 페이지 안에서 클라이언트가 /bff 로 새 통화 자료를 받아 바꾸기 → 사용자가 고를 때마다 운영 D1 읽기 · 실패 처리 부담, 고르지 않음.
- 통화별 정적 JSON 을 따로 만들어 받기 → 빌드 때 API 호출이 늘고 정적 페이지 자료와 중복, 고르지 않음(클라이언트 이동이 이미 정적 자료를 받음).

## 파일 계획
- apps/web/src/features/currencies/** (currency-detail · currency-chips · currency-list · converter · result-board · range-card · period-chart · 새 부품 · hooks · lib)
- apps/web/src/app/currencies/layout.tsx (필요하면)
- packages/ui/src/components/motion/rolling-number.tsx · packages/ui/src/lib/rolling-number.ts (글자판형 옵션)
- apps/web/src/app/globals.css (필요하면)
- 테스트(test): features/currencies/lib/*.test.ts · apps/web/src/shared/currency-switch.test.ts · apps/web/e2e/currency-switch.spec.ts · currency-chips.spec.ts · 옛 테스트 보정
- .agents/specs/0231-currency-switch/**

## 계획 밖 변경 이유

## 위험
- 클라이언트 이동 중 layout 은 남고 상세는 새로 그려짐 → 전환 기억이 없으면 움직임이 빠짐(틀린 값은 아님).
- 칩 줄이 다른 탭과 동기화될 때 밀림 움직임이 갑자기 보일 수 있음 → 다른 탭 변경은 움직임 없이 반영.

## 검증 계획
- test: 단위(칩 계산 · 저장 · 전환 기억) · 소스 검사 · e2e(전환 순서 · 올라감 · 칩 · 상자 · 주소 · 새로 고침 · 움직임 줄이기) · 게이트 full(가짜 API) · 미리보기 /currencies/JPY 1280 · 390.

## 계획과 달라진 점

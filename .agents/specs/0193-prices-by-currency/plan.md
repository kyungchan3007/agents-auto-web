# 계획

## 무엇을 · 왜
- 패치(버그): 통화 상세의 "이 통화 쓰는 나라 물가 보기" 링크가 그냥 `/prices` 로 가서 여행 물가 전체 목록이 나온다 (`features/currencies/components/currency-detail.tsx`). 어떤 통화에서 왔는지 넘기지 않는다.
- 링크에 통화를 넘기고(`/prices?currency=EUR`), 여행 물가 페이지가 그 통화를 쓰는 나라만 걸러 보여 준다.
- 걸러진 상태임을 알리고("유로 쓰는 나라 N곳" 같은 안내) "전체 보기"로 돌아갈 수 있게 한다.

## 애매한 곳
- 주소 모양은 `?currency=CODE` (가정 · 정적 사이트라 페이지에서 읽음 · 모르는 코드나 쓰는 나라가 없는 코드면 거르지 않고 전체 + 안내).
- 나라 판정은 공용 `countriesOf(currency)` (`@hav/shared/travel`) 를 쓴다 (새 표를 만들지 않음).
- 물가 자료가 없는 나라는 "물가 자료 없음"으로 남기고 지어내지 않는다.

## 파일 계획
- apps/web/src/features/currencies/** (링크)
- apps/web/src/features/travel-price/** (거르기 · 안내 · 전체 보기)
- apps/web/src/app/prices/** (Suspense 등 필요할 때)
- apps/web/e2e/**
- .agents/specs/0193-prices-by-currency/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 완료 기준
- [x] bash .agents/checks.sh PASS (Quick)
- [x] 테스트 먼저 커밋(구현 전 FAIL) → 수정
- [x] 유로(나라 여럿) · 엔화(나라 하나) · 물가 자료 없는 나라 · 모르는 통화 코드 모두 확인 (단위 + e2e)
- [x] 걸러진 안내 · "전체 보기" 누르면 전체 목록
- [ ] 브랜치 미리보기에서 확인

## 허점
- 물가 자료 없는 나라("물가 자료 없음")는 실제 자료에는 아직 없어(지금은 여행지 나라 38곳 모두 자료 있음) 단위 테스트로만 확인 — e2e 로 만들 방법이 없음.
- 정적 사이트라 ?currency= 는 브라우저에서 읽음 — 읽기 전 · 검색 · AI 가 읽는 HTML 은 전체 목록.
- 0170 디자인 변경 때 링크 문구만 남고 목적지 동작은 확인하지 않았다 — 링크 e2e 는 "누른 뒤 무엇이 보이는지"까지 본다.

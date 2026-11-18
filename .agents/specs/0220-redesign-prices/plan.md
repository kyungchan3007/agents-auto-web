# 계획 — 작업 0220 새 디자인 여행 물가 (/prices · 시안 B)

## 무엇을 · 왜
- 사용자 결정: 여행 물가는 시안 B (B/prices.html · B/shots/prices-1280.png · -390.png). A 머리의 떠 있는 카드("인도 · 물가 37" 같은 것)는 쓰지 않음
- 첫 화면: 메뉴와 한 면으로 이어지는 파랑 면 · 지금 라벨 · 굵은 큰 제목(지금 문구 "인도는 한국보다 물가가 63% 낮습니다" · 숫자 % 노랑 · 실제 계산 값) · 지금 설명
- 오른쪽 "여행 하루 예산" 카드가 파랑 · 흰 면 경계에 걸침 — 지금 예산 계산 기능 그대로(나라 · 하루 금액 · 일수 · 결과 · 안내 글). 결과 금액 카운트업
- 한국 = 100 자 하나: 대표 나라 점(싼 쪽 · 비슷 · 비싼 쪽, 자에 이름 · 물가 숫자) · 한국 100 표시 — 어떤 나라를 점으로 찍을지는 지금 세 칸 표의 맨 위 나라들(실제 자료)
- 아래 세 칸 표(한국보다 싼 곳 · 비슷한 곳 · 비싼 곳) · 나라 줄에 물가 · 환율 상태 · "나라 더 보기" · "자료가 없어 뺀 나라" 지금 그대로
- 물가 숫자 카운트업
- 휴대폰: B/shots/prices-390.png

## 공통 규칙
- 0216 부품 사용(FlapBoard B 모양 · CountUp · useCountUp · SlideIn · Flag/CurrencyFlag) · 시안은 그대로 옮기지 않고 사이트 부품 · 토큰으로
- 숫자 · 그래프는 실제 자료(지금 페이지가 받는 값) · 자료 없으면 지금처럼 빈 값 · 오류 표시
- 사진은 쓰지 않음: 이 페이지의 사진 머리를 걷어 냄(사진 파일 · 부품 삭제는 0222)
- 시안 영문 라벨(대문자 작은 글씨) · 원래 없던 문장은 넣지 않음 — 필요하면 lead 에게 목록으로(사용자 확인)
- 제목 위 작은 라벨 유지 · 데스크톱 · 휴대폰 같은 시안
- 움직임: 화면에 들어올 때 한 번 · 움직임 줄이기면 최종 값 · 서버 첫 그림 = 최종 값

## 애매한 곳
- 고른 나라가 있으면 지금 제목이 그 나라로 바뀌는 동작 유지 (사진만 뺌) (가정)

## 파일 계획
- apps/web/src/features/travel-price/components/price-page.tsx · price-view.tsx · prices-header.tsx · price-bands.tsx · price-bands.test.ts · budget-planner.tsx
- apps/web/src/features/travel-price/lib/** (필요하면)
- apps/web/src/shared/*.test.ts (prices 소스 검사 갱신)
- apps/web/e2e/prices*.spec.ts · apps/web/e2e/** (prices 관련)
- .agents/orchestration/TASKS.md · .agents/specs/0220-redesign-prices/**

## 계획 밖 변경 이유
- apps/web/src/features/travel-price/components/price-ruler.tsx · lib/ruler.ts · lib/ruler.test.ts — 새 파일(계획의 components · lib 안): 한국 = 100 물가 자 · 계산
- apps/web/src/shared/{font-readability · number-emphasis · pages-redesign · photos}.test.ts — 옛 /prices(사진 머리 · 흰 카드)를 전제한 소스 검사를 새 디자인에 맞게 (큰 글씨 허용 목록에 prices-header 추가 · 큰 문장 EmphText 가 bg="sea" · 파랑 면 예외 · 사진 머리 없음)
- apps/web/e2e/{country-photos · detail-design · emphasis · photos}.spec.ts — 같은 이유로 옛 /prices 기대(사진 · 흰 카드 틀 · 형광펜 띠)를 고침
- 흰 바탕 결정: 0216 의 네 커밋(a4ee96e · cd82273 · 79b3ae1 · 94b795f)을 cherry-pick (lead 지시) · 예산 카드에 옅은 선

## 완료 기준
- [x] 1280 · 768 · 390 가로 넘침 없음 · 콘솔 오류 없음 · 사진 요청 0
- [x] 예산 카드가 첫 화면 경계에 걸침 · 계산 결과가 지금과 같음(e2e: 같은 입력 → 같은 금액)
- [x] 자의 점 위치가 물가 숫자 비율과 맞음(단위) · 카운트업 끝 값 = 실제 값 · 움직임 줄이기
- [x] bash .agents/checks.sh PASS · 빌드 한 번

## 허점
- 웹킷(사파리) 확인 못 함.
- e2e 는 `next dev` 가 이 환경에서 하이드레이션이 안 돼 못 쓰고, **가짜 API 로 만든 빌드**(운영 D1 읽기 0 · 물가 22개 나라 · 통화 10개)로 돌렸음. 그래서 '유로 거르기'(핀란드 등) · 직구 e2e 는 가짜 자료의 한계로 실패 — 실제 자료 미리보기에서 확인 필요.
- 자의 점은 지금 세 칸 표의 맨 위 두 나라씩(6곳) — 값이 비슷한 나라끼리 위 · 아래로 번갈아 놓아 이름표가 겹치지 않게 했지만 같은 쪽 가까운 값(예: 3곳이 몇 숫자 안에 몰림)이면 겹칠 수 있음.
- 휴대폰 예산 카드는 위로 6rem 끌어올려 파랑 면에 걸침(첫 면 아래쪽 여백을 늘려 '다른 나라 보기' 버튼을 가리지 않음).
- 큰 제목이 길면(나라 이름이 긴 경우) 3~4줄까지 늘어날 수 있음.
- 시안의 영문 라벨(PRICE LEVEL · DAILY BUDGET · SCALE)은 넣지 않음. 새로 들어간 글: 자 위 작은 제목 "한국 = 100"(지금 설명의 낱말) · 자 제목 "한국보다 싼 곳 · 비슷한 곳 · 비싼 곳"(구간 이름 합침) — 사용자 확인 필요.

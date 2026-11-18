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

## 완료 기준
- [ ] 1280 · 768 · 390 가로 넘침 없음 · 콘솔 오류 없음 · 사진 요청 0
- [ ] 예산 카드가 첫 화면 경계에 걸침 · 계산 결과가 지금과 같음(e2e: 같은 입력 → 같은 금액)
- [ ] 자의 점 위치가 물가 숫자 비율과 맞음(단위) · 카운트업 끝 값 = 실제 값 · 움직임 줄이기
- [ ] bash .agents/checks.sh PASS · 빌드 한 번

## 허점
-

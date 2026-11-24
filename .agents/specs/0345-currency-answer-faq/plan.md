# 계획

## 무엇을 · 왜
- 통화 상세 /currencies/[code] 에 한 줄 답과 자주 묻는 질문을 더해, 들어온 사람이 "지금 바꿔도 되나"의 답을 첫 화면에서 얻고 다음 페이지로 이어 가게 한다(시안 5-new · 6-new).
- 한 줄 답: 90일 신호 꼬리표 아래 "한 줄 답 · YYYY-MM-DD 기준" + "100엔은 846.76원으로, 1년 평균(912.92원)보다 7% 낮고 1년 최저(833.45원)와 1.6% 차이입니다." 페이지에 이미 있는 값(오늘 값 · 1년 평균 · 1년 최저)으로만. 평균보다 높으면 "높고".
- 자주 묻는 질문 네 개(맨 아래 출처 줄 위 · 처음 두 개 펼침) + FAQPage 구조화 자료:
  1) "(통화) 지금 싼 편인가요?": 90일 신호 위치 · 1년 평균 · 1년 최저 대비.
  2) "(큰 금액) (통화)는 원화로 얼마인가요?": 매매기준율로 계산 · 송금 · 현찰은 수수료로 달라짐.
  3) "(쓰는 나라) 물가는 한국보다 비싼가요?": 물가 자료가 있는 나라면 그 문장 + /prices/[code] 링크(작업 0344). 쓰는 나라가 여럿(유로)이면 대표 한 나라 또는 목록 링크. 자료 없으면 질문을 빼지 않고 "자료 없음".
  4) "오늘 환율은 언제 바뀌나요?": 평일 한국 시간 12시 이후 수출입은행 값을 받고, 받지 못하면 12:10 ~ 17:40 30분마다 다시 시도(ensure-fx.yml), 주말 · 공휴일은 직전 영업일 값.
- 서버 첫 그림(정적 HTML)에 문장이 들어감.

## 애매한 곳
- 큰 금액: 엔 10만 · 달러 1,000 · 유로 1,000 처럼 통화마다 흔히 바꾸는 단위 (가정 · 표 하나로).
- 유로처럼 쓰는 나라가 여럿이면 질문 3 은 첫 나라(TRAVEL_COUNTRIES 순서) (가정).
- 쓰는 나라가 여행지 표에 없는 통화(예: BRL)는 물가 질문을 빼고 질문 셋 (확인됨: test 제안 · lead 수락). 물가 자료만 없는 나라는 질문을 두고 '자료 없음'.
- 유로처럼 여러 나라면 TRAVEL_COUNTRIES 순서 첫 나라(프랑스)로 고정 (확인됨).
- 작업 종류 ③: 요구마다 기능 테스트.

## 파일 계획
- apps/web/src/features/currencies/**
- apps/web/src/app/currencies/[code]/page.tsx
- apps/web/src/shared/seo/**
- packages/shared/src/domain/**
- .changeset/*.md
- *.test.ts · apps/web/e2e/** · .agents/e2e-map.json (test)
- .agents/specs/0345-currency-answer-faq/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유
- packages/shared/src/domain/travel.ts: countryPath · priceGapSentence 를 0344 나라 페이지와 함께 쓰도록 옮김(두 벌 금지).
- apps/web/src/features/prices/country/** : 나라 FAQ 가 공통 FaqList 를 쓰도록 바꿈.
- 질문 칸 위치: 시안 6-new 는 통화 목록 아래지만 목록이 layout 에 있어 통화 코드를 몰라, 상세 맨 끝(목록 위 · 출처 줄 위)에 둠. 목록 아래로 옮기려면 병렬 라우트가 필요해 하지 않음.

## 완료 기준
- [ ] bash .agents/checks.sh PASS (PR 최신 커밋의 CI gate)
- [ ] 정적 HTML 에 한 줄 답 · FAQPage · 질문 넷

## 허점
-

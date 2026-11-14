# 계획

## 무엇을 · 왜
- 한국은행 ECOS **수입물가지수(원화기준 총지수, 월별)** 를 받아 저장하고, 원/달러 환율(월평균)과 **같은 차트**에 그려 "환율이 오르면 수입물가가 따라 오른다"를 보여 준다.
- 0163 의 공용 시계열 테이블 `indicator_points` 위에 쌓는다 (보호 파일 변경 없음).

## 공식 명세 (확인: 2026-11-15, lead 조사 · 공개 샘플 키 `sample` 로 실제 호출)
- 출처: StatisticSearch 명세 https://ecos.bok.or.kr/api/#/DevGuide/DevSpeciflcation/OA-1040
- 요청: `GET https://ecos.bok.or.kr/api/StatisticSearch/{키}/json/kr/{시작건수}/{종료건수}/401Y015/M/{YYYYMM}/{YYYYMM}/*AA/W`
  - `401Y015` = 수입물가지수(기본분류) · `*AA` = 총지수 · `W` = 원화기준 (C 계약통화 · D 달러 — 빼면 셋이 섞여 옴)
- 응답(정상): `{"StatisticSearch":{"list_total_count":N,"row":[{STAT_CODE, ITEM_CODE1, ITEM_CODE2, UNIT_NAME:"2020=100", TIME:"YYYYMM", DATA_VALUE:"136.27", ...}]}}` · DATA_VALUE 는 **문자열**, 빈 값은 null
- 응답(오류): **HTTP 200** + `{"RESULT":{"CODE":"INFO-200","MESSAGE":"해당하는 데이터가 없습니다."}}` (INFO-100 키 무효 · ERROR-100 필수값 · ERROR-301 건수 · ERROR-602 과도한 호출 등)
- 키: ECOS 회원가입 → 인증키 신청 · 이용기간 2년(연장 가능) · 출처 "ECOS 에서 제공된 정보" 표시 의무(약관 제7조) · `sample` 키는 한 번에 10건까지
- 한도: 숫자 미공개 (과도하면 ERROR-602)
- 기준: 2020=100 · 발표는 다음 달 15일경
- Workers(해외 IP)에서 받아지는지는 **키 발급 후 확인 필요**

## 설계
- series `ecos-import-price:krw` · period `YYYY-MM` · source `ecos`
- API `apps/api/src/features/indicators/ecos.ts` (파싱 · RESULT 오류 구분) · 키 없으면 건너뜀
- 일정: 매달 1일 회차(pricesMonthly)에서 다른 수집과 따로. 최근 24개월 다시 받아 덮어씀.
- 화면 /calc (직구 화면 · 0163 과세환율 영역 아래): 원/달러 월평균과 수입물가지수를 한 차트(두 축 또는 같은 기준으로 지수화 — 기존 차트 컴포넌트가 지원하는 쪽)에. 출처 "한국은행 ECOS" 표시. 자료 없으면 "준비 중"

## 애매한 곳 (사용자가 자는 중 — 판단해서 정함)
- ECOS INFO-200(데이터 없음)은 오류로 기록 (가정 · 24개월 범위에서 하나도 없으면 이상한 상황)
- 환율 월평균 계산은 0164 의 travel-price 함수를 다시 씀 (가정 · 같은 계산 중복 방지)
- 0165 는 0164 위에 쌓음 (같은 collect.ts · index.ts 월간 회차를 고쳐 충돌 방지)
- 원화기준(W) 총지수 사용 (가정 · 환율 영향이 들어간 지수라 요청 취지에 맞음)
- 화면은 /calc (가정 · 수입물가가 직구 비용과 직접 이어짐)
- 1일 회차만 쓰므로 ECOS(15일경 발표)는 약 2주 ~ 한 달 반 늦게 반영 (가정 · wrangler 변경 금지 조건)

## 담당
- test: 완료 기준마다 테스트 먼저 (fixture 는 위 실측 응답 원문)
- builder: 구현

## 파일 계획
- .agents/specs/0165-ecos-import-price/**
- .agents/orchestration/TASKS.md
- apps/api/src/features/indicators/**
- apps/api/src/index.ts
- apps/api/src/env.ts
- apps/api/.dev.vars.example
- apps/api/src/scheduled-ecos.test.ts
- apps/web/src/features/import-calc/**
- apps/web/src/features/travel-price/lib/**
- apps/web/src/app/calc/page.tsx
- apps/web/src/shared/api.ts
- apps/web/src/bff/**
- packages/shared/src/**
- docs/domain/import-calc.md

## 계획 밖 변경 이유

## 완료 기준
- [ ] 정상 응답에서 (YYYY-MM, 지수) 를 얻고 null · 숫자 아닌 값은 버린다
- [ ] RESULT 오류 응답(HTTP 200)은 오류로 기록하고 저장하지 않는다
- [ ] 키가 없으면 건너뛰고 저장하지 않는다
- [ ] ECOS 수집이 실패해도 다른 월간 수집은 그대로다
- [ ] 환율 월평균과 수입물가를 같은 달끼리 맞춘다 · 한쪽만 있는 달은 빈 값
- [ ] 자료가 없으면 화면은 "준비 중"
- [ ] bash .agents/checks.sh PASS

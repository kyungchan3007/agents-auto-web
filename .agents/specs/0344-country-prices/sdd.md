# SDD: 어떻게

> 요구사항: [prd.md](prd.md)

## 접근
- 주소: `/prices/JPN` 처럼 ISO alpha-3 대문자. TRAVEL_COUNTRIES 의 키가 alpha-3 이고, 통화 상세가 `/currencies/USD` 처럼 대문자 코드라 같은 모양으로 맞춘다. 바꾸는 표가 없어 잘못 이어질 곳이 줄어든다.
- 경로: apps/web/src/app/prices/[code]/page.tsx · `dynamicParams = false` · generateStaticParams 는 빌드 때 받은 price-levels 에 값이 있는 TRAVEL_COUNTRIES 키. API 가 안 되면 일본 하나(통화 상세의 DEFAULT_CODE 방식).
- 계산은 순수 함수(packages/shared/src/domain 또는 features/prices/country/lib): 한 줄 답 문장 · 견줘 볼 나라 고르기 · 다시 계산한 % · FAQ 답 문장. tsx 는 그리기만, 상태는 커스텀 훅.
- 견줘 볼 나라 고르기: 같은 지역(region) 안에서 물가 지수 차이가 작은 순 네 곳(자기 제외 · 값 있는 나라만). 같은 지역이 네 곳보다 적으면 다른 지역에서 차이가 작은 순으로 채움. % = round((그 나라 ÷ 기준 나라 − 1) × 100), 음수면 "쌈" · 양수면 "비쌈".
- 항공권 카드: 출발일 달력 8개 도시 표(기존 항공권 자료)에 그 나라 도시가 있으면 1주 왕복 최저가와 받은 날. 없으면 통계청 국제항공료 지수의 "떠나기 싼 달"(홈 "11월에 떠나세요"와 같은 자료 · 같은 함수). 둘 다 없으면 카드에 "자료 없음".
- 예산 카드: 기존 예산 부품에 처음 고른 나라를 넘김.
- 메타: pageMeta(path · title · description) · breadcrumbLd · FAQPage JsonLd · sitemap.ts 에 나라 주소.
- /prices 의 나라 이름 · 노선 · 목록 칩을 /prices/[code] 링크로.

## 대안 · 트레이드오프
- alpha-2 소문자(`/prices/jp`): 짧지만 키와 다른 표가 하나 더 필요하고 통화 주소 모양과 달라 고르지 않음.
- 쿼리(`/prices?c=JPN`): 정적 HTML 이 하나라 검색 · AI 가 나라별 문장을 읽지 못해 고르지 않음.

## 파일 계획
- apps/web/src/app/prices/[code]/**
- apps/web/src/app/sitemap.ts
- apps/web/src/features/prices/**
- apps/web/src/shared/seo/**
- packages/shared/src/domain/**
- .changeset/*.md
- apps/web/e2e/** · .agents/e2e-map.json · *.test.ts (test)
- .agents/specs/0344-country-prices/** · .agents/orchestration/TASKS.md

## 계획 밖 변경 이유

## 위험
- 정적 페이지 수만큼 빌드 시간이 늘어난다(나라 약 30개).
- 항공권 · 항공료 자료가 비면 카드가 "자료 없음": 가격을 채우지 않음.

## 검증 계획
- 단위: 한 줄 답 · 견줘 볼 나라 · % · FAQ 답 · 통화 없는 나라.
- e2e(새 spec): /prices/JPN 정적 HTML 에 제목 문장 · 한 줄 답 · FAQPage, 다음으로 볼 것 카드 링크, 견줘 볼 나라 링크, 마카오(통화 없음) 상자 없음, /prices 칩 → 나라 페이지.
- CI gate.

## 계획과 달라진 점
- 견줘 볼 나라: 시안 2-new 의 네 곳(베트남 · 태국 · 중국 · 홍콩)은 예시였고, 규칙(같은 지역 · 물가 차이 작은 순)대로면 일본 기준 홍콩 · 싱가포르 · 중국 · 태국. 숫자를 맞춘 규칙을 따름(test 확인 11-25).

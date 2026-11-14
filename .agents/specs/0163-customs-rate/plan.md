# 계획

## 무엇을 · 왜
- 관세청이 매주 고시하는 **과세환율(수입)** 을 받아 저장하고, 직구 화면에 보여 준다. 직구 관세 · 부가세는 이 환율로 계산되므로 수출입은행 환율보다 정확한 "예상 금액"이 된다.
  - 이번 주 과세환율과 수출입은행 매매기준율의 차이
  - 주별 흐름 차트
  - 직구 계산기(/calc)가 과세환율을 쓰고, 출처 · 고시 주(적용 시작일)를 함께 표시. 과세환율이 없으면 지금처럼 수출입은행 환율 + "예상 금액" 안내로 돌아간다.
- 0164(KOSIS) · 0165(ECOS)가 함께 쓰는 **시계열 테이블 하나**를 이 작업에서 만든다 → 보호 파일 변경을 이 PR 하나에 모은다.

## 공식 명세 (확인: 2026-11-15, lead 조사)
- **고른 API: 공공데이터포털 "관세청_관세환율정보(GW)"** — https://www.data.go.kr/data/15101230/openapi.do
  - 기술문서: 같은 페이지 첨부 「관세청_공공데이터포털_기술문서(18.관세환율정보)-수정.docx」
  - 고른 이유: data.go.kr 활용신청만 하면 자동승인 · 표준 443 포트 · 한도 명시. UNI-PASS(API012)는 회원가입이 따로 필요하고 38010 포트 · 한도 미기재.
- 요청: `GET https://apis.data.go.kr/1220000/retrieveTrifFxrtInfo/getRetrieveTrifFxrtInfo`
  - `serviceKey` (필수, 인증키 · URL 인코딩) · `aplyBgnDt` (필수, YYYYMMDD 조회일) · `weekFxrtTpcd` (필수, 수출 1 · **수입 2**)
- 응답: **XML 만**. `response/header/resultCode`(00 정상) · `resultMsg` · `body/items/item[]`: `aplyBgnDt`(적용개시일 YYYYMMDD) · `cntySgn` · `currSgn`(통화 3자리) · `fxrt`(환율) · `imexTp` · `mtryUtNm`
  - 적용 종료일 필드는 없다. 적용 기간은 일요일 00시 ~ 토요일 24시 (관세평가 운영에 관한 고시 제3조② — https://www.law.go.kr/LSW/admRulInfoR.do?admRulSeq=2100000261194) → 종료일 = 시작일 + 6일로 계산.
  - 기술문서 예시: 조회일 20150101(목) → `aplyBgnDt` 20141228(일). 그 주 일요일이 오는 것으로 보임 (문서 명시 없음 · 가정).
  - 환율 단위: 예시 AED 302.7 · ZAR 95.93 → **외화 1단위당 원**으로 보임. 수출입은행은 JPY · IDR 이 100 단위(FX-04) → 비교할 때 단위를 맞춘다.
  - 게이트웨이 오류는 다른 모양: `OpenAPI_ServiceResponse/cmmMsgHeader/errMsg · returnAuthMsg · returnReasonCode` (예: 30 SERVICE_KEY_IS_NOT_REGISTERED_ERROR, 키 없으면 HTTP 401 SERVICE_KEY_IS_NULL)
- 키: 공공데이터포털 로그인 → 이 API "활용신청" → 개발 · 운영 모두 자동승인.
- 한도: 개발계정 하루 1,000건 · 초당 30tps (오류 22 · 23).
- 위험: data.go.kr 은 IP 차단 오류코드(29 · 32)가 있고, 해외 서버(GitHub 러너)에서 인증 호출이 타임아웃 났다는 비공식 보고가 있다. **Cloudflare Workers 에서 실제로 받아지는지는 키 발급 후 확인 필요.**

## 설계
- **공용 시계열 테이블 `indicator_points`** (새 마이그레이션 + schema.ts — 보호 파일, 사람 승인 필요)
  - `series` text (예: `kcs-import:USD` · `kosis-cpi:air-fare` · `ecos-import-price:krw`) · `period` text (주간은 적용 시작일 `YYYY-MM-DD`, 월간은 `YYYY-MM`) · `value` real · `source` text enum(`kcs` · `kosis` · `ecos`) · `fetched_at` text
  - 기본 키 (series, period) · 같은 키는 덮어씀 (월 자료 고침 반영). 받지 못한 기간은 행을 만들지 않는다 (FX-02 와 같은 원칙).
- API `apps/api/src/features/indicators/`
  - `store.ts` 저장 · 읽기 (series 하나의 최근 N개) · 수집 기록은 기존 `fetch_runs` 에 source 이름으로
  - `kcs.ts` XML 파싱(문서 예시 fixture) · 단위 정규화 · 오류 응답 구분
  - `collect.ts` 키 없으면 건너뜀(실행 기록 없이 로그만) · 이미 받은 주(이번 주 일요일 시작)는 건너뜀
  - `routes.ts` `GET /indicators/:series?limit=` (읽기 전용) → BFF 허용 목록에 추가 · 저장 시 기존 api_cache 비우기 규칙 따르기
- 일정: wrangler 는 그대로. `index.ts` 의 평일 12:00 회차(fxDaily)에서 환율 수집이 끝난 뒤 **따로** 과세환율 수집 (실패해도 환율 결과 · 로그에 영향 없게 별도 catch).
- 화면 (기존 디자인 · 컴포넌트 · 색 그대로)
  - /calc: 계산에 쓸 환율을 고르는 순수 함수 — 그 통화의 이번 주 과세환율이 있으면 그것(출처 "관세청 과세환율 · YYYY-MM-DD 주"), 없으면 수출입은행 + 기존 안내 (IMP-02 · IMP-04)
  - /calc 아래 "과세환율" 영역: 이번 주 과세환율 vs 수출입은행 매매기준율 차이(원 · %) + 주별 흐름 차트 (기존 차트 패턴). 자료가 없으면 "준비 중" (숫자를 만들지 않음)
- 문서: docs/domain/import-calc.md (과세환율 규칙 · "아직 넣지 않은 것"에서 과세환율 빼기) · apps/api/.dev.vars.example 에 `KCS_KEY=` + 발급처 주석

## 애매한 곳 (사용자가 자는 중 — 판단해서 정함)
- 지난 주 과세환율은 계산에 쓰지 않는다 (가정 · test 가 정하고 lead 가 받아들임 — 과세환율은 그 주에만 적용)
- 공공데이터포털 API 사용 (가정 · 위 이유)
- 비교 통화: 수출입은행 통화 목록과 겹치는 통화만 저장 (가정 · 표에 없는 통화는 버림)
- 직구 계산기는 과세환율이 있으면 우선 사용 (확인됨: 요청 원문 "직구 계산기(/calc)도 과세환율을 쓸 수 있게")
- 시계열 테이블 하나로 세 자료를 함께 저장 (확인됨: 요청 원문 권장)

## 담당
- test: 아래 완료 기준마다 테스트를 먼저 작성 (FAIL 확인) — fixture 는 기술문서 예시 XML
- builder: 구현 (schema.ts · 새 마이그레이션은 이 작업에 한해 lead 가 허용 — PR 에 "보호 파일 변경 — 사람 승인 필요"로 표시)

## 파일 계획
- .agents/specs/0163-customs-rate/**
- .agents/orchestration/TASKS.md
- apps/api/src/db/schema.ts (보호 파일 · 사람 승인 필요)
- apps/api/drizzle/migrations/0010_*.sql · apps/api/drizzle/migrations/meta/** (새 마이그레이션 · 보호 폴더)
- apps/api/src/features/indicators/**
- apps/api/src/index.ts · apps/api/src/env.ts · apps/api/.dev.vars.example
- apps/api/src/index.test.ts · apps/api/src/scheduled.test.ts
- apps/api/src/log.ts · apps/api/src/log.test.ts (로그에서 serviceKey= 가리기 — 키가 주소에 들어감)
- apps/web/src/bff/proxy.ts · apps/web/src/bff/*.test.ts
- apps/web/src/shared/api.ts
- apps/web/src/features/import-calc/**
- apps/web/src/app/calc/page.tsx
- packages/shared/src/** (계약 · 타입)
- packages/shared/package.json
- docs/domain/import-calc.md

## 계획 밖 변경 이유
- packages/shared/src/utils/date.ts: `weekStartOf` 추가 — API 수집과 화면 선택 함수가 같은 "주 시작(일요일)" 규칙을 쓰게 (파일 계획의 packages/shared/src/** 안)
- packages/shared/package.json: "./indicators" 내보내기 추가 (lead 허용)

## 완료 기준
- [ ] 문서 예시 XML 을 파싱해 (통화, 적용 시작일, 1단위당 원) 을 얻는다 · 빈 값 · 숫자 아닌 환율은 버린다
- [ ] resultCode ≠ 00 · 게이트웨이 오류 XML 이면 오류로 기록하고 저장하지 않는다
- [ ] 키가 없으면 수집을 건너뛰고 아무것도 저장하지 않는다
- [ ] 이번 주(적용 시작일)가 이미 저장돼 있으면 호출하지 않는다
- [ ] 과세환율 수집이 실패해도 환율 수집 결과는 그대로다
- [ ] 계산기: 과세환율이 있으면 그것을 쓰고 출처 · 고시 주를 표시, 없으면 수출입은행 + 예상 금액 안내
- [ ] JPY 등 100단위 통화의 차이 계산이 단위를 맞춘다
- [ ] 자료가 없으면 화면은 "준비 중" (숫자 없음)
- [ ] bash .agents/checks.sh — 보호 파일 검사 외 모두 PASS (보호 파일은 사람 승인 대기)

## 허점
-

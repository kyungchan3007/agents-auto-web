// 관세청_관세환율정보(GW) 응답 예시 — 공공데이터포털 기술문서 「공공데이터 오픈API 활용가이드 (18.관세환율정보)」 1.1 다.d) 와 2-1 의 XML 형식 그대로
//   문서 예시는 "(생략)" 으로 줄여 놓아 항목 두 개(AED · ZAR)만 있음 — 값 · 필드 이름은 문서 원문, 적용개시일만 테스트용 주(2026-11-15 일요일)로 바꿈
//   문서 원문 날짜(20141228)를 그대로 쓰는 DOC_XML 도 함께 둠 (작업 0163)

const item = (aplyBgnDt: string, cntySgn: string, currSgn: string, fxrt: string, mtryUtNm: string) =>
  `<item>
<aplyBgnDt>${aplyBgnDt}</aplyBgnDt>
<cntySgn>${cntySgn}</cntySgn>
<currSgn>${currSgn}</currSgn>
<fxrt>${fxrt}</fxrt>
<imexTp>2</imexTp>
<mtryUtNm>${mtryUtNm}</mtryUtNm>
</item>`;

const ok = (items: string) => `<response>
<header>
<resultCode>00</resultCode>
<resultMsg>정상서비스.</resultMsg>
</header>
<body>
<items>
${items}
</items>
</body>
</response>`;

/** 문서 응답 예시 원문 (적용개시일 20141228) */
export const DOC_XML = ok([item("20141228", "AE", "AED", "302.7", "UAE Dirham"), item("20141228", "ZA", "ZAR", "95.93", "Rand")].join("\n"));

/** 같은 모양 · 이번 주(2026-11-15 일요일 시작) */
export const THIS_WEEK_XML = ok([item("20261115", "AE", "AED", "302.7", "UAE Dirham"), item("20261115", "ZA", "ZAR", "95.93", "Rand")].join("\n"));

/** 지난주 값이 온 응답 (조회일이 월요일이라 이번 주 고시가 아직 없을 때를 가정) */
export const LAST_WEEK_XML = ok([item("20261108", "AE", "AED", "300.1", "UAE Dirham")].join("\n"));

/** 쓸 수 없는 줄이 섞인 응답 — 빈 환율 · 숫자 아닌 환율 · 통화 부호 없음은 버려야 함 */
export const DIRTY_XML = ok(
  [
    item("20261115", "AE", "AED", "302.7", "UAE Dirham"),
    item("20261115", "ZA", "ZAR", "", "Rand"),
    item("20261115", "US", "USD", "N/A", "US Dollar"),
    item("20261115", "JP", "", "9.1", "Yen"),
    item("20261115", "EU", "EUR", "1,602.5", "Euro"), // 쉼표 — 문서에 예시가 없어 가정: 쉼표는 지우고 읽음 (수출입은행 값과 같은 처리)
  ].join("\n"),
);

/** 정상인데 항목이 없음 */
export const EMPTY_XML = ok("");

/** 제공기관 오류 — resultCode ≠ 00 (문서 2-2: 01 시스템 오류 · 03 인증 실패 · 99 필수 변수 누락) */
export const errorXml = (code: string, msg: string) => `<response>
<header>
<resultCode>${code}</resultCode>
<resultMsg>${msg}</resultMsg>
</header>
</response>`;

/** 공공데이터포털 게이트웨이 오류 — 문서 2-1 의 형식 그대로 (30 등록되지 않은 서비스키) */
export const GATEWAY_ERROR_XML = `<OpenAPI_ServiceResponse>
<cmmMsgHeader>
<errMsg>SERVICE ERROR</errMsg>
<returnAuthMsg>SERVICE_KEY_IS_NOT_REGISTERED_ERROR</returnAuthMsg>
<returnReasonCode>30</returnReasonCode>
</cmmMsgHeader>
</OpenAPI_ServiceResponse>`;

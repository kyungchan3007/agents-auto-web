// KOSIS 통계자료 응답 예시 — 작업 0164
//   모양: KOSIS 개발가이드의 jsonVD=Y 응답(.tmp/kosis/sample_vdY.json · 키에 따옴표 있는 JSON 배열 · DT 는 문자열) + 통계표 DT_1J22001 의 항목 코드(메타 API 실제 응답으로 확인한 C1=T10 전국 · C2=G03302 국제항공료 / I06102 해외단체여행비)
//   주의: **실제 CPI 월별 응답은 받아 보지 못했다** (키 발급 전). 필드 이름 · 값 모양은 문서 예시 그대로지만 월별(PRD_SE=M · PRD_DE=YYYYMM) · 지수 값은 이 모양에 맞춰 만든 테스트용 값이다 → 키 발급 후 실제 응답으로 확인 필요
//   오류 모양: HTTP 200 + 객체 {"err":"30","errMsg":"데이터가 존재하지 않습니다."} (개발가이드 오류 코드표)

type Row = Record<string, string>;

const row = (c2: string, c2Nm: string, prd: string, dt: string, extra: Row = {}): Row => ({
  ORG_ID: "101",
  TBL_ID: "DT_1J22001",
  TBL_NM: "지출목적별 소비자물가지수(품목포함, 2020=100)",
  C1_OBJ_NM: "시도별",
  C1: "T10",
  C1_NM: "전국",
  C2_OBJ_NM: "품목별",
  C2: c2,
  C2_NM: c2Nm,
  ITM_ID: "T",
  ITM_NM: "소비자물가지수",
  UNIT_NM: "2020=100",
  PRD_SE: "M",
  PRD_DE: prd,
  DT: dt,
  ...extra,
});

export const AIR_FARE = { c2: "G03302", nm: "국제항공료" } as const;
export const PACKAGE_TOUR = { c2: "I06102", nm: "해외단체여행비" } as const;

/** 정상 응답 — 국제항공료 3개월 (일부러 정렬 안 된 순서) */
export const AIR_FARE_JSON = [row(AIR_FARE.c2, AIR_FARE.nm, "202509", "118.37"), row(AIR_FARE.c2, AIR_FARE.nm, "202507", "131.2"), row(AIR_FARE.c2, AIR_FARE.nm, "202508", "127.85")];

/** 정상 응답 — 해외단체여행비 2개월 */
export const PACKAGE_TOUR_JSON = [row(PACKAGE_TOUR.c2, PACKAGE_TOUR.nm, "202508", "104.5"), row(PACKAGE_TOUR.c2, PACKAGE_TOUR.nm, "202509", "103.1")];

/** 쓸 수 없는 줄 섞임 — DT 가 비었거나 숫자가 아님 · 월 형식이 아님 · DT 필드 자체가 없음 (UNIT_ID · LST_CHN_DE 처럼 필드가 빠질 수 있다는 문서 설명) */
export const DIRTY_JSON = [
  row(AIR_FARE.c2, AIR_FARE.nm, "202501", "120.5"),
  row(AIR_FARE.c2, AIR_FARE.nm, "202502", ""),
  row(AIR_FARE.c2, AIR_FARE.nm, "202503", "-"),
  row(AIR_FARE.c2, AIR_FARE.nm, "2025", "99.9"),
  row(AIR_FARE.c2, AIR_FARE.nm, "202504", "N/A"),
  (() => {
    const r = row(AIR_FARE.c2, AIR_FARE.nm, "202505", "0");
    delete r.DT;
    return r;
  })(),
  row(AIR_FARE.c2, AIR_FARE.nm, "202506", "1,234.5"), // 쉼표 — 문서에 예시 없음(가정): 지우고 읽음
];

/** 오류 객체 (HTTP 200) — err 코드 · 메시지 */
export const errJson = (err: string, errMsg: string) => ({ err, errMsg });
export const NO_DATA_JSON = errJson("30", "데이터가 존재하지 않습니다.");
export const BAD_KEY_JSON = errJson("10", "인증키가 누락되었습니다.");

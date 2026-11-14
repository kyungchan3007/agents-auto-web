// ECOS StatisticSearch 응답 예시 — 작업 0165
//   모양: 0165 plan.md "공식 명세" 의 실측 응답 (공개 샘플 키 `sample` 로 2026-11-15 호출) — 정상 {"StatisticSearch":{"list_total_count":N,"row":[...]}} · 오류 {"RESULT":{"CODE","MESSAGE"}} (HTTP 200)
//   필드: STAT_CODE · STAT_NAME · ITEM_CODE1~4 · ITEM_NAME1~4 · UNIT_NAME("2020=100") · TIME(YYYYMM) · DATA_VALUE(문자열 · 빈 값은 null)
//   주의: 응답 원문 파일은 .tmp/ecos 에 없고(문서 페이지만 있음) plan.md 의 모양 설명으로 만들었다. 지수 값은 테스트용 (136.27 만 plan 의 예시 값)
//   → 키 발급 후 실제 응답으로 확인 필요

type Row = Record<string, string | null>;

const row = (time: string, value: string | null, item2 = "W", extra: Row = {}): Row => ({
  STAT_CODE: "401Y015",
  STAT_NAME: "10.3.1. 수입물가지수(기본분류)",
  ITEM_CODE1: "*AA",
  ITEM_NAME1: "총지수",
  ITEM_CODE2: item2,
  ITEM_NAME2: item2 === "W" ? "원화" : item2 === "D" ? "달러" : "계약통화",
  ITEM_CODE3: null,
  ITEM_NAME3: null,
  ITEM_CODE4: null,
  ITEM_NAME4: null,
  UNIT_NAME: "2020=100",
  WGT: null,
  TIME: time,
  DATA_VALUE: value,
  ...extra,
});

const ok = (rows: Row[]) => ({ StatisticSearch: { list_total_count: rows.length, row: rows } });

/** 정상 — 3개월 (일부러 정렬 안 된 순서) */
export const ECOS_OK = ok([row("202509", "136.27"), row("202507", "133.9"), row("202508", "135.04")]);

/** 쓸 수 없는 줄 섞임 — null · 빈 값 · 숫자 아님 · 월 형식 아님 · 원화(W) 아닌 항목(달러 D · 계약통화 C — 요청에 W 를 붙여도 섞여 올 때를 대비) */
export const ECOS_DIRTY = ok([
  row("202501", "130.5"),
  row("202502", null),
  row("202503", ""),
  row("202504", "-"),
  row("2025", "99.9"),
  row("202505", "N/A"),
  row("202506", "0"),
  row("202507", "98.7", "D"),
  row("202508", "97.1", "C"),
  row("202509", "1,234.5"), // 쉼표 — 문서에 예시 없음(가정): 지우고 읽음
]);

/** 정상인데 row 가 빈 배열 */
export const ECOS_EMPTY_ROWS = ok([]);

/** 오류 (HTTP 200) */
export const ecosError = (code: string, message: string) => ({ RESULT: { CODE: code, MESSAGE: message } });
export const ECOS_NO_DATA = ecosError("INFO-200", "해당하는 데이터가 없습니다.");
export const ECOS_BAD_KEY = ecosError("INFO-100", "인증키가 유효하지 않습니다. 인증키를 확인하십시오! 인증키가 없는 경우 인증키를 신청하십시오!");

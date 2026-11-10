// 환율 한 줄 — 출처가 달라도 D1 에 넣기 전엔 이 모양으로 맞춘다 (schema.ts fxRates 와 같은 칸)
export type RateRow = {
  date: string; // 기준일 YYYY-MM-DD
  currency: string; // ISO 4217
  unit: number; // 고시 단위 (엔 · 루피아 100)
  baseRate: number; // unit 당 원
  ttb: number | null;
  tts: number | null;
  source: "koreaexim" | "frankfurter";
  fetchedAt: string;
};

/** 출처가 "데이터 없음"이 아니라 "실패"를 알렸을 때 — 예비 출처로 넘어갈 이유 */
export class SourceError extends Error {
  // 필드로 씀 — 생성자 매개변수 속성은 node 타입 지우기 실행에서 못 읽음 (erasableSyntaxOnly · 작업 0148)
  readonly source: RateRow["source"];
  readonly code: string;
  constructor(source: RateRow["source"], code: string, message: string) {
    super(message);
    this.source = source;
    this.code = code;
  }
}

/** 날짜 검사의 원본은 @hav/shared/date */
export { isIsoDate } from "@hav/shared/date";

/** 토 · 일 (날짜만 보고 판단 — 시간대 영향 없음) */
export function isWeekend(date: string): boolean {
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

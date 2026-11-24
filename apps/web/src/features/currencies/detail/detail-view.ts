// 통화 화면 순수 함수 (작업 0170 · Figma 02) — 목록 이름 · 1년 최저/최고/평균 · 오늘 환율 옆 한 줄
// 판정은 사이트 신호 규칙 그대로(최근 90일 백분위) — 1년 평균은 숫자 카드 · 그래프 점선으로만 씀
import { SOURCE_NAME, currencyListName, percentileText, rateText } from "@hav/shared/currency";
import type { Signal } from "@hav/shared/signal";

export { currencyListName };

/** 목록 이름 + 고시 단위가 1 보다 크면 단위 ("일본 엔 100") */
export const currencyListLabel = (code: string, unit: number): string => (unit > 1 ? `${currencyListName(code)} ${unit}` : currencyListName(code));

/** 받은 값으로만 — 기록이 없으면 null (지어내지 않음 · 빈 날은 채우지 않음) · 평균은 반올림하지 않음 */
export function yearStats(days: { baseRate: number }[]): { min: number; max: number; avg: number } | null {
  if (days.length === 0) return null;
  const rates = days.map((d) => d.baseRate);
  return { min: Math.min(...rates), max: Math.max(...rates), avg: rates.reduce((a, b) => a + b, 0) / rates.length };
}

/** 오늘 환율 옆 한 줄 — 90일 백분위 문장 · 기준일 · 출처 (예비 출처면 그 사실) */
export function detailLine(p: { signal: Signal | null; percentile: number | null; windowDays: number; date: string; source: "koreaexim" | "frankfurter" }): string {
  return `${percentileText(p.signal, p.percentile, p.windowDays)} · ${p.date} ${SOURCE_NAME[p.source]}`;
}

/** 그래프에 찍을 최고 · 최저 날 — 같은 값이면 앞선 날짜 · 기록이 없으면 null · 값은 yearStats 의 max · min 과 같음 (작업 0175 · 카드와 같은 계산) */
export function extremeDays(days: { date: string; baseRate: number }[]): { max: { date: string; baseRate: number }; min: { date: string; baseRate: number } } | null {
  if (days.length === 0) return null;
  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date));
  let max = sorted[0];
  let min = sorted[0];
  for (const d of sorted) {
    if (d.baseRate > max.baseRate) max = d;
    if (d.baseRate < min.baseRate) min = d;
  }
  return { max: { date: max.date, baseRate: max.baseRate }, min: { date: min.date, baseRate: min.baseRate } };
}

/** 그래프 라벨 글 — "최고 1,554.4원" · 100 단위 통화는 "최저 912.34원 / 100" */
export function extremeLabelText(kind: "max" | "min", rate: { baseRate: number; unit: number }): string {
  const t = rateText(rate);
  return `${kind === "max" ? "최고" : "최저"} ${t.value}${t.unit}`;
}

/** 1년 최저 · 최고 · 평균 카드 글 — 통화 상세 전부가 쓰는 같은 규칙 하나(rateText · 1,000원 이상 첫째 · 미만 둘째 · 끝자리 0 생략 · 작업 0287) */
export function cardRateText(v: number, rate: { baseRate: number; unit: number }): string {
  const t = rateText({ baseRate: v, unit: rate.unit });
  return `${t.value}${t.unit}`;
}

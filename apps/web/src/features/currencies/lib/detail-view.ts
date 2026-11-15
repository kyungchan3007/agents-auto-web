// 통화 화면 순수 함수 (작업 0170 · Figma 02) — 목록 이름 · 1년 최저/최고/평균 · 오늘 환율 옆 한 줄
// 판정은 사이트 신호 규칙 그대로(최근 90일 백분위) — 1년 평균은 숫자 카드 · 그래프 점선으로만 씀
import { SOURCE_NAME, currencyName, percentileText } from "@hav/shared/currency";
import type { Signal } from "@hav/shared/signal";

/** Figma 목록 이름 — 표에 없는 통화는 기존 이름(코드도 없으면 코드) */
const LIST_NAME: Record<string, string> = { USD: "미국 달러", JPY: "일본 엔", EUR: "유로", THB: "태국 바트", VND: "베트남 동", CNY: "중국 위안", CNH: "중국 위안" };

export const currencyListName = (code: string): string => LIST_NAME[code] ?? currencyName(code);

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

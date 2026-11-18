// 12달 막대 — 국제항공료 지수 달별 평균(travelTiming)을 막대 높이 · 색 종류로 (작업 0217 · 시안 B)
// 가장 싼 달 = low(노랑) · 가장 비싼 달 = high(빨강) · 나머지 값 있는 달 = mid(연한 파랑) · 값 없는 달 = none (막대 없음 · 지어내지 않음)
import type { TravelTiming } from "./travel-timing";

export type YearBar = { month: number; heightPct: number | null; tone: "high" | "low" | "mid" | "none" };

const LOW_PCT = 20; // 가장 싼 달 높이
const HIGH_PCT = 92; // 가장 비싼 달 높이
const FLAT_PCT = 56; // 모두 같은 값일 때

/** ready 가 아니면 [] · 항상 1~12월 12개 · 높이는 가장 싼 달 20% ~ 가장 비싼 달 92% 사이 선형 */
export function yearBars(t: TravelTiming): YearBar[] {
  if (t.kind !== "ready") return [];
  const avgs = t.months.map((m) => m.avg);
  const lo = Math.min(...avgs);
  const hi = Math.max(...avgs);
  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const m = t.months.find((x) => x.month === month);
    if (!m) return { month, heightPct: null, tone: "none" as const };
    const heightPct = hi === lo ? FLAT_PCT : LOW_PCT + ((m.avg - lo) / (hi - lo)) * (HIGH_PCT - LOW_PCT);
    const tone = month === t.priciest ? "high" : month === t.cheapest ? "low" : "mid";
    return { month, heightPct, tone };
  });
}

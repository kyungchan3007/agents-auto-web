// 환율 흐름 그래프에 넘길 값 (작업 0219 · 0312 에 period-chart.tsx 에서 옮김) · 순수 함수 — 기록이 모자라면 null
import { rateDigits, rateText } from "@hav/shared/currency";
import type { ChartMark } from "@hav/ui/data/line-chart";
import { cardRateText, extremeDays, extremeLabelText, yearStats } from "../detail/detail-view";
import { dateTicks, dayNumber, valueAxis } from "./chart-axes";
import { PERIODS } from "./periods";

/** 화면의 기간 알약 — 6개월은 화면에서 뺌 */
export const CHIP_PERIODS = PERIODS.filter((p) => p.id !== "6m");

type Day = { date: string; baseRate: number };

/** 최고(빨강 · 위) · 최저(남색 · 왼쪽) 점 — 같은 날이면 없음 */
export function extremeMarks(shown: Day[], unit: number): ChartMark[] {
  const ex = extremeDays(shown);
  if (!ex || ex.max.date === ex.min.date) return [];
  const iMax = shown.findIndex((d) => d.date === ex.max.date);
  const iMin = shown.findIndex((d) => d.date === ex.min.date);
  return [
    { series: "rate", index: iMax, kind: "max", text: extremeLabelText("max", { baseRate: ex.max.baseRate, unit }), place: "top", tone: "red" },
    { series: "rate", index: iMin, kind: "min", text: extremeLabelText("min", { baseRate: ex.min.baseRate, unit }), place: "left", tone: "navy" },
  ];
}

export function periodChartView(shown: Day[], label: string, unit: number) {
  const stats = yearStats(shown);
  const last = shown.at(-1);
  const first = shown[0];
  if (!stats || !last || !first) return null;
  const axis = valueAxis(stats.min, stats.max);
  const rate = { baseRate: last.baseRate, unit };
  const t = (v: number) => cardRateText(v, rate);
  return {
    aria: `${label} 흐름 — 최저 ${t(stats.min)} · 최고 ${t(stats.max)} · 평균 ${t(stats.avg)} · 마지막 ${last.date} ${t(last.baseRate)}`,
    x: [dayNumber(first.date), dayNumber(last.date)] as [number, number],
    y: { min: axis.min, max: axis.max, ticks: axis.ticks },
    xTicks: dateTicks(first.date, last.date),
    points: shown.map((d) => ({ x: dayNumber(d.date), v: d.baseRate })),
    end: { label: "오늘", value: last.baseRate, digits: rateDigits(last.baseRate), unit: rateText(rate).unit },
    marks: extremeMarks(shown, unit),
    refs: [{ v: stats.avg, text: `${label} 평균 ${t(stats.avg)}`, short: `평균 ${t(stats.avg)}`, tone: "navy" as const }],
  };
}

// 여행 타이밍 그래프에 넘길 값 (작업 0218 · 0312 에 flights-graph.tsx 에서 옮김) · 순수 함수
//   최근 36개월 안에서 세 선(국제항공료 · 해외단체여행비 · 원/달러)이 같은 가로축 · 지수 두 선은 같은 눈금 · 원/달러는 자기 눈금(같은 가로선의 원 환산)
//   점은 모두 받은 실제 값 · 값이 없는 선은 넣지 않음
import { monthIndex, shortPeriod } from "@hav/shared/date";
import { numberText } from "@hav/shared/format";
import type { ChartMark, ChartSeries } from "@hav/ui/data/line-chart";
import type { IndexPoint } from "../travel-index";
import { type SeriesId, extremeTexts, monthTicks, seriesStats } from "./flights-graph-view";

const COLOR = { air: "var(--hav-pin-cheap)", tour: "var(--hav-band)", fx: "color-mix(in srgb, var(--hav-pin-line) 62%, var(--hav-card))" } as const;
const END_NAME: Record<SeriesId, string> = { air: "국제항공료", tour: "단체여행비", fx: "원/달러" };
/** 범례는 선 이름만 — 숫자는 그래프 끝 말풍선 · 오른쪽 칸에 있음 (작업 0261) */
export const LEGEND_NAME: Record<SeriesId, string> = { air: "국제항공료", tour: "해외단체여행비", fx: "원/달러 월평균" };

const lastOf = (vals: IndexPoint[]) => vals[vals.length - 1]!.value;
const pts = (vals: IndexPoint[]) => vals.map((p) => ({ x: monthIndex(p.period), v: p.value }));

export function flightsChart(air: IndexPoint[], tour: IndexPoint[] | null, fx: IndexPoint[]) {
  const all = [...air, ...(tour ?? []), ...fx];
  const to = Math.max(...all.map((p) => monthIndex(p.period)));
  const from = Math.max(to - 35, Math.min(...all.map((p) => monthIndex(p.period))));
  const inRange = (list: IndexPoint[]) => list.filter((p) => monthIndex(p.period) >= from).sort((a, b) => a.period.localeCompare(b.period));
  const airVals = inRange(air);
  const tourVals = tour ? inRange(tour) : [];
  const fxVals = inRange(fx);
  const lines: { id: SeriesId; vals: IndexPoint[] }[] = [
    { id: "air", vals: airVals },
    ...(tourVals.length > 0 ? [{ id: "tour" as const, vals: tourVals }] : []),
    ...(fxVals.length > 0 ? [{ id: "fx" as const, vals: fxVals }] : []),
  ];
  // 지수 눈금(왼쪽 위 숫자) — 항공료 · 단체여행비가 함께 쓰는 10 단위 눈금
  const idxVals = [...airVals, ...tourVals].map((p) => p.value);
  const yMin = Math.floor((Math.min(...idxVals) - 2) / 10) * 10;
  const yMax = Math.ceil((Math.max(...idxVals) + 3) / 5) * 5;
  // 원/달러 눈금 — 선이 위아래 10% 여백 안에 들어오게 · 같은 가로선에 원 환산 값을 회색으로
  const fxNums = fxVals.map((p) => p.value);
  const fxLo = fxNums.length ? Math.min(...fxNums) : 0;
  const fxHi = fxNums.length ? Math.max(...fxNums) : 1;
  const fxPad = (fxHi - fxLo || 1) * 0.12;
  const y2 = fxVals.length > 0 ? { min: fxLo - fxPad, max: fxHi + fxPad } : undefined;
  const ticks = Array.from({ length: Math.floor((yMax - yMin) / 10) + 1 }, (_, i) => yMin + i * 10).map((v) => ({
    v,
    t: String(v),
    s: y2 ? `${numberText(Math.round((y2.min + ((v - yMin) / (yMax - yMin)) * (y2.max - y2.min)) / 10) * 10)}원` : undefined,
  }));
  const series: ChartSeries[] = [
    ...(fxVals.length > 0 ? [{ id: "fx", color: COLOR.fx, points: pts(fxVals), axis: "y2" as const, dash: "6 6", width: 2.2, maxStep: 1, end: { label: END_NAME.fx, value: Math.round(lastOf(fxVals)), digits: 0, unit: "원" } }] : []),
    ...(tourVals.length > 0 ? [{ id: "tour", color: COLOR.tour, points: pts(tourVals), area: 0.22, maxStep: 1, end: { label: END_NAME.tour, value: lastOf(tourVals), digits: 1 } }] : []),
    { id: "air", color: COLOR.air, points: pts(airVals), area: 0.3, maxStep: 1, end: { label: END_NAME.air, value: lastOf(airVals), digits: 1 } },
  ];
  // 최고 · 최저 점은 항공료 선 위 — 글은 받은 값(seriesStats · extremeTexts)
  const stats = seriesStats(airVals);
  const texts = stats ? extremeTexts(stats) : null;
  const marks: ChartMark[] = [];
  if (stats && texts) {
    const iMax = airVals.findIndex((p) => p.period === stats.max.period);
    const iMin = airVals.findIndex((p) => p.period === stats.min.period);
    if (iMax !== iMin) marks.push({ series: "air", index: iMax, kind: "max", text: texts.max, short: `최고 ${stats.max.value.toFixed(1)}`, place: "top", tone: "red" });
    marks.push({ series: "air", index: iMin, kind: "min", text: texts.min, short: `최저 ${stats.min.value.toFixed(1)}`, place: "below", tone: "sun" });
  }
  return {
    lines,
    label: `국제항공료 · 해외단체여행비 지수와 원/달러 월평균 선 그래프 (${airVals[0]?.period} ~ ${airVals.at(-1)?.period})`,
    x: [from, to] as [number, number],
    y: { min: yMin, max: yMax, ticks },
    y2,
    xTicks: monthTicks(from, to).map((t) => ({ x: t.idx, label: t.period, short: shortPeriod(t.period) })),
    series,
    marks,
  };
}

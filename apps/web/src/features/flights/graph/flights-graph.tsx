"use client";

// /flights 그래프 — 새 디자인(작업 0218 · 시안 F): 공통 2D 선 그래프(LineChart · 0216) — 국제항공료(울트라마린 · 면 · 최고/최저 점) · 해외단체여행비(청록 · 면) · 원/달러 월평균(점선 · 오른쪽 눈금) · 끝 큰 숫자 말풍선 · 순서 움직임(한 번)
// 지수 두 선은 같은 눈금(왼쪽 위 숫자) · 원/달러는 자기 눈금(아래 회색 숫자 = 같은 가로선의 원 환산) — 점은 모두 받은 실제 값 · 값이 없는 선은 그리지 않고 말풍선도 없음
// 배치는 그대로 — 안내 글 · 그래프 · 범례 칩(누르면 그 선만 강조 · 칩에 최근 값) / 3D 비행기는 2D 결정으로 이 그래프에서 뺌 (비행기 부품 파일은 그대로)
import { LineChart, type ChartMark, type ChartSeries } from "@hav/ui/data/line-chart";
import { numberText } from "@hav/shared/format";
import { useFlightsGraph } from "./use-flights-graph";
import { INDEX_BASE_NOTE, type SeriesId, UNIT_NOTE, extremeTexts, monthTicks, seriesStats } from "./flights-graph-view";
import type { IndexPoint } from "../travel-index";

const idx = (period: string) => Number(period.slice(0, 4)) * 12 + Number(period.slice(5, 7)) - 1;
/** "2025-05" → "25.05" (휴대폰 눈금) */
const shortPeriod = (p: string) => `${p.slice(2, 4)}.${p.slice(5, 7)}`;

const COLOR = { air: "var(--hav-pin-cheap)", tour: "var(--hav-band)", fx: "color-mix(in srgb, var(--hav-pin-line) 62%, var(--hav-card))" } as const;
const END_NAME: Record<SeriesId, string> = { air: "국제항공료", tour: "단체여행비", fx: "원/달러" };
/** 범례는 선 이름만 — 숫자는 그래프 끝 말풍선 · 오른쪽 칸에 있음 (작업 0261 · legendText 는 lib 에 그대로 둠) */
const LEGEND_NAME: Record<SeriesId, string> = { air: "국제항공료", tour: "해외단체여행비", fx: "원/달러 월평균" };

export function FlightsGraph({ air, tour, fx }: { air: IndexPoint[]; tour: IndexPoint[] | null; fx: IndexPoint[] }) {
  const { focus, toggle } = useFlightsGraph();
  // 최근 36개월 안에서 세 선이 같은 가로축을 씀
  const all = [...air, ...(tour ?? []), ...fx];
  const to = Math.max(...all.map((p) => idx(p.period)));
  const from = Math.max(to - 35, Math.min(...all.map((p) => idx(p.period))));
  const inRange = (pts: IndexPoint[]) => pts.filter((p) => idx(p.period) >= from).sort((a, b) => a.period.localeCompare(b.period));
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
  const mk = (id: SeriesId, vals: IndexPoint[]) => vals.map((p) => ({ x: idx(p.period), v: p.value }));
  const lastOf = (vals: IndexPoint[]) => vals[vals.length - 1].value;
  const series: ChartSeries[] = [
    ...(fxVals.length > 0 ? [{ id: "fx", color: COLOR.fx, points: mk("fx", fxVals), axis: "y2" as const, dash: "6 6", width: 2.2, maxStep: 1, end: { label: END_NAME.fx, value: Math.round(lastOf(fxVals)), digits: 0, unit: "원" } }] : []),
    ...(tourVals.length > 0 ? [{ id: "tour", color: COLOR.tour, points: mk("tour", tourVals), area: 0.22, maxStep: 1, end: { label: END_NAME.tour, value: lastOf(tourVals), digits: 1 } }] : []),
    { id: "air", color: COLOR.air, points: mk("air", airVals), area: 0.3, maxStep: 1, end: { label: END_NAME.air, value: lastOf(airVals), digits: 1 } },
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
  const label = `국제항공료 · 해외단체여행비 지수와 원/달러 월평균 선 그래프 (${airVals[0]?.period} ~ ${airVals.at(-1)?.period})`;
  return (
    <div>
      <p className="text-small text-fg-2">
        {INDEX_BASE_NOTE} · {UNIT_NOTE}
      </p>
      <div data-testid="travel-graph" className="mt-3">
        <LineChart
          aria={label}
          x={[from, to]}
          y={{ min: yMin, max: yMax, ticks }}
          y2={y2}
          xTicks={monthTicks(from, to).map((t) => ({ x: t.idx, label: t.period, short: shortPeriod(t.period) }))}
          series={series}
          marks={marks}
          focus={focus}
          height={400}
          heightPhone={320}
        />
      </div>
      {/* 범례 — 칩을 누르면 그 선만 강조 (다시 누르면 원래대로) · 칩에는 선 이름만 (작업 0261) */}
      <ul data-testid="travel-legend" className="mt-3 flex flex-wrap gap-2 text-small text-fg max-sm:gap-y-3">
        {lines.map((l) => (
          <li key={l.id}>
            <button type="button" aria-pressed={focus === l.id} onClick={() => toggle(l.id)} className={`tap-44 flex items-center gap-2 rounded-pill border-2 px-3 py-1 transition-colors ${focus === l.id ? "border-cheap bg-card font-semibold" : "border-line hover:bg-surface-2"}`}>
              {l.id === "fx" ? <span aria-hidden className="inline-block w-5 border-t-2 border-dashed border-fg-2" /> : <span aria-hidden className={`inline-block h-1 w-5 rounded-pill ${l.id === "air" ? "bg-cheap" : "bg-band"}`} />}
              <span>{LEGEND_NAME[l.id]}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

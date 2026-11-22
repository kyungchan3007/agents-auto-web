// 선 그래프 배치 — 여백 · 눈금 · 선 모양 · 끝 말풍선 자리 · 시간표 (작업 0216 · 0312 에 line-chart.tsx 에서 옮김) · 순수 함수
import { breakRuns, chartSchedule, fmtNum, monotonePath, stackBubbles, textWidth } from "./line-chart";

export type ChartSeries = {
  id: string;
  /** CSS 색 (토큰 var(--hav-…)) */
  color: string;
  points: { x: number; v: number }[];
  axis?: "y" | "y2";
  /** 선 아래 면의 진하기(0~1) · 없으면 면 없음 */
  area?: number;
  /** 점선 모양 (예 "6 6") */
  dash?: string;
  width?: number;
  /** 가로 간격이 이보다 크면 선을 끊음(없는 달을 잇지 않음) */
  maxStep?: number;
  /** 선 끝 말풍선 — 이름 · 숫자(카운트업) */
  end?: { label: string; value: number; digits?: number; unit?: string };
};
export type ChartMark = { series: string; index: number; kind: "max" | "min"; text: string; short?: string; place: "top" | "below" | "left"; tone: "red" | "sun" | "navy" };
export type ChartRef = { v: number; axis?: "y" | "y2"; text: string; short?: string; at?: "left" | "right"; tone?: "sub" | "navy" };
export type ChartTick = { v: number; t?: string; s?: string; on?: boolean };

export type LineChartProps = {
  aria: string;
  /** 가로 값의 처음 · 끝 (달 번호 · 날짜 시각 등 숫자) */
  x: [number, number];
  y: { min: number; max: number; ticks: ChartTick[] };
  y2?: { min: number; max: number };
  xTicks: { x: number; label: string; short?: string }[];
  series: ChartSeries[];
  marks?: ChartMark[];
  refs?: ChartRef[];
  height?: number;
  heightPhone?: number;
  pad?: { l?: number; r?: number; t?: number; b?: number };
  padPhone?: { l?: number; r?: number; t?: number; b?: number };
  /** 이 선만 또렷하게 (나머지는 옅게) — 범례 칩을 눌렀을 때 */
  focus?: string | null;
  className?: string;
};

/** 그래프 칸 너비 — 좁아도 280 */
export const chartWidth = (measured: number) => Math.max(280, measured);

export function lineChartLayout({ W, x: xr, y, y2, xTicks, series, marks = [], height = 400, heightPhone = 320, pad, padPhone }: Pick<LineChartProps, "x" | "y" | "y2" | "xTicks" | "series" | "marks" | "height" | "heightPhone" | "pad" | "padPhone"> & { W: number }) {
  const phone = W < 560;
  const H = phone ? heightPhone : height;
  const p0 = phone ? { l: 48, r: 70, t: 40, b: 30 } : { l: 62, r: 150, t: 44, b: 36 };
  const pp = { ...p0, ...(phone ? padPhone : pad) };

  // 끝 말풍선 크기 — 글자 폭을 어림해 오른쪽 여백을 정함
  const numSize = phone ? 15 : 22;
  const ends = series
    .filter((s) => s.end && s.points.length > 0)
    .map((s) => {
      const e = s.end as NonNullable<ChartSeries["end"]>;
      const numTxt = fmtNum(e.value, e.digits ?? 0) + (e.unit ?? "");
      const nw = textWidth(numTxt, numSize, true);
      const cw = phone ? 0 : textWidth(e.label, 12, true);
      return { s, e, numTxt, w: Math.ceil(Math.max(nw, cw)) + (phone ? 16 : 24), h: phone ? 26 : 50 };
    });
  const maxEnd = ends.reduce((a, b) => Math.max(a, b.w), 0);
  const L = pp.l;
  const R = W - Math.max(pp.r, maxEnd + (phone ? 18 : 26));
  const T = pp.t;
  const B = H - pp.b;
  const PW = R - L;
  const PH = B - T;
  const X = (v: number) => L + (xr[1] === xr[0] ? 0.5 : (v - xr[0]) / (xr[1] - xr[0])) * PW;
  const mkY = (ax: { min: number; max: number }) => (v: number) => B - (ax.max === ax.min ? 0.5 : (v - ax.min) / (ax.max - ax.min)) * PH;
  const Y = mkY(y);
  const Y2 = y2 ? mkY(y2) : Y;
  const yOf = (axis?: "y" | "y2") => (axis === "y2" ? Y2 : Y);

  const shapes = series.map((s, k) => {
    const Ys = yOf(s.axis);
    const pts = s.points.map((p) => ({ x: X(p.x), y: Ys(p.v) }));
    const step = s.maxStep === undefined ? Number.POSITIVE_INFINITY : (s.maxStep / (xr[1] - xr[0] || 1)) * PW + 0.5;
    const runs = breakRuns(pts, step);
    return { s, k, pts, runs, d: runs.map((r) => monotonePath(r.map((p) => [p.x, p.y]))).join(""), minY: Math.min(...pts.map((p) => p.y), B) };
  });
  // 최고 · 최저 점이 나타나는 때 = 선 머리(왼쪽 → 오른쪽 · 가로 비율)가 그 자리를 지날 때
  const marksBySeries = shapes.map((sh) => marks.filter((m) => m.series === sh.s.id && sh.pts[m.index]));
  // 날짜 눈금 — 글자끼리 겹치면 끝쪽부터 남기고 사이를 건너뜀 (처음 · 끝은 늘 남김)
  const labelOf = (t: { label: string; short?: string }) => (phone && t.short ? t.short : t.label);
  const xt = thinTicks(xTicks.map((t) => ({ ...t, w: textWidth(labelOf(t), 12) + 10 })), (v) => X(v));
  const sched = chartSchedule({
    series: shapes.map((sh, k) => ({ marks: marksBySeries[k].map((m) => (sh.pts[m.index].x - L) / PW), area: sh.s.area !== undefined })),
  });
  const placedEnds = ends.map((en) => {
    const k = shapes.findIndex((q) => q.s.id === en.s.id);
    return { en, k, last: shapes[k]?.pts[shapes[k].pts.length - 1] };
  });
  const cy = stackBubbles(
    placedEnds.map((p) => p.last?.y ?? 0),
    placedEnds.map((p) => p.en.h),
    H,
    6,
  );
  return { phone, H, pp, L, R, T, B, PW, PH, X, Y, Y2, yOf, ends, shapes, marksBySeries, labelOf, xt, sched, placedEnds, cy, numSize };
}

/** 눈금 솎기 — 끝(오른쪽)에서부터 글자 칸이 이웃과 겹치지 않는 것만 남김 · 처음은 늘 남김(겹치면 바로 안쪽 것을 뺌) */
function thinTicks<T extends { x: number; w: number }>(ticks: T[], px: (x: number) => number): T[] {
  if (ticks.length <= 2) return ticks;
  const sorted = [...ticks].sort((a, b) => a.x - b.x);
  const first = sorted[0];
  const kept: T[] = [sorted[sorted.length - 1]];
  for (let i = sorted.length - 2; i >= 1; i--) {
    const t = sorted[i];
    const edge = kept[kept.length - 1];
    if (px(edge.x) - px(t.x) >= (edge.w + t.w) / 2 && px(t.x) - px(first.x) >= (first.w + t.w) / 2) kept.push(t);
  }
  kept.push(first);
  return kept.reverse();
}

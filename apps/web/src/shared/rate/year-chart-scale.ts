// 1년 흐름 그래프 좌표 — 순수 함수 (테스트 있음) · 받은 날만 잇고 빈 날은 만들지 않음 (FX-02)
import { rangeOf } from "@hav/shared/currency";
import { numberText } from "@hav/shared/format";
import { placeExtremeLabels } from "@hav/ui/lib/chart/extreme-labels";

type Day = { date: string; baseRate: number };
export type Dot = { x: number; y: number; date: string; value: number };

export function chartOf(rates: Day[], w: number, h: number, pad = 8): { path: string; min: Dot; max: Dot; last: Dot } | null {
  const r = rangeOf(rates);
  if (!r || r.count < 2) return null;
  const sorted = [...rates].sort((a, b) => a.date.localeCompare(b.date));
  const t0 = Date.parse(r.first.date);
  const span = Math.max(1, Date.parse(r.last.date) - t0);
  const lo = r.min.baseRate;
  const hi = r.max.baseRate;
  const x = (d: string) => pad + ((Date.parse(d) - t0) / span) * (w - pad * 2);
  // 값이 모두 같으면 가운데 한 줄
  const y = (v: number) => (hi === lo ? h / 2 : pad + (1 - (v - lo) / (hi - lo)) * (h - pad * 2));
  const dot = (d: Day): Dot => ({ x: round(x(d.date)), y: round(y(d.baseRate)), date: d.date, value: d.baseRate });
  const path = sorted.map((d, i) => `${i ? "L" : "M"}${round(x(d.date))},${round(y(d.baseRate))}`).join(" ");
  return { path, min: dot(r.min), max: dot(r.max), last: dot(r.last) };
}

const round = (n: number) => Math.round(n * 10) / 10;

const fmt = (n: number) => numberText(n, { maximumFractionDigits: 2 });

/** 1년 흐름 그래프에 그릴 값 (작업 0109 · 0170 · 0175 · 0312 에 year-chart.tsx 에서 옮김) — 기록이 모자라면 null */
export function yearChartView(o: { rates: { date: string; baseRate: number }[]; unitText: string; title: string; average?: number; compact: boolean; extremeText?: { max: string; min: string }; W: number; H: number; pw: number; padY: number }) {
  const c = chartOf(o.rates, o.W, o.H, 10);
  if (!c) return null;
  // 평균 점선 위치 — chartOf 와 같은 눈금(최저 ~ 최고)으로
  const lo = c.min.value;
  const hi = c.max.value;
  const avgY = o.average === undefined || !Number.isFinite(o.average) ? null : hi === lo ? o.H / 2 : 10 + (1 - (o.average - lo) / (hi - lo)) * (o.H - 20);
  const label = `${o.title} — 최저 ${c.min.date} ${fmt(c.min.value)} · 최고 ${c.max.date} ${fmt(c.max.value)} · 마지막 ${c.last.date} ${fmt(c.last.value)} ${o.unitText}`;
  const texts = o.extremeText ?? (o.compact ? null : { max: `최고 ${fmt(c.max.value)}`, min: `최저 ${fmt(c.min.value)}` });
  // 라벨은 화면 픽셀 기준으로 놓음 — 그래프(SVG)는 폭에 맞춰 같은 비율로 줄어듦
  const s = o.pw / o.W;
  const px = (d: { x: number; y: number }) => ({ x: d.x * s, y: d.y * s });
  const placed = texts ? placeExtremeLabels({ max: { ...px(c.max), text: texts.max }, min: { ...px(c.min), text: texts.min }, today: px(c.last), bounds: { left: 0, top: -o.padY, right: o.pw, bottom: o.H * s + o.padY } }) : null;
  return { c, avgY, label, texts, placed };
}

/** 라벨 가로 기준 — 양 끝은 anchor 로 한쪽에 붙어 칸 밖으로 안 나감 */
export const labelShift = (anchor: "start" | "middle" | "end") => (anchor === "start" ? "0%" : anchor === "end" ? "-100%" : "-50%");

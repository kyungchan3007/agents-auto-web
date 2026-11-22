// 원/달러 · 수입물가지수 그래프에 넘길 값 (작업 0208 · 0312 에 import-price-section.tsx 에서 옮김) · 순수 함수
//   두 값이 모두 있는 첫 달을 100 으로 — 선 모양만 맞춰 비교 (끝 말풍선 숫자는 실제 값)
import { monthIndex, periodOfIndex, shortPeriod } from "@hav/shared/date";

type Row = { period: string; fx: number | null; price: number | null };
type Pt = { x: number; v: number; raw: number; period: string };

/** 가로 눈금 — 처음 · 끝을 포함해 고르게 5개(달이 5개 미만이면 달마다) */
export function monthAxis(first: number, last: number): { x: number; label: string; short: string }[] {
  const n = Math.min(5, last - first + 1);
  return Array.from({ length: n }, (_, i) => {
    const x = n === 1 ? first : Math.round(first + ((last - first) * i) / (n - 1));
    const p = periodOfIndex(x);
    return { x, label: p, short: shortPeriod(p) };
  });
}

export function importPriceChart(rows: Row[]) {
  const first = rows[0];
  const last = rows[rows.length - 1];
  if (!first || !last) return null;
  const base = rows.find((r) => r.fx !== null && r.price !== null);
  const norm = (key: "fx" | "price"): Pt[] => rows.flatMap((r) => (r[key] !== null && base?.[key] ? [{ x: monthIndex(r.period), v: ((r[key] as number) / (base[key] as number)) * 100, raw: r[key] as number, period: r.period }] : []));
  const fx = norm("fx");
  const price = norm("price");
  const all = [...fx, ...price].map((p) => p.v);
  const range = Math.max(...all) - Math.min(...all) || 1;
  const lo = Math.min(...all) - range * 0.06;
  const hi = Math.max(...all) + range * 0.06;
  const x0 = monthIndex(first.period);
  const x1 = monthIndex(last.period);
  const lastOf = (pts: Pt[]) => pts[pts.length - 1]!;
  return {
    base: base?.period ?? null,
    aria: `원/달러 월평균과 수입물가지수 — ${first.period}부터 ${last.period}까지, ${base?.period}을 100으로 맞춤`,
    x: [x0, x1] as [number, number],
    y: { min: lo, max: hi, ticks: Array.from({ length: 6 }, (_, i) => ({ v: lo + ((hi - lo) * i) / 5 })) },
    xTicks: monthAxis(x0, x1),
    series: [
      ...(price.length ? [{ id: "price", color: "var(--hav-band)", points: price, area: 0.22, maxStep: 1, end: { label: `수입물가 ${lastOf(price).period}`, value: lastOf(price).raw, digits: 2 } }] : []),
      ...(fx.length ? [{ id: "fx", color: "var(--hav-pin-cheap)", points: fx, area: 0.3, maxStep: 1, end: { label: `원/달러 ${lastOf(fx).period}`, value: Math.round(lastOf(fx).raw), digits: 0, unit: "원" } }] : []),
    ],
    refs: base ? [{ v: 100, text: `${base.period} = 100`, short: "= 100", tone: "navy" as const }] : [],
  };
}

// 수입물가 영역 — 원/달러 월평균과 한국은행 수입물가지수(원화기준 · 2020=100)를 한 차트에 (작업 0165)
//   두 값의 단위가 달라 "처음 같은 달 = 100" 으로 맞춰 겹쳐 그림 · 숫자는 아래 표로도 (색 · 그림만으로 전하지 않음) · 자료가 없으면 "준비 중"
import { type FxDay, type MonthPoint, importPriceView } from "../lib/import-price";

const W = 600;
const H = 180;
const PAD = 10;

export function ImportPriceSection({ fxRows, price }: { fxRows: FxDay[] | null; price: MonthPoint[] | null }) {
  const v = importPriceView(fxRows, price);
  return (
    <section data-testid="import-price-section" className="min-w-0 rounded-card bg-card px-6 py-6" aria-labelledby="import-price-title">
      <h2 id="import-price-title" className="font-display text-[1.625rem] leading-tight font-normal text-cheap">
        수입물가와 환율
      </h2>
      <p className="mt-2 text-body text-fg-2">환율이 오르면 수입물가도 따라 오릅니다 (한국은행)</p>
      {v.kind === "preparing" ? <p className="mt-2 text-body text-fg-2">준비 중 — 수입물가지수를 아직 받지 못했습니다</p> : <Chart rows={v.rows} />}
    </section>
  );
}

function Chart({ rows }: { rows: { period: string; fx: number | null; price: number | null }[] }) {
  // 두 값이 모두 있는 첫 달을 100 으로
  const base = rows.find((r) => r.fx !== null && r.price !== null);
  const idx = rows.map((r) => ({ period: r.period, fx: r.fx !== null && base?.fx ? (r.fx / base.fx) * 100 : null, price: r.price !== null && base?.price ? (r.price / base.price) * 100 : null }));
  const all = idx.flatMap((r) => [r.fx, r.price]).filter((n): n is number => n !== null);
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const x = (i: number) => PAD + (rows.length === 1 ? 0.5 : i / (rows.length - 1)) * (W - PAD * 2);
  const y = (n: number) => (hi === lo ? H / 2 : PAD + (1 - (n - lo) / (hi - lo)) * (H - PAD * 2));
  // 비어 있는 달은 잇지 않고 끊음
  const path = (key: "fx" | "price") => idx.map((r, i) => (r[key] === null ? "" : `${idx[i - 1]?.[key] == null ? "M" : "L"}${x(i).toFixed(1)},${y(r[key] as number).toFixed(1)}`)).join(" ");
  const last = rows[rows.length - 1];
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`원/달러 월평균과 수입물가지수 — ${rows[0].period}부터 ${last.period}까지, 처음 같은 달을 100으로 맞춤`} className="mt-4 block h-auto w-full overflow-visible">
        <path d={path("fx")} fill="none" stroke="var(--hav-cheap)" strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d={path("price")} fill="none" stroke="var(--hav-band)" strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}

// 수입물가 영역 — 원/달러 월평균과 한국은행 수입물가지수(원화기준 · 2020=100)를 한 차트에 (작업 0165)
//   두 값의 단위가 달라 "처음 같은 달 = 100" 으로 맞춰 겹쳐 그림 · 숫자는 아래 표로도 (색 · 그림만으로 전하지 않음) · 자료가 없으면 "준비 중"
import { numberText } from "@hav/shared/format";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { type FxDay, type MonthPoint, importPriceView } from "../lib/import-price";

const W = 600;
const H = 180;
const PAD = 10;
const fmt = (n: number) => numberText(n, { maximumFractionDigits: 1 });

export function ImportPriceSection({ fxRows, price }: { fxRows: FxDay[] | null; price: MonthPoint[] | null }) {
  const v = importPriceView(fxRows, price);
  return (
    <section className="mt-16" aria-labelledby="import-price-title">
      <h2 id="import-price-title" className="text-title font-semibold tracking-tight">
        환율과 수입물가
      </h2>
      <p className="mt-2 text-sm text-fg-2">환율이 오르면 수입품 가격도 따라 오르는 경향이 있습니다. 원/달러 월평균과 수입물가지수를 같은 달끼리 겹쳐 놓았습니다.</p>
      <div className="mt-6">
        {v.kind === "preparing" ? (
          <EmptyState title="준비 중">수입물가지수를 아직 받지 못했습니다. 받으면 이 자리에 환율과 겹친 그래프가 표시됩니다.</EmptyState>
        ) : (
          <Chart rows={v.rows} />
        )}
      </div>
      <p className="mt-4 text-xs text-fg-2">출처: 한국은행 ECOS 에서 제공된 정보 (수입물가지수 · 총지수 · 원화기준 · 2020년 = 100) · 원/달러는 수출입은행 월평균 · 발표가 늦어 최근 달은 비어 있을 수 있습니다</p>
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
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`원/달러 월평균과 수입물가지수 — ${rows[0].period}부터 ${last.period}까지, 처음 같은 달을 100으로 맞춤`} className="block h-auto w-full overflow-visible">
        <path d={path("fx")} fill="none" stroke="var(--hav-accent)" strokeWidth={2} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        <path d={path("price")} fill="none" stroke="var(--hav-expensive)" strokeWidth={2} strokeDasharray="6 4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-fg-2">
        <span>
          <span className="font-semibold text-accent">━</span> 원/달러 월평균
        </span>
        <span>
          <span className="font-semibold text-expensive">╍</span> 수입물가지수
        </span>
        <span>처음 같은 달 = 100 으로 맞춘 선</span>
      </p>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer font-semibold text-fg">달별 숫자 보기</summary>
        <table className="mt-3 w-full text-left text-xs">
          <thead className="text-fg-2">
            <tr>
              <th className="py-1 pr-4 font-normal">달</th>
              <th className="py-1 pr-4 font-normal">원/달러 월평균</th>
              <th className="py-1 font-normal">수입물가지수 (2020=100)</th>
            </tr>
          </thead>
          <tbody>
            {[...rows].reverse().map((r) => (
              <tr key={r.period} className="border-t border-line">
                <td className="py-1 pr-4">{r.period}</td>
                <td className="py-1 pr-4">{r.fx === null ? "—" : `${fmt(r.fx)}원`}</td>
                <td className="py-1">{r.price === null ? "—" : fmt(r.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

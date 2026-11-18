// 수입물가 영역 — 새 디자인(작업 0221 · 시안 A): 왼쪽 제목 · 숫자 카드 두 장(카운트업) / 오른쪽 그래프 + 이번 주 과세환율(children) · 원/달러 월평균과 한국은행 수입물가지수(원화기준 · 2020=100)를 한 차트에 (작업 0165)
//   두 값의 단위가 달라 "처음 같은 달 = 100" 으로 맞춰 겹쳐 그림 · 숫자는 아래 표로도 (색 · 그림만으로 전하지 않음) · 자료가 없으면 "준비 중"
import { numberText } from "@hav/shared/format";
import { CountUp } from "@hav/ui/motion/count-up";
import { SectionTitle } from "@hav/ui/text/heading";
import type { ReactNode } from "react";
import { type FxDay, type Kpi, type MonthPoint, deltaTone, importPriceKpis, importPriceView, kpiDigits } from "../lib/import-price";

const W = 600;
const H = 200;
const PAD = 10;
/** 선 끝 금액을 놓을 오른쪽 여백 (viewBox 폭 기준) */
const RIGHT = 90;

export function ImportPriceSection({ fxRows, price, children }: { fxRows: FxDay[] | null; price: MonthPoint[] | null; /** 그래프 아래 오른쪽 칸에 놓을 것 (이번 주 과세환율) */ children?: ReactNode }) {
  const v = importPriceView(fxRows, price);
  return (
    <section data-testid="import-price-section" className="grid min-w-0 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-10" aria-labelledby="import-price-title">
      <div className="min-w-0">
        <SectionTitle id="import-price-title" className="text-[1.875rem] leading-tight text-fg">
          수입물가와 환율
        </SectionTitle>
        <p className="mt-2 max-w-md text-body text-fg-2">환율이 오르면 수입물가도 따라 오릅니다 (한국은행)</p>
        {v.kind === "ready" && <Kpis rows={v.rows} />}
      </div>
      <div className="min-w-0 border-t-2 border-line pt-4">
        {v.kind === "preparing" ? <p className="text-body text-fg-2">준비 중 — 수입물가지수를 아직 받지 못했습니다</p> : <Chart rows={v.rows} />}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

const signed = (n: number, d: number) => `${n > 0 ? "+" : ""}${numberText(n, { maximumFractionDigits: d })}`;
const TONE_DOT = { up: "bg-pin-expensive", down: "bg-pin-cheap", flat: "bg-pin-line" } as const;

// 숫자 카드 두 장 — 수입물가지수 · 원/달러 월평균의 가장 최근 달과 전달보다 (작업 0200 → 0221 카운트업 · 점 + 글)
function Kpis({ rows }: { rows: { period: string; fx: number | null; price: number | null }[] }) {
  const k = importPriceKpis(rows);
  const items: { key: string; label: string; k: Kpi | null; digits: (n: number) => number; suffix: string; delta: (n: number) => string }[] = [
    { key: "price", label: "수입물가지수", k: k.price, digits: (n) => kpiDigits(n), suffix: "", delta: (n) => signed(n, 2) },
    { key: "fx", label: "원/달러 월평균", k: k.fx, digits: () => 0, suffix: "원", delta: (n) => `${signed(n, 0)}원` },
  ];
  return (
    <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-1">
      {items.map((i) => {
        if (!i.k) return null;
        const tone = deltaTone(i.k.delta);
        return (
          <div key={i.key} data-testid="import-kpi" className="min-w-0 rounded-[1.25rem] border border-line bg-card px-4 py-4 sm:px-5">
            <p className="text-small text-fg-2">
              {i.label} ({i.k.period})
            </p>
            <p className="mt-1 text-[1.625rem] leading-tight font-extrabold tracking-display text-fg tabular-nums sm:text-[2rem]">
              <CountUp value={i.k.value} digits={i.digits(i.k.value)} suffix={i.suffix} />
            </p>
            {i.k.delta !== null && tone && (
              <p className="mt-1 flex items-center gap-2 text-small font-semibold text-fg">
                <span data-testid="import-kpi-dot" aria-hidden className={`size-2 shrink-0 rounded-full ${TONE_DOT[tone]}`} />
                전달보다 {i.delta(i.k.delta)}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Chart({ rows }: { rows: { period: string; fx: number | null; price: number | null }[] }) {
  // 두 값이 모두 있는 첫 달을 100 으로
  const base = rows.find((r) => r.fx !== null && r.price !== null);
  const idx = rows.map((r) => ({ period: r.period, fx: r.fx !== null && base?.fx ? (r.fx / base.fx) * 100 : null, price: r.price !== null && base?.price ? (r.price / base.price) * 100 : null }));
  const all = idx.flatMap((r) => [r.fx, r.price]).filter((n): n is number => n !== null);
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  const x = (i: number) => PAD + (rows.length === 1 ? 0.5 : i / (rows.length - 1)) * (W - PAD * 2 - RIGHT);
  const y = (n: number) => (hi === lo ? H / 2 : PAD + (1 - (n - lo) / (hi - lo)) * (H - PAD * 2));
  // 비어 있는 달은 잇지 않고 끊음
  const path = (key: "fx" | "price") => idx.map((r, i) => (r[key] === null ? "" : `${idx[i - 1]?.[key] == null ? "M" : "L"}${x(i).toFixed(1)},${y(r[key] as number).toFixed(1)}`)).join(" ");
  const last = rows[rows.length - 1];
  // 선 끝 — 각 값의 가장 최근 달 점과 금액 (HTML 글자라 휴대폰에서도 작아지지 않음)
  const end = (key: "fx" | "price") => {
    let i = idx.length - 1;
    while (i >= 0 && idx[i][key] === null) i--;
    return i < 0 ? null : { left: (x(i) / W) * 100, top: (y(idx[i][key] as number) / H) * 100, raw: rows[i][key] as number };
  };
  const ends = [
    { key: "fx" as const, color: "var(--hav-cheap)", e: end("fx"), text: (n: number) => `${numberText(n, { maximumFractionDigits: 0 })}원` },
    { key: "price" as const, color: "var(--hav-band)", e: end("price"), text: (n: number) => numberText(n, { maximumFractionDigits: 2 }) },
  ];
  return (
    <div>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-small text-fg-2">
        <span className="inline-flex items-center gap-2"><i className="inline-block h-1 w-5 rounded-pill" style={{ background: "var(--hav-cheap)" }} />원/달러 월평균</span>
        <span className="inline-flex items-center gap-2"><i className="inline-block h-1 w-5 rounded-pill" style={{ background: "var(--hav-band)" }} />수입물가지수</span>
        <span>· {rows.find((r) => r.fx !== null && r.price !== null)?.period} = 100 으로 맞춤</span>
      </p>
      {/* 그래프 높이 고정 — 넓은 화면 352px(340 ~ 380) · 휴대폰 224px · 글자는 HTML 이라 늘어나지 않음 (작업 0208) */}
      <div data-testid="import-chart" className="relative mt-3 h-56 sm:h-[22rem]">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`원/달러 월평균과 수입물가지수 — ${rows[0].period}부터 ${last.period}까지, 처음 같은 달을 100으로 맞춤`} preserveAspectRatio="none" className="block h-full w-full overflow-visible">
          <path d={path("fx")} fill="none" stroke="var(--hav-cheap)" strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          <path d={path("price")} fill="none" stroke="var(--hav-band)" strokeWidth={2.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        {ends.map((l) =>
          l.e ? (
            <span key={l.key} data-testid="import-end-label" className="absolute -translate-y-1/2 pl-2 text-small font-semibold whitespace-nowrap tabular-nums" style={{ left: `${l.e.left}%`, top: `${l.e.top}%`, color: l.color }}>
              ● {l.text(l.e.raw)}
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

// 수입물가 영역 — 새 디자인(작업 0221 · 시안 A · 그래프는 작업 0221 그래프 2D 시안 F: 공통 LineChart · 0216 — 면 · 눈금 · 2025-10 = 100 기준선 · 끝 말풍선 · 순서 움직임): 왼쪽 제목 · 숫자 카드 두 장(카운트업) / 오른쪽 그래프 + 이번 주 과세환율(children) · 원/달러 월평균과 한국은행 수입물가지수(원화기준 · 2020=100)를 한 차트에 (작업 0165)
//   두 값의 단위가 달라 "처음 같은 달 = 100" 으로 맞춰 겹쳐 그림 · 숫자는 아래 표로도 (색 · 그림만으로 전하지 않음) · 자료가 없으면 "준비 중"
import { numberText } from "@hav/shared/format";
import { LineChart } from "@hav/ui/data/line-chart";
import { CountUp } from "@hav/ui/motion/count-up";
import { SectionTitle } from "@hav/ui/text/heading";
import type { ReactNode } from "react";
import { type FxDay, type Kpi, type MonthPoint, deltaTone, importPriceKpis, importPriceView, kpiDigits } from "./import-price";
import { importPriceChart } from "./import-price-chart";

export function ImportPriceSection({ fxRows, price, children }: { fxRows: FxDay[] | null; price: MonthPoint[] | null; /** 그래프 아래 오른쪽 칸에 놓을 것 (이번 주 과세환율) */ children?: ReactNode }) {
  const v = importPriceView(fxRows, price);
  return (
    <section data-testid="import-price-section" className="grid min-w-0 gap-6 lg:grid-cols-[22rem_minmax(0,1fr)] lg:gap-10" aria-labelledby="import-price-title">
      <div className="min-w-0">
        <SectionTitle id="import-price-title" data-fu={1} className="text-[1.75rem] leading-tight text-fg">
          수입물가와 환율
        </SectionTitle>
        <p data-fu={2} className="mt-2 max-w-md text-body text-fg-2">환율이 오르면 수입물가도 따라 오릅니다 (한국은행)</p>
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
          <div key={i.key} data-testid="import-kpi" className="min-w-0 rounded-[1.5rem] border border-line bg-card px-4 py-4 sm:px-5">
            <p className="text-small text-fg-2">
              {i.label} ({i.k.period})
            </p>
            <p className="mt-1 text-[1.75rem] leading-tight font-bold tracking-display text-fg tabular-nums sm:text-[2.25rem]">
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
  const c = importPriceChart(rows);
  if (!c) return null;
  return (
    <div>
      <p className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-small text-fg-2">
        <span className="inline-flex items-center gap-2"><i className="inline-block h-1 w-5 rounded-pill" style={{ background: "var(--hav-cheap)" }} />원/달러 월평균</span>
        <span className="inline-flex items-center gap-2"><i className="inline-block h-1 w-5 rounded-pill" style={{ background: "var(--hav-band)" }} />수입물가지수</span>
        <span>· {c.base} = 100 으로 맞춤</span>
      </p>
      {/* 그래프 높이 고정 — 넓은 화면 400px · 휴대폰 280px (작업 0208 · 값이 바뀌어도 크기 고정) */}
      <div data-testid="import-chart" className="mt-3">
        <LineChart
          aria={c.aria}
          x={c.x}
          y={c.y}
          xTicks={c.xTicks}
          series={c.series}
          refs={c.refs}
          height={400}
          heightPhone={280}
          pad={{ l: 24 }}
          padPhone={{ l: 16, t: 32, b: 30 }}
        />
      </div>
    </div>
  );
}

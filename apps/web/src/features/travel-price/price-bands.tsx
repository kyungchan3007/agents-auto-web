"use client";

// 묶음별 나라 목록 — 지역 고르기 · 막대(가운데 선 = 한국) · 오늘 통화 신호 (색만으로 전하지 않고 글자도)
import { currencyName } from "@hav/shared/currency";
import type { Signal } from "@hav/shared/signal";
import { type Band, relativeText } from "@hav/shared/travel";
import { Flag } from "@hav/ui/flag";
import { SIGNAL_TEXT, signalLabel } from "@hav/ui/signal-badge";
import Link from "next/link";
import type { PriceBand } from "./bands";
import { usePriceBands } from "./use-price-bands";
import { FilterChip } from "@hav/ui/filter-chip";

const BAR: Record<Band, string> = { cheap: "bg-cheap", similar: "bg-normal", pricey: "bg-expensive" };

type Props = { bands: PriceBand[]; signalOf: Record<string, Signal | null>; latestYear?: number };

export function PriceBands({ bands, signalOf, latestYear }: Props) {
  const { region, setRegion, regions, koreaAt, barWidth, shown } = usePriceBands(bands);

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 text-xs" role="group" aria-label="지역">
        {[{ id: "all" as const, label: "전체" }, ...regions].map((r) => (
          <FilterChip key={r.id} active={region === r.id} onClick={() => setRegion(r.id)}>
            {r.label}
          </FilterChip>
        ))}
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        {shown.map((b) => (
          <section key={b.id} aria-labelledby={`band-${b.id}`} className="min-w-0 rounded-card border border-line p-5 sm:p-6">
            <h2 id={`band-${b.id}`} className="flex items-baseline justify-between gap-2 text-base font-semibold">
              {b.label}
              <span className="text-xs font-normal text-fg-2">{b.rows.length}곳</span>
            </h2>
            <ul className="mt-4 space-y-4">
              {b.rows.map((r) => {
                const signal = r.currency ? signalOf[r.currency] : null;
                return (
                  <li key={r.country} className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <Flag country={r.flag} label={`${r.name} 국기`} className="h-3.5 w-5 shrink-0" />
                      <span className="font-semibold">{r.name}</span>
                      <span className="ml-auto shrink-0 font-semibold tabular-nums">{relativeText(r.relative)}</span>
                    </div>
                    <div className="relative mt-1.5 h-1.5 rounded-pill bg-surface-2" aria-hidden>
                      <div className={`h-full rounded-pill ${BAR[r.band]}`} style={{ width: `${barWidth(r.relative)}%` }} />
                      <div className="absolute -top-1 -bottom-1 w-px bg-fg" style={{ left: `${koreaAt}%` }} />
                    </div>
                    <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-fg-2">
                      {r.year !== latestYear && <span>{r.year}년 자료</span>}
                      {r.currency && signal ? (
                        <Link href={`/currencies/${r.currency}`} className="hover:text-fg">
                          오늘 {currencyName(r.currency)} <span className={`font-semibold ${SIGNAL_TEXT[signal]}`}>{signalLabel(signal)}</span> →
                        </Link>
                      ) : null}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

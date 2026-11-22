"use client";

// 물가 구간 + 통화로 거르기 안내 (작업 0193) · 위에 물가 노선(작업 0230 — 정거장이 거른 목록의 맨 위 나라들을 따름) — /prices?currency=EUR 이면 그 통화 쓰는 나라만 · 안내와 "전체 보기" · 물가 자료가 없는 나라는 "물가 자료 없음"
import { MORE_LINK } from "@hav/ui/text/more-link";
import type { Signal } from "@hav/shared/signal";
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import Link from "next/link";
import { useCurrencyParam } from "./bands/use-currency-param";
import type { PriceBand } from "./bands/bands";
import { currencyFilter } from "./bands/currency-filter";
import { PriceBands } from "./bands/price-bands";
import { PriceRoute } from "./route/price-route";

type Props = { bands: PriceBand[]; missing: string[]; signalOf: Record<string, Signal | null>; percentileOf: Record<string, number | null>; latestYear?: number };

export function PriceView({ bands, missing, signalOf, percentileOf, latestYear }: Props) {
  const f = currencyFilter(bands, missing, useCurrencyParam());
  // 노선 정거장 = 지금 보이는 목록의 맨 위 나라들 (거르면 걸러진 목록 · 모르는 통화는 전체)
  const shown = f.kind === "filtered" ? f.bands : bands;
  const route = <PriceRoute bands={shown} signalOf={signalOf} percentileOf={percentileOf} latestYear={latestYear} />;
  if (f.kind === "all")
    return (
      <>
        {route}
        <div>
          <PriceBands bands={bands} signalOf={signalOf} percentileOf={percentileOf} latestYear={latestYear} />
        </div>
      </>
    );
  return (
    <>
      {route}
      <div>
      <div data-testid="price-filter" className="mb-6 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p role="status" className="text-body font-semibold text-fg">
          {f.notice}
        </p>
        <Link href="/prices" className={MORE_LINK}>
          전체 보기 ›
        </Link>
      </div>
      {f.kind === "unknown" ? (
        <PriceBands bands={bands} signalOf={signalOf} percentileOf={percentileOf} latestYear={latestYear} />
      ) : (
        <>
          {f.bands.length > 0 ? <PriceBands bands={f.bands} signalOf={signalOf} percentileOf={percentileOf} latestYear={latestYear} unfolded /> : <EmptyState>이 통화를 쓰는 나라의 물가 자료가 없습니다</EmptyState>}
          {f.noData.length > 0 && (
            <ul className="mt-4 space-y-1 text-small text-fg-2">
              {f.noData.map((iso) => (
                <li key={iso}>
                  {TRAVEL_COUNTRIES[iso]?.name ?? iso} · 물가 자료 없음
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      </div>
    </>
  );
}

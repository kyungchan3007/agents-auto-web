// 3 모든 통화 — 칸 전체가 통화 상세로 (작업 0096)
import { currencyName, percentileText, rateText } from "@hav/shared/currency";
import { Card } from "@hav/ui/card";
import { Section } from "@hav/ui/section";
import { SignalBadge } from "@hav/ui/signal-badge";
import { Tabs } from "@hav/ui/tabs";
import Link from "next/link";
import { CurrencyFlag as Flag } from "@hav/ui/currency-flag";
import { monthChangeText } from "./change";
import type { HomeView } from "./home-data";
import { EmptyState } from "@hav/ui/empty-state";

const CHANGE_TONE = { up: "text-expensive", down: "text-cheap", flat: "text-fg" } as const;

export function CurrenciesSection({ view }: { view: HomeView }) {
  const { rates, groups, bySignal, changeOf, windowDays, problem } = view;
  return (
    <Section id="currencies" surface="elevated" eyebrow={`모든 통화 · ${rates.length}개`} title={<>여행 · 직구 전에,<br />한 번에 확인합니다.</>}>
      {groups.length > 0 ? (
        <Tabs
          items={groups.map((g) => ({
            value: g.region,
            label: `${g.label} ${g.items.length}`,
            content: (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((r) => {
                  const s = bySignal.get(r.currency);
                  const t = rateText(r);
                  const ch = changeOf.get(r.currency);
                  const m = ch ? monthChangeText(ch.pct) : null;
                  return (
                    // 칸 전체가 통화 상세로 (작업 0096)
                    <Link key={r.currency} href={`/currencies/${r.currency}`} className="block rounded-card transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-accent">
                    <Card
                      title={
                        <span className="flex items-center gap-2">
                          <Flag currency={r.currency} />
                          {currencyName(r.currency)}
                          <span className="text-sm font-normal text-fg-2">{r.currency}</span>
                        </span>
                      }
                    >
                      <p className="text-3xl font-semibold tracking-tight text-fg">
                        {t.value}
                        <span className="ml-1 text-base font-medium text-fg-2">{t.unit}</span>
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {s?.signal && <SignalBadge signal={s.signal} />}
                        <span className="text-xs text-fg-2">{percentileText(s?.signal ?? null, s?.percentile ?? null, windowDays)}</span>
                      </div>
                      {m && (
                        <p className="mt-3 text-xs text-fg-2" title={`${ch?.from.date} → ${ch?.to.date}`}>
                          지난 1개월 <span className={`font-semibold ${CHANGE_TONE[m.tone]}`}>{m.text}</span>
                          <span className="sr-only"> ({m.label})</span>
                        </p>
                      )}
                    </Card>
                    </Link>
                  );
                })}
              </div>
            ),
          }))}
        />
      ) : (
        <EmptyState>{problem ?? "표시할 통화가 없습니다"}</EmptyState>
      )}
    </Section>
  );
}

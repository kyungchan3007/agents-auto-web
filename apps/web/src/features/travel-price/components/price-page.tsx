// 여행 물가 페이지 — 하늘 종이 바탕 · 큰 문장(물가가 가장 낮은 나라 + 세계은행 자료 연도) → 물가 구간 3칸 → 여행 하루 예산 (작업 0170 · Figma 04)
// 물가 · 환율 신호는 빌드 때 받은 값만 · 없으면 이유 (docs/domain/travel-price.md) · 숫자를 지어내지 않음
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import type { PriceLevels } from "@hav/shared/prices";
import type { SignalList } from "@hav/shared/signal";
import { TRAVEL_COUNTRIES, travelBands } from "@hav/shared/travel";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { pricesHeadline } from "../lib/prices-copy";
import { BudgetPlanner } from "./budget-planner";
import { PriceBands } from "./price-bands";

export function PricePage({ levels, signals }: { levels: Fetched<PriceLevels>; signals: Fetched<SignalList> }) {
  const data = levels.ok ? travelBands(levels.data) : null;
  const signalOf = Object.fromEntries((signals.ok ? signals.data.signals : []).map((s) => [s.currency, s.signal]));
  const percentileOf = Object.fromEntries((signals.ok ? signals.data.signals : []).map((s) => [s.currency, s.percentile]));
  const latestOf = Object.fromEntries((signals.ok ? signals.data.signals : []).map((s) => [s.currency, s.latest]));
  const rows = data ? data.bands.flatMap((b) => b.rows) : [];
  const headline = pricesHeadline(rows);

  return (
    <>
      <SiteNav page="prices" />
      <main className="bg-surface px-4 pt-8 pb-10 text-fg sm:px-8 sm:pt-10">
        <div className="mx-auto max-w-page">
          <Eyebrow>여행 물가</Eyebrow>
          <Title as="h1" size="page" className="mt-3 text-cheap">
            {headline ? headline.title : "여행 물가 자료를 받지 못했습니다"}
          </Title>
          <p className="mt-6 text-body text-fg-2">세계은행 나라별 물가 수준(한국 = 100)과 오늘 그 나라 통화 신호를 함께 봅니다.</p>

          <div className="mt-10">
            {data && data.bands.length > 0 ? (
              <PriceBands bands={data.bands} signalOf={signalOf} percentileOf={percentileOf} latestYear={data.years[0]} />
            ) : (
              <EmptyState>물가 자료를 받지 못했습니다 ({levels.ok ? "여행지 나라 자료 없음" : levels.reason})</EmptyState>
            )}
          </div>

          {data && data.bands.length > 0 && (
            <div className="mt-6">
              <BudgetPlanner rows={rows} latestOf={latestOf} />
            </div>
          )}

          {data && (data.missing.length > 0 || !signals.ok) && (
            <div className="mt-6 space-y-1 text-small text-fg-2">
              {data.missing.length > 0 && <p>자료가 없어 뺀 나라: {data.missing.map((c) => TRAVEL_COUNTRIES[c]?.name ?? c).join(" · ")}</p>}
              {!signals.ok && <p>오늘 환율 신호를 받지 못해 비워 두었습니다 ({signals.reason})</p>}
            </div>
          )}
        </div>
      </main>
      <PageFooter width="max-w-page">자료: 세계은행 물가 수준(PA.NUS.PRVT.PP ÷ PA.NUS.FCRF) · 한국수출입은행</PageFooter>
    </>
  );
}

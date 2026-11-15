// 여행 물가 페이지 — 하늘 종이 바탕 · 큰 문장(물가가 가장 낮은 나라 + 세계은행 자료 연도) → 물가 구간 3칸 → 여행 하루 예산 (작업 0170 · Figma 04)
// 물가 · 환율 신호는 빌드 때 받은 값만 · 없으면 이유 (docs/domain/travel-price.md) · 숫자를 지어내지 않음
import Link from "next/link";
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
  const latestOf = Object.fromEntries((signals.ok ? signals.data.signals : []).map((s) => [s.currency, s.latest]));
  const source = levels.ok ? levels.data.rows[0]?.source : null;
  const rows = data ? data.bands.flatMap((b) => b.rows) : [];
  const headline = pricesHeadline(rows);

  return (
    <>
      <SiteNav page="prices" />
      <main className="bg-surface px-4 pt-14 pb-20 text-fg sm:px-8 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-page">
          <Eyebrow>여행 물가</Eyebrow>
          <Title as="h1" size="poster" className="mt-3 text-cheap">
            {headline ? headline.title : "여행 물가 자료를 받지 못했습니다"}
          </Title>
          <p className="mt-6 max-w-3xl text-body text-fg-2">
            {headline ? `${headline.note} · ` : ""}세계은행 나라별 물가 수준(한국 = 100)과 오늘 그 나라 통화 신호를 함께 봅니다. 두 값은 따로 봅니다 — 물가는 1년에 한 번, 환율은 매일 바뀝니다.
          </p>
          <p className="mt-3 text-small">
            <Link href="/flights" className="font-semibold text-accent hover:underline">
              항공료 · 단체여행비는 언제가 싼지 — 여행 타이밍 보기 →
            </Link>
          </p>

          <div className="mt-12">
            {data && data.bands.length > 0 ? (
              <PriceBands bands={data.bands} signalOf={signalOf} latestYear={data.years[0]} />
            ) : (
              <EmptyState>물가 자료를 받지 못했습니다 ({levels.ok ? "여행지 나라 자료 없음" : levels.reason})</EmptyState>
            )}
          </div>

          {data && data.bands.length > 0 && (
            <div className="mt-16">
              <BudgetPlanner rows={rows} latestOf={latestOf} />
            </div>
          )}

          {data && (
            <div className="mt-12 space-y-2 border-t-2 border-line pt-6 text-small leading-relaxed text-fg-2">
              <p>
                출처: 세계은행 가계 소비 구매력 평가(PPP) ÷ 시장 환율 {source && <span className="font-mono">({source.replace(/^worldbank:/, "")})</span>} · 기준 연도 {data.years.join(" · ")}년 · 한국과 같은 연도끼리 비교
              </p>
              <p>나라 전체 평균이라 도시 · 품목 · 숙소에 따라 체감은 다릅니다. 세계은행 안내대로 정밀한 순위 대신 묶음으로 보여 줍니다.</p>
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

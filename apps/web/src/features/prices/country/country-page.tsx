// 나라별 여행 물가 페이지 /prices/[code] (작업 0344 · 시안 1-new · 2-new · 6-new)
// 첫 면(파랑): 경로 · 큰 제목 · 한 줄 답 + 오른쪽 예산 카드(그 나라로 미리 고름) → 다음으로 볼 것 → 견줘 볼 나라 → 자주 묻는 질문
// 값은 빌드 때 받은 것만 · 받지 못한 값은 "자료 없음" (docs/domain/travel-price.md) · 그리기만 (계산은 country-model · country-view)
import type { Fetched } from "@hav/shared/api";
import { RATE_SOURCE_LABEL } from "@hav/shared/currency";
import type { PriceLevels } from "@hav/shared/prices";
import type { SignalList } from "@hav/shared/signal";
import { travelBands } from "@hav/shared/travel";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { TextLink } from "@hav/ui/text/text-link";
import { SiteNav } from "@/shared/nav/site-nav";
import { signalMaps } from "@/shared/signal/signal-maps";
import { allRows } from "../bands/bands";
import { BudgetPlanner } from "../budget/budget-planner";
import { CompareList } from "./compare-list";
import { CountryFaq } from "./country-faq";
import { CountryHeader } from "./country-header";
import type { CountryView } from "./country-model";
import { NextCards } from "./next-cards";

export function CountryPage({ view, levels, signals }: { view: CountryView; levels: PriceLevels; signals: Fetched<SignalList> }) {
  const rows = allRows(travelBands(levels).bands);
  const { latestOf } = signalMaps(signals);
  return (
    <>
      <SiteNav page="prices" />
      <main id="main" tabIndex={-1} className="bg-surface text-fg">
        <div className="grid grid-cols-[minmax(1rem,1fr)_minmax(0,var(--container-page))_minmax(1rem,1fr)] sm:grid-cols-[minmax(2rem,1fr)_minmax(0,var(--container-page))_minmax(2rem,1fr)]">
          <div aria-hidden className="col-span-3 col-start-1 row-start-1 bg-pin-cheap" />
          <div className="col-start-2 row-start-1 pt-10 pb-32 sm:pt-14 lg:pr-[calc(28.25rem+3.5rem)] lg:pb-10">
            <CountryHeader v={view} />
          </div>
          <div className="relative z-10 col-start-2 row-start-2 -mt-24 pb-2 lg:row-start-1 lg:mt-[3.25rem] lg:mb-10 lg:ml-auto lg:w-[28.25rem] lg:self-start lg:pb-0">
            <BudgetPlanner rows={rows} latestOf={latestOf} initial={view.code} />
          </div>
        </div>
        <div className="px-4 pt-14 pb-16 sm:px-8 lg:pt-12">
          <div className="mx-auto max-w-page">
            <NextCards v={view} />
            <CompareList v={view} />
            <CountryFaq name={view.name} year={view.year} items={view.faq} />
            <p className="mt-10 text-small text-fg-2">
              <TextLink href="/prices">여행 물가 전체 보기</TextLink>
            </p>
          </div>
        </div>
      </main>
      <PageFooter width="max-w-page">자료: 세계은행 물가 수준 · {RATE_SOURCE_LABEL} · <TextLink href="/about">소개 · 판단 기준</TextLink></PageFooter>
    </>
  );
}

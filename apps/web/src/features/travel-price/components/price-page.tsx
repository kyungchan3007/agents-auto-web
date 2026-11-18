// 여행 물가 페이지 — 새 디자인(작업 0220 · 시안 B): 메뉴와 이어지는 파랑 첫 면(큰 문장 + 오른쪽 하루 예산 카드가 경계에 걸침) → 한국 = 100 물가 자 → 물가 구간 3칸 표 (작업 0170 · Figma 04)
// 물가 · 환율 신호는 빌드 때 받은 값만 · 없으면 이유 (docs/domain/travel-price.md) · 숫자를 지어내지 않음
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import type { PriceLevels } from "@hav/shared/prices";
import type { SignalList } from "@hav/shared/signal";
import { TRAVEL_COUNTRIES, travelBands } from "@hav/shared/travel";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { pricesHeadline } from "../lib/prices-copy";
import { BudgetPlanner } from "./budget-planner";
import { Suspense } from "react";
import { PriceBands } from "./price-bands";
import { PriceRuler } from "./price-ruler";
import { PricesHeader } from "./prices-header";
import { PriceView } from "./price-view";

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
      <main id="main" tabIndex={-1} className="bg-surface text-fg">
        {/* 첫 면 — 파랑 띠는 그리드 첫 줄 높이만큼만 깔리고 예산 카드는 그 경계에 걸침 (넓은 화면은 시안 B 처럼 카드를 원래 자리에서 150px 아래로 내려(translate · 자리는 그대로) 파랑 면 끝 = 카드 원래 자리 아래 40px · 아래 구간은 내려온 만큼 위 여백을 늘림 · 작업 0220 사용자 지적) (그라데이션 · 음수 여백 대신 칸 나눔 · 휴대폰은 카드를 위로 끌어올림) */}
        <div className="grid grid-cols-[minmax(1rem,1fr)_minmax(0,var(--container-page))_minmax(1rem,1fr)] sm:grid-cols-[minmax(2rem,1fr)_minmax(0,var(--container-page))_minmax(2rem,1fr)]">
          <div data-testid="prices-band" aria-hidden className="col-span-3 col-start-1 row-start-1 bg-pin-cheap" />
          <div className="col-start-2 row-start-1 pt-10 pb-32 sm:pt-14 lg:pr-[calc(28.25rem+3.5rem)] lg:pb-10">
            <PricesHeader rows={rows.map((r) => ({ country: r.country, name: r.name, relative: r.relative, year: r.year }))} title={headline ? headline.title : "여행 물가 자료를 받지 못했습니다"} />
          </div>
          {data && data.bands.length > 0 && (
            <div className="relative z-10 col-start-2 row-start-2 -mt-24 pb-2 lg:row-start-1 lg:mt-14 lg:mb-10 lg:ml-auto lg:w-[28.25rem] lg:translate-y-[150px] lg:self-start lg:pb-0">
              <BudgetPlanner rows={rows} latestOf={latestOf} />
            </div>
          )}
        </div>
        <div className="px-4 pt-14 pb-10 sm:px-8 sm:pt-16 lg:pt-[calc(150px+4rem)]">
        <div className="mx-auto max-w-page">
          {data && data.bands.length > 0 && <PriceRuler bands={data.bands} />}
          <div>
            {data && data.bands.length > 0 ? (
              // 주소의 ?currency= 는 브라우저에서 읽음(정적 사이트) — 읽기 전 · 검색 · AI 가 읽는 HTML 은 전체 목록 (작업 0193)
              <Suspense fallback={<PriceBands bands={data.bands} signalOf={signalOf} percentileOf={percentileOf} latestYear={data.years[0]} />}>
                <PriceView bands={data.bands} missing={data.missing} signalOf={signalOf} percentileOf={percentileOf} latestYear={data.years[0]} />
              </Suspense>
            ) : (
              <EmptyState>물가 자료를 받지 못했습니다 ({levels.ok ? "여행지 나라 자료 없음" : levels.reason})</EmptyState>
            )}
          </div>

          {data && (data.missing.length > 0 || !signals.ok) && (
            <div className="mt-6 space-y-1 text-small text-fg-2">
              {data.missing.length > 0 && <p>자료가 없어 뺀 나라: {data.missing.map((c) => TRAVEL_COUNTRIES[c]?.name ?? c).join(" · ")}</p>}
              {!signals.ok && <p>오늘 환율 신호를 받지 못해 비워 두었습니다 ({signals.reason})</p>}
            </div>
          )}
        </div>
        </div>
      </main>
      <PageFooter width="max-w-page">자료: 세계은행 물가 수준(PA.NUS.PRVT.PP ÷ PA.NUS.FCRF) · 한국수출입은행</PageFooter>
    </>
  );
}

// 직구 계산 페이지 — 하늘 종이 바탕 · 큰 문장(입력으로 바뀜) → 입력 · 결과 2단 → 이번 주 과세환율 · 수입물가와 환율 2단 (작업 0170 · Figma 05)
// 환율은 빌드 때 받은 값 · 계산은 브라우저에서 (IMP-01) · 모바일은 입력 → 결과 → 과세환율 → 수입물가 순서로 쌓임
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import type { FxLatest } from "@hav/shared/fx";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import type { CustomsRate, Point } from "../lib/customs-rate";
import type { FxDay, MonthPoint } from "../lib/import-price";
import { CalcForm } from "./calc-form";
import { CustomsSection } from "./customs-section";
import { ImportPriceSection } from "./import-price-section";

export function CalcPage({ latest, customs, trend, usdDays, importPrice }: { latest: Fetched<FxLatest>; customs: Record<string, CustomsRate>; trend: Point[] | null; usdDays: FxDay[] | null; importPrice: MonthPoint[] | null }) {
  const hasRates = latest.ok && latest.data.rates.length > 0;
  return (
    <>
      <SiteNav page="calc" />
      <main className="bg-surface px-4 pt-14 pb-20 text-fg sm:px-8 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-page">
          <Eyebrow>직구 계산</Eyebrow>
          {hasRates ? (
            <CalcForm rates={latest.data.rates} customs={customs} />
          ) : (
            <>
              <Title as="h1" size="page" className="mt-3 text-fg-2">
                환율을 받지 못했습니다
              </Title>
              <div className="mt-10">
                <EmptyState>환율을 받지 못해 계산할 수 없습니다 ({latest.ok ? "통화 없음" : latest.reason})</EmptyState>
              </div>
            </>
          )}
          <div className="mt-20 grid gap-16 lg:grid-cols-2 lg:gap-14">
            <CustomsSection points={trend} bank={latest.ok ? latest.data.rates.find((r) => r.currency === "USD") : undefined} />
            <ImportPriceSection fxRows={usdDays} price={importPrice} />
          </div>
        </div>
      </main>
      <PageFooter width="max-w-page">자료: 관세청 과세환율 · 한국은행 ECOS 수입물가지수 · 한국수출입은행 · 면세 한도 관세법 기준</PageFooter>
    </>
  );
}

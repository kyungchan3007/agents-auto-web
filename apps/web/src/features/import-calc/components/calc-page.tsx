"use client";

// 직구 계산 페이지 — 하늘 종이 바탕 · 큰 문장(입력으로 바뀜) → 입력 · 결과 2단 → 이번 주 과세환율 · 수입물가와 환율 2단 (작업 0170 · Figma 05)
// 환율은 빌드 때 받은 값 · 계산은 브라우저에서 (IMP-01) · 모바일은 입력 → 결과 → 과세환율 → 수입물가 순서로 쌓임
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import type { FxLatest } from "@hav/shared/fx";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { PhotoHeader } from "@hav/ui/layout/photo-header";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import { calcHeadline } from "../lib/calc-copy";
import { useCalcForm } from "../hooks/use-calc-form";
import type { CustomsRate, Point } from "../lib/customs-rate";
import type { FxDay, MonthPoint } from "../lib/import-price";
import { CalcForm } from "./calc-form";
import { CustomsSection } from "./customs-section";
import { ImportPriceSection } from "./import-price-section";

export function CalcPage({ latest, customs, trend, usdDays, importPrice }: { latest: Fetched<FxLatest>; customs: Record<string, CustomsRate>; trend: Point[] | null; usdDays: FxDay[] | null; importPrice: MonthPoint[] | null }) {
  const hasRates = latest.ok && latest.data.rates.length > 0;
  // 입력 상태는 여기서 한 번 — 사진 위 큰 문장 · 아래 입력 · 결과가 같이 씀 (작업 0175)
  const form = useCalcForm(latest.ok ? latest.data.rates : [], customs);
  // 큰 문장 — 입력으로 결과를 한 문장으로 ("세금 없이 받습니다" / "관세 · 부가세 약 ○원이 붙습니다") · 작업 0170
  const tone = !hasRates || !form.result || !form.result.ok ? "text-foam" : form.result.over ? "text-sun" : "text-foam";
  return (
    <>
      <SiteNav page="calc" />
      <main className="bg-surface text-fg">
        <PhotoHeader name="plane-below" alt="올려다본 하늘 위의 비행기" veil="ultramarine" priority position="center 40%">
          <Eyebrow className="text-sun">직구 계산</Eyebrow>
          <Title as="h1" size="page" className={`mt-3 ${tone}`}>
            {hasRates ? calcHeadline(form.result, form.input) : "환율을 받지 못했습니다"}
          </Title>
          <p className="mt-6 max-w-[36em] text-body">물건 값을 넣으면 면세 한도 안인지 바로 알려 드립니다.</p>
        </PhotoHeader>
        <div className="px-4 pt-6 pb-10 sm:px-8">
        <div className="mx-auto max-w-page">
          {hasRates ? (
            <CalcForm form={form} />
          ) : (
            <EmptyState>환율을 받지 못해 계산할 수 없습니다 ({latest.ok ? "통화 없음" : latest.reason})</EmptyState>
          )}
          <div className="mt-6 grid items-start gap-4 lg:grid-cols-2">
            <CustomsSection points={trend} bank={latest.ok ? latest.data.rates.find((r) => r.currency === "USD") : undefined} />
            <ImportPriceSection fxRows={usdDays} price={importPrice} />
          </div>
        </div>
        </div>
      </main>
      <PageFooter width="max-w-page">자료: 관세청 과세환율 · 한국은행 ECOS 수입물가지수 · 한국수출입은행 · 면세 한도 관세법 기준</PageFooter>
    </>
  );
}

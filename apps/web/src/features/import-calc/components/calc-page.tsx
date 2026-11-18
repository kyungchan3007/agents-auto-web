"use client";

// 직구 계산 페이지 — 새 디자인(작업 0221 · 시안 A): 사진 없는 머리(라벨 · 큰 문장 · 설명) → 입력 · 세관 꼬리표 결과 2단 → 수입물가와 환율(왼쪽 숫자 카드 · 오른쪽 그래프 + 이번 주 과세환율) (작업 0200 · 시안 B 배치 유지)
// 환율은 빌드 때 받은 값 · 계산은 브라우저에서 (IMP-01) · 모바일은 입력 → 결과 → 수입물가 → 과세환율 순서로 쌓임
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import type { FxLatest } from "@hav/shared/fx";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { EmphText } from "@hav/ui/text/emph";
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
  // 큰 문장 — 입력으로 결과를 한 문장으로 ("세금 없이 받습니다" / "관세 · 부가세 약 ○원이 붙습니다") · 숫자 강조는 EmphText (울트라마린 막 안에서는 해 노랑 글자)
  return (
    <>
      <SiteNav page="calc" />
      <main id="main" tabIndex={-1} className="bg-surface text-fg">
        <section aria-labelledby="calc-title" className="px-4 pt-10 sm:px-8 sm:pt-14">
          <div className="mx-auto max-w-page">
            <Eyebrow>직구 계산</Eyebrow>
            {/* 큰 문장은 입력에 따라 2~3줄 — 세 줄 높이를 미리 잡아 값을 바꿔도 아래 칸이 밀리지 않게 (작업 0200) */}
            <Title as="h1" size="page" id="calc-title" className="mt-3 min-h-[3lh] text-cheap sm:min-h-[1lh]">
              <EmphText text={hasRates ? calcHeadline(form.result, form.input) : "환율을 받지 못했습니다"} />
            </Title>
            <p className="mt-6 max-w-[36em] text-body text-fg-2">물건 값을 넣으면 면세 한도 안인지 바로 알려 드립니다.</p>
          </div>
        </section>
        <div className="px-4 pt-8 pb-10 sm:px-8">
        <div className="mx-auto max-w-page">
          {hasRates ? (
            <CalcForm form={form} />
          ) : (
            <EmptyState>환율을 받지 못해 계산할 수 없습니다 ({latest.ok ? "통화 없음" : latest.reason})</EmptyState>
          )}
          {/* 가로 전체 두 칸 — 수입물가와 환율 → 이번 주 과세환율 (작업 0200 · 시안 B) */}
          <div className="mt-12">
            <ImportPriceSection fxRows={usdDays} price={importPrice}>
              <CustomsSection points={trend} bank={latest.ok ? latest.data.rates.find((r) => r.currency === "USD") : undefined} />
            </ImportPriceSection>
          </div>
        </div>
        </div>
      </main>
      <PageFooter width="max-w-page">자료: 관세청 과세환율 · 한국은행 ECOS 수입물가지수 · 한국수출입은행 · 면세 한도 관세법 기준</PageFooter>
    </>
  );
}

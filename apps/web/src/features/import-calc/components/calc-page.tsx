// 직구 계산기 페이지 — 밝은 섹션 (docs/design.md 홈 흐름 5) · 환율은 빌드 때 받은 값 · 계산은 브라우저에서
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import type { FxLatest } from "@hav/shared/fx";
import { CalcForm } from "./calc-form";
import { CustomsSection } from "./customs-section";
import { ImportPriceSection } from "./import-price-section";
import type { FxDay, MonthPoint } from "../lib/import-price";
import type { CustomsRate, Point } from "../lib/customs-rate";
import { PageSection } from "@hav/ui/layout/page-section";
import { EmptyState } from "@hav/ui/feedback/empty-state";

export function CalcPage({ latest, customs, trend, usdDays, importPrice }: { latest: Fetched<FxLatest>; customs: Record<string, CustomsRate>; trend: Point[] | null; usdDays: FxDay[] | null; importPrice: MonthPoint[] | null }) {
  return (
    <>
      <SiteNav page="calc" />
      <PageSection
        surface="light"
        width="max-w-6xl"
        eyebrow="직구 계산기"
        title={
          <>
            구매 전에,
            <br />
            세금 부과 여부를 확인합니다.
          </>
        }
      >
        <div className="mt-10">
          {latest.ok && latest.data.rates.length > 0 ? (
            <CalcForm rates={latest.data.rates} customs={customs} />
          ) : (
            <EmptyState>환율을 받지 못해 계산할 수 없습니다 ({latest.ok ? "통화 없음" : latest.reason})</EmptyState>
          )}
        </div>
        <CustomsSection points={trend} bank={latest.ok ? latest.data.rates.find((r) => r.currency === "USD") : undefined} />
        <ImportPriceSection fxRows={usdDays} price={importPrice} />
      </PageSection>
    </>
  );
}

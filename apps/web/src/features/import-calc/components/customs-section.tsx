// 과세환율 영역 — 이번 주 관세청 과세환율 vs 수출입은행 매매기준율 · 주별 흐름 (달러 · 작업 0163) · 자료가 없으면 "준비 중" (숫자를 만들지 않음)
import { SectionTitle } from "@hav/ui/text/heading";
import { numberText } from "@hav/shared/format";
import type { FxRate } from "@hav/shared/fx";
import { YearChart } from "@hav/ui/data/year-chart";
import { type Point, customsView } from "../lib/customs-rate";

const won = (n: number) => `${numberText(n, { maximumFractionDigits: 2 })}원`;

export function CustomsSection({ points, bank }: { points: Point[] | null; bank: FxRate | undefined }) {
  const v = customsView(points, bank);
  return (
    <section data-testid="customs-section" className="min-w-0 rounded-card bg-card px-6 py-6" aria-labelledby="customs-title">
      <SectionTitle id="customs-title" className="text-[1.625rem] leading-tight text-cheap">
        이번 주 과세환율
      </SectionTitle>
      {v.kind === "preparing" ? (
        <p className="mt-2 text-body text-fg-2">준비 중 — 과세환율을 아직 받지 못했습니다</p>
      ) : (
        <>
          <p className="mt-2 text-[1.125rem] font-semibold text-fg">
            관세청 {won(v.latest.value)}
            {v.gap && ` · 은행 ${won(v.gap.bank)} (차이 ${v.gap.gapKrw > 0 ? "+" : ""}${numberText(v.gap.gapKrw, { maximumFractionDigits: 0 })}원)`}
          </p>
          <YearChart compact rates={v.trend.map((p) => ({ date: p.period, baseRate: p.value }))} unitText="원 (1달러당)" title="주별 과세환율 흐름" />
        </>
      )}
    </section>
  );
}

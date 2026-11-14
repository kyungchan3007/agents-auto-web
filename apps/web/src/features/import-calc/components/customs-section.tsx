// 과세환율 영역 — 이번 주 관세청 과세환율 vs 수출입은행 매매기준율 · 주별 흐름 (달러 · 작업 0163) · 자료가 없으면 "준비 중" (숫자를 만들지 않음)
import { numberText, signedPct } from "@hav/shared/format";
import type { FxRate } from "@hav/shared/fx";
import { YearChart } from "@hav/ui/data/year-chart";
import { StatTile } from "@hav/ui/data/stat-tile";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { type Point, customsView } from "../lib/customs-rate";

const won = (n: number) => `${numberText(n, { maximumFractionDigits: 2 })}원`;

export function CustomsSection({ points, bank }: { points: Point[] | null; bank: FxRate | undefined }) {
  const v = customsView(points, bank);
  return (
    <section className="mt-16" aria-labelledby="customs-title">
      <h2 id="customs-title" className="text-title font-semibold tracking-tight">
        관세청 과세환율 (달러)
      </h2>
      <p className="mt-2 text-sm text-fg-2">직구 관세 · 부가세는 관세청이 매주 고시하는 과세환율로 계산됩니다. 적용 기간은 일요일부터 토요일까지입니다.</p>
      <div className="mt-6">
        {v.kind === "preparing" ? (
          <EmptyState title="준비 중">과세환율을 아직 받지 못했습니다. 받으면 이 자리에 이번 주 값과 주별 흐름이 표시되고, 계산기도 그 값을 씁니다.</EmptyState>
        ) : (
          <>
            <dl className="grid gap-3 sm:grid-cols-3">
              <StatTile label="이번 고시 과세환율" value={won(v.latest.value)} sub={`${v.latest.period} 주 · 관세청`} />
              {v.gap && <StatTile label={`수출입은행 매매기준율${bank ? ` (${bank.date})` : ""}`} value={won(v.gap.bank)} sub="1달러당" />}
              {v.gap && <StatTile label="과세환율 − 수출입은행" value={`${v.gap.gapKrw > 0 ? "+" : ""}${numberText(v.gap.gapKrw, { maximumFractionDigits: 2 })}원`} sub={signedPct(v.gap.gapPct)} />}
            </dl>
            <YearChart rates={v.trend.map((p) => ({ date: p.period, baseRate: p.value }))} unitText="원 (1달러당)" title="주별 과세환율 흐름" />
            <p className="text-xs text-fg-2">출처: 관세청 관세환율정보 (공공데이터포털) · 받은 {v.trend.length}주</p>
          </>
        )}
      </div>
    </section>
  );
}

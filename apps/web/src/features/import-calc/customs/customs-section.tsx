// 과세환율 영역 — 이번 주 관세청 과세환율 vs 수출입은행 매매기준율 · 주별 흐름 (달러 · 작업 0163) · 자료가 없으면 "준비 중" (숫자를 만들지 않음)
// 새 디자인(작업 0221 · 시안 A): 관세청 값을 작은 글자판으로 · 은행 값 · 차이(점 + 글) — 기록이 2주 미만이면 주별 그래프만 없음(안내 줄 없음 · 작업 0282)
import { SectionTitle } from "@hav/ui/text/heading";
import { numberText } from "@hav/shared/format";
import type { FxRate } from "@hav/shared/fx";
import { YearChart } from "@hav/ui/data/year-chart";
import { type Point, canChart, customsView } from "../common/customs-rate";
import { CustomsBoard } from "./customs-board";

const won = (n: number) => `${numberText(n, { maximumFractionDigits: 2 })}원`;

export function CustomsSection({ points, bank }: { points: Point[] | null; bank: FxRate | undefined }) {
  const v = customsView(points, bank);
  return (
    <section data-testid="customs-section" data-fu={4} className="min-w-0 rounded-[1.5rem] border border-line bg-card px-6 py-6" aria-labelledby="customs-title">
      <SectionTitle id="customs-title" className="text-[1.125rem] leading-tight text-fg">
        이번 주 과세환율
      </SectionTitle>
      {v.kind === "preparing" ? (
        <p className="mt-2 text-body text-fg-2">준비 중 — 과세환율을 아직 받지 못했습니다</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 text-[1.125rem] font-semibold text-fg">
            <span className="flex items-center gap-3">
              관세청
              <span data-testid="customs-board">
                <CustomsBoard text={numberText(v.latest.value, { maximumFractionDigits: 2 })} label={`관세청 과세환율 ${won(v.latest.value)}`} />
              </span>
            </span>
            {v.gap && (
              <>
                <span>은행 {won(v.gap.bank)}</span>
                <span className="flex items-center gap-2 text-small text-fg-2">
                  <span aria-hidden className="size-2 rounded-full bg-pin-line" />
                  차이 {v.gap.gapKrw > 0 ? "+" : ""}
                  {numberText(v.gap.gapKrw, { maximumFractionDigits: 0 })}원
                </span>
              </>
            )}
          </div>
          {canChart(points) && <YearChart compact rates={v.trend.map((p) => ({ date: p.period, baseRate: p.value }))} unitText="원 (1달러당)" title="주별 과세환율 흐름" />}
        </>
      )}
    </section>
  );
}

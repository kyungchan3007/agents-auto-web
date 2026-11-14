// 여행 품목 물가지수 — 국제항공료 · 해외단체여행비 (통계청 KOSIS · 2020=100) · 작년 같은 달 대비 · 싼 달 · 원/달러 월평균과 나란히 (작업 0164)
// 자료가 없으면 "준비 중" (숫자를 만들지 않음) · 3D 비행기는 꾸밈 (숫자는 항상 글자로도)
import { numberText, signedPct } from "@hav/shared/format";
import { StatTile } from "@hav/ui/data/stat-tile";
import { YearChart } from "@hav/ui/data/year-chart";
import { EmptyState } from "@hav/ui/feedback/empty-state";
import { PlaneLazy } from "@hav/ui/three/scene/lazy";
import { type IndexPoint, travelView } from "../lib/travel-index";

export type TravelItem = { key: string; name: string; points: IndexPoint[] | null };

const fmt = (n: number) => numberText(n, { maximumFractionDigits: 1 });
const chart = (points: IndexPoint[]) => points.map((p) => ({ date: p.period, baseRate: p.value }));

export function TravelIndexSection({ items, fxMonthly }: { items: TravelItem[]; fxMonthly: IndexPoint[] }) {
  return (
    <section aria-labelledby="travel-index-title">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id="travel-index-title" className="text-title font-semibold tracking-tight">
            여행 품목 물가 — 항공료 · 단체여행비
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fg-2">
            통계청이 매달 발표하는 소비자물가지수 중 여행 품목입니다 (2020년 = 100). 작년 같은 달과 비교하고, 최근 3년 평균으로 어느 달이 싼 편인지 봅니다. 원/달러 환율 월평균을 같이 놓았습니다.
          </p>
        </div>
        <PlaneLazy label="떠다니는 비행기" className="size-24 shrink-0 sm:size-32" />
      </div>

      <div className="mt-8 grid gap-10">
        {items.map((item) => (
          <Item key={item.key} item={item} fxMonthly={fxMonthly} />
        ))}
      </div>
      <p className="mt-6 text-xs leading-relaxed text-fg-2">
        출처: 통계청 KOSIS 소비자물가지수 (지출목적별 · 품목포함 · 전국) · 한 달 늦게 반영될 수 있습니다 · 지수는 값이 클수록 비싸다는 뜻이며 실제 요금이 아닙니다
      </p>
    </section>
  );
}

function Item({ item, fxMonthly }: { item: TravelItem; fxMonthly: IndexPoint[] }) {
  const v = travelView(item.points);
  if (v.kind === "preparing") return <EmptyState title={`${item.name} · 준비 중`}>통계청 자료를 아직 받지 못했습니다. 받으면 이 자리에 지수와 작년 대비가 표시됩니다.</EmptyState>;
  // 같은 기간의 환율만 나란히
  const first = v.trend[0].period;
  const fx = fxMonthly.filter((p) => p.period >= first);
  return (
    <div>
      <h3 className="text-base font-semibold text-fg">{item.name}</h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-3">
        <StatTile label={`${v.latest.period} 지수`} value={fmt(v.latest.value)} sub="2020년 = 100" />
        <StatTile label="작년 같은 달보다" value={v.yoy === null ? "비교할 자료 없음" : signedPct(v.yoy)} sub={v.yoy === null ? "작년 값이 없어 비워 둠" : undefined} />
        <StatTile label="싼 편인 달" value={v.cheapMonth === null ? "자료 부족" : `${v.cheapMonth}월`} sub={v.cheapMonth === null ? "달마다 2개 이상 · 12달이 모여야 고름" : "최근 3년 같은 달 평균이 가장 낮음"} />
      </dl>
      <YearChart rates={chart(v.trend)} unitText="(2020년 = 100)" title={`${item.name} 지수`} />
      {fx.length >= 2 && <YearChart rates={chart(fx)} unitText="원 (1달러당 월평균)" title="같은 기간 원/달러 월평균" />}
    </div>
  );
}

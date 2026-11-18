// 1년 최저 · 최고 · 평균 한 카드 — 비행 경로 줄 (작업 0219 · 시안 A): 왼쪽 최저 · 오른쪽 최고 · 가운데 평균 눈금 · 오늘 위치에 비행기 점
// 값은 받은 1년 기록 그대로 — 기록이 없으면 값은 "—" · 줄은 그리지 않음 (지어내지 않음) · 최저 · 최고는 화면에 들어올 때 한 번 카운트업
import { CountUp } from "@hav/ui/motion/count-up";
import { cardDigits, routePosition } from "../lib/redesign";
import { cardRateText } from "../lib/detail-view";

type Stats = { min: number; max: number; avg: number } | null;

export function RangeCard({ stats, rate, unitText }: { stats: Stats; rate: { baseRate: number; unit: number }; unitText: string }) {
  const pos = stats ? routePosition(rate.baseRate, stats.min, stats.max) : null;
  const avgPos = stats ? routePosition(stats.avg, stats.min, stats.max) : null;
  const d = cardDigits(rate);
  return (
    <section data-testid="route-card" aria-label="1년 최저 · 최고 · 평균" className="rounded-[1.5rem] bg-card p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div data-testid="route-min">
          <p className="text-small text-fg-2">1년 최저</p>
          <p className="mt-1 text-[1.5rem] font-extrabold text-figure tabular-nums sm:text-[1.75rem]">{stats ? <CountUp value={stats.min} digits={d} suffix={unitText} /> : "—"}</p>
        </div>
        <div data-testid="route-max" className="text-right">
          <p className="text-small text-fg-2">1년 최고</p>
          <p className="mt-1 text-[1.5rem] font-extrabold text-expensive tabular-nums sm:text-[1.75rem]">{stats ? <CountUp value={stats.max} digits={d} suffix={unitText} /> : "—"}</p>
        </div>
      </div>
      {stats && pos !== null && (
        <>
          <div aria-hidden className="relative mx-3 mt-7 h-9">
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-line" />
            <span className="absolute top-1/2 left-0 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-pin-cheap bg-card" />
            <span className="absolute top-1/2 right-0 size-3.5 translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-pin-expensive bg-card" />
            {avgPos !== null && <span className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-fg" style={{ left: `${avgPos * 100}%` }} />}
            <span data-testid="route-plane" data-position={pos} className="absolute top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sun text-pin-ink ring-2 ring-card" style={{ left: `${pos * 100}%` }}>
              <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" transform="rotate(90 12 12)" />
              </svg>
            </span>
          </div>
          <p data-testid="route-avg" className="relative mt-1 text-center text-small text-fg-2" style={avgPos !== null ? { textAlign: "left", paddingLeft: `clamp(0px, calc(${avgPos * 100}% - 4.5rem), calc(100% - 9rem))` } : undefined}>
            1년 평균 {cardRateText(stats.avg, rate)}
          </p>
        </>
      )}
    </section>
  );
}

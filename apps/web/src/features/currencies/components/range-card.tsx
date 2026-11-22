"use client";

// 1년 최저 · 최고 · 평균 한 카드 — 비행 경로 줄 (작업 0219 · 시안 A): 왼쪽 최저 · 오른쪽 최고 · 가운데 평균 눈금 · 오늘 위치에 비행기 점
// 값은 받은 1년 기록 그대로 — 기록이 없으면 값은 "—" · 줄은 그리지 않음 (지어내지 않음) · 최저 · 최고는 화면에 들어올 때 한 번 카운트업
// 통화를 바꿀 때(작업 0231 · 모션 7): 최저 · 최고 · 평균이 직전 값에서 새 값으로 · 비행기 · 평균 눈금이 새 자리로 미끄러짐 — 왼쪽으로 가면 기수를 돌림(data-heading) · 직전 값은 전환 기억(takeSwitchFrom → rememberSwitch)
import { CountUp } from "@hav/ui/motion/count-up";
import { useRangeMotion } from "../hooks/use-range-motion";
import { useSwitchFrom } from "../hooks/use-switch-from";
import { cardDigits, routePosition } from "../lib/redesign";
import { cardRateText } from "../lib/detail-view";

type Stats = { min: number; max: number; avg: number } | null;

export function RangeCard({ code, stats, rate, unitText }: { code: string; stats: Stats; rate: { baseRate: number; unit: number }; unitText: string }) {
  const from = useSwitchFrom(code);
  const pos = stats ? routePosition(rate.baseRate, stats.min, stats.max) : null;
  const avgPos = stats ? routePosition(stats.avg, stats.min, stats.max) : null;
  const d = cardDigits(rate);
  // "833.5원 / 100" 이 두 줄로 꺾이던 것 — "/ 100" 을 작은 "100엔당" 으로 바꿔 한 줄에 둠 (작업 0248 · 11번 · 1년 평균 글은 그대로)
  const per = rate.unit !== 1 && unitText.startsWith("원") ? <small className="ml-1.5 text-[0.75rem] font-bold whitespace-nowrap text-fg-2">{`${rate.unit}${code === "JPY" ? "엔" : code}당`}</small> : unitText === "원" ? null : unitText.replace(/^원/, "");
  const { planePos, avgTickPos, heading, animated, avgRef, avgValue } = useRangeMotion(code, from, stats, pos, avgPos);
  const slide = animated ? "transition-transform delay-[220ms] duration-[1050ms] ease-[cubic-bezier(.45,0,.2,1)] motion-reduce:transition-none" : "";
  return (
    <section data-testid="route-card" aria-label="1년 최저 · 최고 · 평균" className="rounded-[1.5rem] border-2 border-line bg-card p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div data-testid="route-min">
          <p className="text-small text-fg-2">1년 최저</p>
          <p className="mt-1 text-[1.375rem] font-bold whitespace-nowrap text-figure tabular-nums sm:text-[1.75rem]">{stats ? <><CountUp value={stats.min} digits={d} suffix="원" from={from?.min ?? null} delayMs={220} />{per}</> : "—"}</p>
        </div>
        <div data-testid="route-max" className="text-right">
          <p className="text-small text-fg-2">1년 최고</p>
          <p className="mt-1 text-[1.375rem] font-bold whitespace-nowrap text-expensive tabular-nums sm:text-[1.75rem]">{stats ? <><CountUp value={stats.max} digits={d} suffix="원" from={from?.max ?? null} delayMs={220} />{per}</> : "—"}</p>
        </div>
      </div>
      {stats && pos !== null && (
        <>
          {/* 비행기 표시가 끝점 6% 안이면 그 끝의 고리는 그리지 않음 — 고리가 비행기에 반쯤 가려 "C" 로 보이던 것 (작업 0248 · 19번) */}
          <div aria-hidden className="relative mx-3 mt-7 h-9 [container-type:inline-size]">
            <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-line" />
            {pos >= 0.06 && <span className="absolute top-1/2 left-0 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-pin-cheap bg-card" />}
            {pos <= 0.94 && <span className="absolute top-1/2 right-0 size-3.5 translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-pin-expensive bg-card" />}
            {avgTickPos !== null && <span className={`absolute top-1/2 left-0 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-fg ${slide}`} style={{ transform: `translateX(${avgTickPos * 100}cqw)` }} />}
            <span
              data-testid="route-plane"
              data-position={pos}
              data-heading={heading ?? undefined}
              className={`absolute top-1/2 left-0 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sun text-pin-ink ring-2 ring-card ${slide}`}
              style={{ transform: `translateX(${(planePos ?? pos) * 100}cqw)` }}
            >
              <svg viewBox="0 0 24 24" className={`size-5 transition-transform duration-300 ${heading === "left" ? "-scale-x-100" : ""}`} fill="currentColor">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" transform="rotate(90 12 12)" />
              </svg>
            </span>
          </div>
          <p ref={avgRef} data-testid="route-avg" className="relative mt-1 text-center text-small text-fg-2" style={avgPos !== null ? { textAlign: "left", paddingLeft: `clamp(0px, calc(${avgPos * 100}% - 4.5rem), calc(100% - 9rem))` } : undefined}>
            1년 평균 {cardRateText(avgValue, rate)}
          </p>
        </>
      )}
    </section>
  );
}

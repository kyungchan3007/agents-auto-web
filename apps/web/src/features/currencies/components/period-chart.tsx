"use client";

// 1년 흐름 — 새 디자인(작업 0219 · 시안 A): 왼쪽 큰 제목 "○ 흐름" · 오른쪽 기간 알약 묶음 "1개월 · 3개월 · 1년" · 가로 전체 높은 선 그래프(선이 그려지며 나타남 · 한 번) · 최고 · 최저 · 평균 점선
//   빌드 때 받은 1년치를 화면에서 자르기만 함 (다시 받지 않음) · 기간 탭 기능은 그대로 (6개월 칩은 화면에서 뺌) · 변화율 글 · 설명은 시안에 없어 뺌
import { YearChart } from "@hav/ui/data/year-chart";
import { PERIODS } from "../lib/periods";
import { extremeDays, extremeLabelText, yearStats } from "../lib/detail-view";
import { usePeriodChart } from "../hooks/use-period-chart";

export function PeriodChart({ rates, unit = 1, unitText, lastTone }: { rates: { date: string; baseRate: number }[]; unit?: number; unitText: string; lastTone?: "cheap" | "normal" | "expensive" | null }) {
  const { id, setId, period, shown } = usePeriodChart(rates);
  const avg = yearStats(shown);
  // 고른 기간(shown)의 최고 · 최저 — 위 카드(yearStats)와 같은 값 (작업 0175)
  const ex = extremeDays(shown);
  const extremeText = ex ? { max: extremeLabelText("max", { baseRate: ex.max.baseRate, unit }), min: extremeLabelText("min", { baseRate: ex.min.baseRate, unit }) } : undefined;
  return (
    <section data-testid="year-flow" aria-labelledby="year-flow-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 id="year-flow-title" className="text-[1.5rem] font-extrabold tracking-display text-fg sm:text-[1.875rem]">
          {period.label} 흐름
        </h2>
        <div className="inline-flex rounded-pill border-2 border-line bg-card p-1" role="group" aria-label="기간">
          {PERIODS.filter((p) => p.id !== "6m").map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={p.id === id}
              onClick={() => setId(p.id)}
              className={`rounded-pill px-4 py-1.5 text-small font-bold transition-colors ${p.id === id ? "bg-pin-ink text-foam" : "text-fg hover:bg-surface-2"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <YearChart compact tall draw rates={shown} unitText={unitText} title={`${period.label} 흐름`} average={avg?.avg} lastTone={lastTone} extremeText={extremeText} />
    </section>
  );
}

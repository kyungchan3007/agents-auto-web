"use client";

// 환율 흐름 — 시안: 낮은 선 그래프(울트라마린 · 기준선 3개 · 점선 = 평균 · 오늘 점 = 판정 색) 아래 왼쪽에 기간 칩 "1개월 · 3개월 · 1년" (작업 0170)
//   빌드 때 받은 1년치를 화면에서 자르기만 함 (다시 받지 않음) · 6개월 칩 · 변화율 글 · 설명은 시안에 없어 화면에서 뺌
import { YearChart } from "@hav/ui/data/year-chart";
import { PERIODS } from "../lib/periods";
import { yearStats } from "../lib/detail-view";
import { usePeriodChart } from "../hooks/use-period-chart";

export function PeriodChart({ rates, unitText, lastTone }: { rates: { date: string; baseRate: number }[]; unitText: string; lastTone?: "cheap" | "normal" | "expensive" | null }) {
  const { id, setId, period, shown } = usePeriodChart(rates);
  const avg = yearStats(shown);
  return (
    <div>
      <YearChart compact rates={shown} unitText={unitText} title={`${period.label} 흐름`} average={avg?.avg} lastTone={lastTone} />
      <div className="mt-2 flex gap-2" role="group" aria-label="기간">
        {PERIODS.filter((p) => p.id !== "6m").map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={p.id === id}
            onClick={() => setId(p.id)}
            className={`rounded-pill border-2 px-4 py-1 text-small font-semibold transition-colors ${p.id === id ? "border-cheap bg-cheap text-on-accent" : "border-cheap text-cheap hover:bg-surface-2"}`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

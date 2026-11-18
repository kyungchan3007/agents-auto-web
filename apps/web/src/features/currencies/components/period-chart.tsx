"use client";

// 1년 흐름 — 새 디자인(작업 0219 · 시안 F): 왼쪽 큰 제목 "○ 흐름" · 오른쪽 기간 알약 묶음 "1개월 · 3개월 · 1년" · 가로 전체 2D 선 그래프(공통 LineChart · 0216) — 그라데이션 면 · 값 · 날짜 눈금 · 최고(빨강) · 최저(남색) 점 · 평균 점선 · 끝 "오늘" 큰 숫자 말풍선 · 순서 움직임(한 번)
//   빌드 때 받은 1년치를 화면에서 자르기만 함 (다시 받지 않음) · 기간 탭 기능은 그대로 (6개월 칩은 화면에서 뺌) · 점은 모두 받은 실제 일별 값
import { rateText } from "@hav/shared/currency";
import { type ChartMark, LineChart } from "@hav/ui/data/line-chart";
import { cardRateText, extremeDays, extremeLabelText, yearStats } from "../lib/detail-view";
import { dateTicks, dayNumber, valueAxis } from "../lib/chart-axes";
import { PERIODS } from "../lib/periods";
import { usePeriodChart } from "../hooks/use-period-chart";

export function PeriodChart({ rates, unit = 1, unitText, lastTone }: { rates: { date: string; baseRate: number }[]; unit?: number; unitText: string; lastTone?: "cheap" | "normal" | "expensive" | null }) {
  const { id, setId, period, shown } = usePeriodChart(rates);
  const stats = yearStats(shown);
  const ex = extremeDays(shown);
  const last = shown.at(-1);
  const axis = stats ? valueAxis(stats.min, stats.max) : null;
  const rate = last ? { baseRate: last.baseRate, unit } : null;
  const marks: ChartMark[] = [];
  if (ex && ex.max.date !== ex.min.date) {
    const iMax = shown.findIndex((d) => d.date === ex.max.date);
    const iMin = shown.findIndex((d) => d.date === ex.min.date);
    marks.push({ series: "rate", index: iMax, kind: "max", text: extremeLabelText("max", { baseRate: ex.max.baseRate, unit }), place: "top", tone: "red" });
    marks.push({ series: "rate", index: iMin, kind: "min", text: extremeLabelText("min", { baseRate: ex.min.baseRate, unit }), place: "left", tone: "navy" });
  }
  void unitText; // 읽기용 글 · 끝 말풍선 단위는 rateText 가 만듦 (옛 호출 자리 유지)
  void lastTone; // 판정 색은 그래프 끝 말풍선 대신 위 카드가 보임 (시안 F: 끝 말풍선은 울트라마린)
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
      <div data-testid="period-chart" className="mt-4">
        {axis && stats && last && rate ? (
          <LineChart
            // 기간을 바꾸면 새로 그림(움직임은 처음 한 번만 — 기간이 바뀐 뒤에는 바로 최종 모양)
            aria={`${period.label} 흐름 — 최저 ${cardRateText(stats.min, rate)} · 최고 ${cardRateText(stats.max, rate)} · 평균 ${cardRateText(stats.avg, rate)} · 마지막 ${last.date} ${cardRateText(last.baseRate, rate)}`}
            x={[dayNumber(shown[0].date), dayNumber(last.date)]}
            y={{ min: axis.min, max: axis.max, ticks: axis.ticks }}
            xTicks={dateTicks(shown[0].date, last.date)}
            series={[{ id: "rate", color: "var(--hav-pin-cheap)", points: shown.map((d) => ({ x: dayNumber(d.date), v: d.baseRate })), area: 0.22, width: 2.6, end: { label: "오늘", value: last.baseRate, digits: last.baseRate >= 100 ? 1 : 2, unit: rateText(rate).unit } }]}
            marks={marks}
            refs={[{ v: stats.avg, text: `${period.label} 평균 ${cardRateText(stats.avg, rate)}`, short: `평균 ${cardRateText(stats.avg, rate)}`, tone: "navy" }]}
            height={380}
            heightPhone={300}
            pad={{ l: 56, t: 52 }}
            padPhone={{ l: 44, t: 44 }}
          />
        ) : (
          <p className="border-t-2 border-line py-6 text-sm text-fg-2">{period.label} 흐름을 그릴 기록이 모자랍니다</p>
        )}
      </div>
    </section>
  );
}

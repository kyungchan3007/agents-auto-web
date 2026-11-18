// 12달 막대 — 국제항공료 지수 달별 평균 (작업 0217 · 시안 B) · 가장 비싼 달 빨강 · 가장 싼 달 노랑 · 나머지 연한 파랑 · 막대 위 "N월 가장 비쌈 / 가장 쌈"
// /flights 링크는 미리 받지 않음(prefetch=false) — /flights 의 머리 사진 요청이 홈 화면에서 나가지 않게 (홈 사진 요청 0)
// 높이 · 색은 yearBars(실제 자료 계산) 그대로 · 지수가 없으면 아무것도 그리지 않음 (달을 지어내지 않음) · 3D 비행 경로 없음
import { Eyebrow, Title } from "@hav/ui/text/heading";
import Link from "next/link";
import type { TravelTiming } from "../lib/travel-timing";
import { type YearBar, yearBars } from "../lib/year-bars";

const TONE: Record<YearBar["tone"], string> = {
  high: "bg-pin-expensive",
  low: "bg-sun",
  mid: "bg-pin-cheap/25",
  none: "bg-transparent",
};

export function YearBars({ timing }: { timing: TravelTiming }) {
  if (timing.kind !== "ready") return null;
  const bars = yearBars(timing);
  const label = `1월부터 12월까지 국제항공료 지수 막대. ${timing.priciest}월이 가장 높고 ${timing.cheapest}월이 가장 낮습니다`;
  return (
    <section data-testid="year-section" aria-labelledby="year-title" className="px-4 pt-16 text-fg sm:px-8 sm:pt-24">
      <div className="mx-auto max-w-page">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div>
            <Eyebrow>국제항공료 지수</Eyebrow>
            <Title as="h2" id="year-title" className="mt-3 text-fg">
              {timing.cheapest}월 가장 쌈 · {timing.priciest}월 가장 비쌈
            </Title>
          </div>
          <Link data-testid="year-link" href="/flights" prefetch={false} className="inline-flex items-center gap-1.5 border-b-2 border-cheap pb-0.5 font-bold text-cheap hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cheap">
            항공료 그래프 자세히 ›
          </Link>
        </div>
        <div data-testid="year-bars" role="img" aria-label={label} className="mt-12 grid h-52 grid-cols-12 items-end gap-1 border-b-2 border-fg sm:h-[300px] sm:gap-2.5">
          {bars.map((b) => (
            <div key={b.month} data-testid="year-bar" data-tone={b.tone} data-month={b.month} className={`relative rounded-t-lg ${TONE[b.tone]}`} style={{ height: b.heightPct === null ? 0 : `${b.heightPct}%` }}>
              {b.tone === "high" && (
                <span className="absolute bottom-[calc(100%+8px)] left-0 text-[0.6875rem] font-bold whitespace-nowrap text-expensive sm:left-1/2 sm:-translate-x-1/2 sm:text-small">{b.month}월 가장 비쌈</span>
              )}
              {b.tone === "low" && (
                <span className="absolute right-0 bottom-[calc(100%+8px)] text-[0.6875rem] font-bold whitespace-nowrap text-fg sm:right-auto sm:left-1/2 sm:-translate-x-1/2 sm:text-small">{b.month}월 가장 쌈</span>
              )}
            </div>
          ))}
        </div>
        <div aria-hidden className="mt-2.5 grid grid-cols-12 gap-1 text-center text-[0.6875rem] text-fg-2 sm:gap-2.5 sm:text-small">
          {bars.map((b) => (
            <span key={b.month} className={`tabular-nums ${b.tone === "low" ? "font-bold text-fg" : ""}`}>
              {b.month}월
            </span>
          ))}
        </div>
        <p className="mt-4 text-small text-fg-2">지수는 값이 클수록 항공료가 비싸다는 뜻이며 실제 요금이 아닙니다 · 통계청 소비자물가지수(2020년 = 100)</p>
      </div>
    </section>
  );
}

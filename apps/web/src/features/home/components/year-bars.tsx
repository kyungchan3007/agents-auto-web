// 12달 막대 — 국제항공료 지수 달별 평균 (작업 0217 · 시안 B → 그래프 2D 시안 F: 공통 MonthBars) · 가장 비싼 달 빨강 · 가장 싼 달 노랑 · 나머지 연한 파랑 · 말풍선 "N월 가장 비쌈 / 가장 쌈" · 왼쪽 눈금은 실제 지수 · 순서 움직임(한 번)
// /flights 링크는 미리 받지 않음(prefetch=false) — /flights 의 머리 사진 요청이 홈 화면에서 나가지 않게 (홈 사진 요청 0)
// 높이 · 색은 yearBars(실제 자료 계산) 그대로 · 지수가 없으면 아무것도 그리지 않음 (달을 지어내지 않음) · 3D 비행 경로 없음
import { FadeUpGroup } from "@hav/ui/motion/fade-up";
import { MonthBars } from "@hav/ui/data/month-bars";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import Link from "next/link";
import type { TravelTiming } from "../lib/travel-timing";
import { yearBars, yearTicks } from "../lib/year-bars";

export function YearBars({ timing }: { timing: TravelTiming }) {
  if (timing.kind !== "ready") return null;
  const bars = yearBars(timing);
  const label = `1월부터 12월까지 국제항공료 지수 막대. ${timing.priciest}월이 가장 높고 ${timing.cheapest}월이 가장 낮습니다`;
  return (
    <section data-testid="year-section" aria-labelledby="year-title" className="px-4 pt-[4.5rem] text-fg sm:px-8 sm:pt-24">
      <FadeUpGroup className="mx-auto max-w-page">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
          <div>
            <Eyebrow data-fu={0}>국제항공료 지수</Eyebrow>
            <Title as="h2" id="year-title" className="mt-3 text-fg" data-fu={1}>
              {timing.cheapest}월 가장 쌈 · {timing.priciest}월 가장 비쌈
            </Title>
          </div>
          <Link data-fu={3} data-testid="year-link" href="/flights" prefetch={false} className="inline-flex items-center gap-1.5 border-b-2 border-cheap pb-0.5 font-bold text-cheap hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cheap">
            항공료 그래프 자세히 ›
          </Link>
        </div>
        <div className="mt-8">
          <MonthBars
            aria={label}
            bars={bars.map((b) => ({ month: b.month, tone: b.tone, rel: b.heightPct === null ? null : b.heightPct / 100 }))}
            ticks={yearTicks(timing)}
            highText={`${timing.priciest}월 가장 비쌈`}
            lowText={`${timing.cheapest}월 가장 쌈`}
          />
        </div>
        <ul data-fu={4} className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-small text-fg-2">
          <li className="inline-flex items-center gap-2"><i aria-hidden className="inline-block h-1.5 w-[1.125rem] rounded-pill bg-pin-expensive" />가장 비싼 달</li>
          <li className="inline-flex items-center gap-2"><i aria-hidden className="inline-block h-1.5 w-[1.125rem] rounded-pill bg-sun" />가장 싼 달</li>
          <li className="inline-flex items-center gap-2"><i aria-hidden className="inline-block h-1.5 w-[1.125rem] rounded-pill bg-pin-cheap/25" />나머지 달</li>
        </ul>
        <p data-fu={4} className="mt-4 text-small text-fg-2">지수는 값이 클수록 항공료가 비싸다는 뜻이며 실제 요금이 아닙니다 · 통계청 소비자물가지수(2020년 = 100)</p>
      </FadeUpGroup>
    </section>
  );
}

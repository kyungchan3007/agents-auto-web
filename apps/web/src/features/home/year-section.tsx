// 4 1년 흐름
import { currencyName, rateText } from "@hav/shared/currency";
import { Reveal } from "@hav/ui/reveal";
import { Section } from "@hav/ui/section";
import Link from "next/link";
import { YearChart } from "@hav/ui/year-chart";
import { HERO, type HomeView } from "./home-data";
import { EmptyState } from "@hav/ui/empty-state";

export function YearSection({ view }: { view: HomeView }) {
  const { hero, year, yearRange, heroHistoryProblem } = view;
  return (
    <Section
      id="year"
      eyebrow={`${currencyName(HERO)} · 최근 1년`}
      title={
        <>
          최근 1년의
          <br />
          환율 변동입니다.
        </>
      }
    >
      {hero && yearRange ? (
        <Reveal>
          <YearChart rates={year} unitText={rateText(hero).unit} />
          <p className="mt-6 text-sm">
            받은 {yearRange.count}일 중 가장 쌀 때 <span className="font-semibold text-cheap">{rateText({ baseRate: yearRange.min.baseRate, unit: hero.unit }).value}원</span> (
            {yearRange.min.date}) · 가장 비쌀 때 <span className="font-semibold text-expensive">{rateText({ baseRate: yearRange.max.baseRate, unit: hero.unit }).value}원</span> (
            {yearRange.max.date})
          </p>
          <Link href={`/currencies/${HERO}`} className="mt-6 inline-flex text-sm font-semibold text-accent hover:underline">
            다른 통화 1년 흐름 보기 →
          </Link>
        </Reveal>
      ) : (
        <EmptyState>{heroHistoryProblem}</EmptyState>
      )}
    </Section>
  );
}

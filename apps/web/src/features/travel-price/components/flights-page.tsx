// 여행 타이밍 페이지 — 하늘 종이 바탕 · 큰 문장(가장 싼 달) → 두 선 + 환율 점선 + 3D 비행기 → 작년 대비 카드 (작업 0170 · Figma 03)
// 큰 문장 · 카드는 지수로 계산 · 자료가 없으면 "준비 중" · 그래프 · 비행기 · 카드 없음 (숫자 · 달을 지어내지 않음)
import { SiteNav } from "@/shared/site-nav";
import { PLANE_CREDIT } from "@hav/shared/travel";
import { SignalPin } from "@hav/ui/data/signal-pin";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { Eyebrow, Title } from "@hav/ui/text/heading";
import { cheapMonth, type IndexPoint } from "../lib/travel-index";
import { cheapMonthsCard, flightsHeadline, yoyCard } from "../lib/flights-copy";
import { FlightsGraph } from "./flights-graph";

export type TravelItem = { key: string; name: string; points: IndexPoint[] | null };

export function FlightsPage({ travel, fxMonthly }: { travel: TravelItem[]; fxMonthly: IndexPoint[] }) {
  const air = travel.find((t) => t.key === "air-fare")?.points ?? null;
  const tour = travel.find((t) => t.key === "package-tour")?.points ?? null;
  const airCheap = air ? cheapMonth(air) : null;
  const tourCheap = tour ? cheapMonth(tour) : null;
  const headline = flightsHeadline(airCheap, tourCheap);
  const ready = !!air && air.length > 1;
  const cards = [yoyCard("국제항공료", air), yoyCard("해외단체여행비", tour)].filter((c): c is NonNullable<typeof c> => c !== null);
  const cheaps = cheapMonthsCard(airCheap, tourCheap);
  return (
    <>
      <SiteNav page="flights" />
      <main className="bg-surface px-4 pt-14 pb-20 text-fg sm:px-8 sm:pt-20 sm:pb-28">
        <div className="mx-auto max-w-page">
          <Eyebrow>여행 타이밍</Eyebrow>
          <Title as="h1" size="poster" className="mt-3 text-cheap">
            {headline}
          </Title>
          {ready ? (
            <>
              <p className="mt-6 max-w-3xl text-body text-fg-2">통계청 소비자물가 중 국제항공료 · 해외단체여행비 지수(2020 = 100). 작년 같은 달과 비교하고, 원/달러 환율 월평균과 나란히 봅니다. 선마다 자기 범위로 높이를 맞춘 모양 비교이며 지수는 실제 요금이 아닙니다.</p>
              <div className="mt-10">
                <FlightsGraph air={air} tour={tour} fx={fxMonthly} />
              </div>
              {(cards.length > 0 || cheaps) && (
                <div data-testid="yoy-cards" className="mt-12 grid gap-8 sm:grid-cols-3">
                  {cards.map((c) => (
                    <div key={c.label} className="border-t-2 border-line pt-3">
                      <p className="text-small text-fg-2">{c.label}</p>
                      <p className="mt-1 font-display text-city font-normal text-figure tabular-nums">{c.value}</p>
                      <div className="mt-2">{c.signal ? <SignalPin signal={c.signal} text={c.pinText} /> : <span className="text-small text-fg-2">{c.pinText}</span>}</div>
                    </div>
                  ))}
                  {cheaps && (
                    <div className="border-t-2 border-line pt-3">
                      <p className="text-small text-fg-2">{cheaps.label}</p>
                      <p className="mt-1 font-display text-city font-normal text-figure tabular-nums">{cheaps.value}</p>
                      <div className="mt-2">
                        <SignalPin signal="normal" text={cheaps.note} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="mt-6 max-w-3xl text-body text-fg-2">준비 중 — 통계청 국제항공료 지수를 아직 받지 못했습니다. 받으면 이 자리에 선 그래프 · 3D 비행기 · 작년 대비가 표시됩니다 (월 자료는 발표가 늦어 최근 몇 달을 매달 다시 받아 덮어씁니다).</p>
          )}
        </div>
      </main>
      <PageFooter width="max-w-page" className="space-y-1">
        <p>자료: 통계청 KOSIS 소비자물가지수(국제항공료 · 해외단체여행비, 매달 최근 24개월) · 한국수출입은행</p>
        <p>
          {PLANE_CREDIT.text} ·{" "}
          <a href={PLANE_CREDIT.sourceUrl} target="_blank" rel="noreferrer">
            원본
          </a>{" "}
          ·{" "}
          <a href={PLANE_CREDIT.licenseUrl} target="_blank" rel="noreferrer">
            라이선스
          </a>
        </p>
      </PageFooter>
    </>
  );
}

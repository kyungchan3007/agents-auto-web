// 여행 타이밍 페이지 — 하늘 종이 바탕 · 큰 문장(가장 싼 달) → 두 선 + 환율 점선 + 3D 비행기 → 작년 대비 카드 (작업 0170 · Figma 03)
// 큰 문장 · 카드는 지수로 계산 · 자료가 없으면 "준비 중" · 그래프 · 비행기 · 카드 없음 (숫자 · 달을 지어내지 않음)
// 여행 타이밍 페이지 — 새 디자인(작업 0218 · 시안 A + 머리 글자판): 메뉴(파랑) 아래 흰 머리(제목 · 설명 + 글자판 세 줄) → 하늘 종이 위 탑승권 한 장(왼쪽 그래프 · 절취선 · 오른쪽 숫자) → 한 줄 띠(최고 · 최저 · 환율)
// 큰 문장 · 글자판 · 숫자 · 띠는 지수로 계산 · 자료가 없으면 "준비 중" · 글자판 · 탑승권 · 띠 없음 (숫자 · 달을 지어내지 않음) · 사진 없음 (사진 파일 · 부품은 그대로 · 삭제는 0222)
import { SiteNav } from "@/shared/site-nav";
import { FlapBoard } from "@hav/ui/data/flap-board";
import { PageFooter } from "@hav/ui/layout/page-footer";
import { TextLink } from "@hav/ui/text/text-link";
import { CountUp } from "@hav/ui/motion/count-up";
import { FadeUpGroup } from "@hav/ui/motion/fade-up";
import { SlideIn } from "@hav/ui/motion/slide-in";
import { EmphText } from "@hav/ui/text/emph";
import { Title } from "@hav/ui/text/heading";
import { averageYears, cheapMonth, type IndexPoint } from "../lib/travel-index";
import { cheapMonthsCard, flightsHeadline, yoyCard } from "../lib/flights-copy";
import { flightsBoard, latestNumbers, stripStats } from "../lib/flights-view";
import type { AirfareCalendar } from "@hav/shared/airfare";
import { AirfareCalendarSection } from "./airfare-calendar";
import { FlightsGraph } from "./flights-graph";
import { MiniBoard } from "./mini-board";
import { WindowMonths } from "./window-months";

export type TravelItem = { key: string; name: string; points: IndexPoint[] | null };

const DOT = { cheap: "bg-pin-cheap", normal: "bg-pin-line", expensive: "bg-pin-expensive" } as const;

/** 탑승권 오른쪽 숫자 한 칸 — 이름 · 월 / 큰 지수(카운트업) / 점 + "작년보다 ±N.N%"(카운트업) */
function YoyItem({ name, points }: { name: string; points: IndexPoint[] | null }) {
  const card = yoyCard(name, points);
  const n = latestNumbers(points);
  if (!card || !n) return null;
  return (
    <div className="py-4 first:pt-0">
      <p className="text-small text-fg-2">{card.label}</p>
      <p className="mt-0.5 text-[2.25rem] leading-tight font-bold tracking-display text-fg tabular-nums">
        <CountUp value={n.value} digits={1} />
      </p>
      <p className="mt-1 flex items-center gap-2 text-small font-semibold text-fg">
        <span data-testid="yoy-dot" aria-hidden className={`size-2 shrink-0 rounded-full ${card.signal ? DOT[card.signal] : "bg-pin-line"}`} />
        {n.yoy !== null ? <CountUp value={Math.abs(n.yoy)} digits={1} prefix={`작년보다 ${n.yoy >= 0 ? "+" : "-"}`} suffix="%" /> : card.pinText}
      </p>
    </div>
  );
}

export function FlightsPage({ travel, fxMonthly, airfare = null }: { travel: TravelItem[]; fxMonthly: IndexPoint[]; airfare?: AirfareCalendar | null }) {
  const air = travel.find((t) => t.key === "air-fare")?.points ?? null;
  const tour = travel.find((t) => t.key === "package-tour")?.points ?? null;
  const airCheap = air ? cheapMonth(air) : null;
  const tourCheap = tour ? cheapMonth(tour) : null;
  const headline = flightsHeadline(airCheap, tourCheap);
  const ready = !!air && air.length > 1;
  const cheaps = cheapMonthsCard(airCheap, tourCheap, Math.max(averageYears(air ?? []), averageYears(tour ?? [])));
  const board = ready ? flightsBoard({ airCheap, tourCheap, air, tour }) : null;
  const strip = ready ? stripStats(air, fxMonthly) : null;
  return (
    <>
      <SiteNav page="flights" />
      <main id="main" tabIndex={-1} className="bg-surface text-fg">
        <section data-testid="flights-hero" aria-labelledby="flights-title" className="border-b border-line bg-card px-4 py-12 sm:px-8 sm:py-16">
          <div className="mx-auto grid max-w-page items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-14">
            <div>
              <Title as="h1" size="page" id="flights-title" className="text-cheap">
                <EmphText text={headline} />
              </Title>
              {ready ? (
                <p className="mt-6 max-w-[36em] text-body text-fg-2">통계청 소비자물가 중 국제항공료 · 해외단체여행비 지수(2020 = 100). 작년 같은 달과 비교하고, 원/달러 환율 월평균과 나란히 봅니다.</p>
              ) : (
                <p className="mt-6 max-w-[36em] text-body text-fg-2">준비 중 — 통계청 국제항공료 지수를 아직 받지 못했습니다. 받으면 이 자리 아래에 선 그래프 · 3D 비행기 · 작년 대비가 표시됩니다 (월 자료는 발표가 늦어 최근 몇 달을 매달 다시 받아 덮어씁니다).</p>
              )}
            </div>
            {board && (
              <div data-testid="hero-board" className="flex min-w-0 lg:justify-end">
                <FlapBoard rows={board.rows.map((r) => ({ ...r, tone: "dest" as const }))} cols={board.cols} label={board.label} />
              </div>
            )}
          </div>
        </section>
        {/* hero 바로 아래 새 구역 — 창밖으로 보는 12달 (작업 0229 · 모션 1번) · 지수가 없으면 구역 없음 */}
        <WindowMonths points={air} />
        {/* 창밖 12달 바로 아래 새 구역 — 인천 출발 1주 왕복의 출발일별 최저가 (작업 0234) · 기존 구역은 그대로 */}
        <AirfareCalendarSection calendar={airfare} />
        {/* 표 뒤 구간 — 옅은 면(surface-2) · 절취선 끝 동그라미(홈)는 없고 점선만 (작업 0218 사용자 지적 "동그라미가 없어야 하는거 아냐?") */}
        <div data-testid="flights-back" className="bg-surface-2 px-4 pt-[4.5rem] pb-10 sm:px-8 sm:pt-24">
          <div className="mx-auto max-w-page">
            {ready && (
              <>
                <SlideIn from="left">
                  <div data-testid="flights-ticket" className="relative grid rounded-[1.5rem] bg-card shadow-ticket lg:grid-cols-[minmax(0,1fr)_21rem]">
                    <div className="min-w-0 px-5 py-6 sm:px-8 sm:py-8">
                      <h2 className="text-[1.375rem] font-bold text-fg">국제항공료 · 해외단체여행비 지수와 환율 그래프</h2>
                      <div className="mt-2">
                        <FlightsGraph air={air} tour={tour} fx={fxMonthly} />
                      </div>
                    </div>
                    <div className="relative border-t-2 border-dashed border-line px-5 py-6 sm:px-8 sm:py-8 lg:border-t-0 lg:border-l-2">
                      <div data-testid="yoy-cards">
                        <h2 className="text-small font-bold text-fg">작년 대비와 가장 저렴한 달</h2>
                        <div className="mt-3 divide-y divide-line">
                          <YoyItem name="국제항공료" points={air} />
                          <YoyItem name="해외단체여행비" points={tour} />
                        </div>
                        {cheaps && (
                          <div className="border-t border-line pt-4">
                            <p className="text-small text-fg-2">{cheaps.label}</p>
                            <div data-testid="cheap-board" className="mt-2">
                              <MiniBoard text={cheaps.value} label={`가장 저렴한 달 ${cheaps.value}`} />
                            </div>
                            <p className="mt-2 flex items-center gap-2 text-small font-semibold text-fg">
                              <span aria-hidden className="size-2 shrink-0 rounded-full bg-sun ring-1 ring-fg" />
                              {cheaps.note}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </SlideIn>
                {strip && (
                  <FadeUpGroup data-testid="flights-strip" className="mt-8 grid border-t border-line sm:grid-cols-3 sm:divide-x sm:divide-line">
                    <div data-testid="strip-max" data-fu={0} className="py-5 sm:pr-6">
                      <p className="flex items-center gap-2 text-[1.125rem] font-bold text-fg">
                        <span aria-hidden className="size-2.5 rounded-full bg-pin-expensive" />
                        {strip.max.period} 최고
                      </p>
                      <p className="mt-1 text-small text-fg-2">국제항공료 지수 {strip.max.value.toFixed(1)}</p>
                    </div>
                    <div data-testid="strip-min" data-fu={1} className="border-t border-line py-5 sm:border-t-0 sm:px-6">
                      <p className="flex items-center gap-2 text-[1.125rem] font-bold text-fg">
                        <span aria-hidden className="size-2.5 rounded-full bg-sun ring-1 ring-fg" />
                        {strip.min.period} 최저
                      </p>
                      <p className="mt-1 text-small text-fg-2">국제항공료 지수 {strip.min.value.toFixed(1)}</p>
                    </div>
                    {strip.fx && (
                      <div data-testid="strip-fx" data-fu={2} className="border-t border-line py-5 sm:border-t-0 sm:pl-6">
                        <p className="flex items-center gap-2 text-[1.125rem] font-bold text-fg">
                          <span aria-hidden className="size-2.5 rounded-full bg-pin-line" />
                          원/달러 {Math.round(strip.fx.value).toLocaleString("ko-KR")}원
                        </p>
                        <p className="mt-1 text-small text-fg-2">{strip.fx.period} 월평균 · 한국수출입은행</p>
                      </div>
                    )}
                  </FadeUpGroup>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <PageFooter width="max-w-page" className="space-y-1">
        <p>자료: 통계청 KOSIS 소비자물가지수(국제항공료 · 해외단체여행비, 매달 최근 24개월) · 한국수출입은행 · <TextLink href="/about">소개 · 판단 기준</TextLink></p>
      </PageFooter>
    </>
  );
}

// 홈 — 빌드 때 받은 데이터로 그림 (작업 0169 · Figma 01) · 새 디자인(작업 0217 · 시안 B + 환전 타이밍 A) 위 → 아래: hero 캐러셀(블랙프라이데이 · 여행 타이밍 "N월에 떠나세요") → 12달 막대 → 도착지별 환전 타이밍 → 바닥 띠 (사진 · 3D 비행 경로 없음)
//   지수 · 환율 · 신호가 없으면 각 구간이 "아직 받지 못했습니다" 로 바뀜 (숫자를 지어내지 않음)
import type { Fetched } from "@hav/shared/api";
import { SiteNav } from "@/shared/nav/site-nav";
import type { FxLatest } from "@hav/shared/fx";
import type { IndicatorSeries } from "@hav/shared/indicators";
import type { PriceLevels } from "@hav/shared/prices";
import type { SignalList } from "@hav/shared/signal";
import { DestinationsSection } from "./destinations/destinations-section";
import { BfHero } from "./blackfriday/bf-hero";
import { HeroCarousel } from "./carousel/hero-carousel";
import { HeroSection } from "./timing/hero-section";
import type { CustomsRate } from "@/shared/customs/customs-rate";
import { HomeFooter } from "./home-footer";
import { RateTicker } from "@/shared/ticker/rate-ticker";
import { tickerDate, tickerItems } from "@/shared/ticker/ticker";
import { YearBars } from "./timing/year-bars";
import { type Destination, destinationRows } from "./common/destinations";
import { moreCurrenciesCount } from "./destinations/more-currencies";
import { DESTINATIONS } from "./common/places";
import { travelTiming } from "./timing/travel-timing";

export type HomeData = { latest: Fetched<FxLatest>; signals: Fetched<SignalList>; airFare: Fetched<IndicatorSeries>; /** 나라 페이지가 만들어지는 나라 코드 (작업 0344 countryTargets · 0347) */ pageCodes?: readonly string[]; /** 직구 계산기와 같은 관세청 과세환율(달러) · 블프 hero 계산기가 씀 (작업 0381) */ customs?: Record<string, CustomsRate> | null; /** 물가 수준 — 기본 hero 숫자 칸의 "물가" (작업 0393 · 못 받으면 null) */ levels?: PriceLevels | null };

export function Home({ latest, signals, airFare, customs = null, levels = null, pageCodes = [] }: HomeData) {
  const rates = latest.ok ? latest.data.rates : [];
  const signalRows = signals.ok ? signals.data.signals : [];
  const windowDays = signals.ok ? signals.data.rule.windowDays : 90;
  const timing = travelTiming(airFare.ok ? airFare.data.points : null);
  return (
    <>
      <SiteNav page="home" />
      <main id="main" tabIndex={-1}>
      {/* hero 캐러셀(작업 0385) — 두 장을 서버에서 만들어 넘겨 캐러셀 상태가 바뀌어도 hero 안은 다시 그려지지 않음 · 블프 기간(~2026-12-01 17:00 KST)이 끝나면 html data-hero 로 여행 타이밍 한 장만 보임 (작업 0381) */}
      <HeroCarousel
        ticker={<RateTicker items={tickerItems(rates, signalRows)} date={tickerDate(latest.ok ? latest.data.date : null)} variant="hero" />}
        slides={{
          bf: <BfHero rates={rates} customs={customs} />,
          sea: <HeroSection timing={timing} rates={rates} signals={signalRows} windowDays={windowDays} levels={levels} pageCodes={pageCodes} />,
        }}
      />
      <YearBars timing={timing} />
      <DestinationsSection rows={destinationRows(signalRows, rates, DESTINATIONS as Destination[])} windowDays={windowDays} moreCount={moreCurrenciesCount(rates, DESTINATIONS)} />
      </main>
      <HomeFooter />
    </>
  );
}

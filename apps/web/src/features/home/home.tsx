// 홈 — 빌드 때 받은 데이터로 그림 (작업 0169 · Figma 01) · 새 디자인(작업 0217 · 시안 B + 환전 타이밍 A) 위 → 아래: 파랑 첫 면(큰 문장 "N월에 떠나세요") → 탑승권 카드(출발 안내판 · 경계에 걸침) → 12달 막대 → 도착지별 환전 타이밍 → 바닥 띠 (사진 · 3D 비행 경로 없음)
//   지수 · 환율 · 신호가 없으면 각 구간이 "아직 받지 못했습니다" 로 바뀜 (숫자를 지어내지 않음)
import type { Fetched } from "@hav/shared/api";
import { SiteNav } from "@/shared/nav/site-nav";
import type { FxLatest } from "@hav/shared/fx";
import type { IndicatorSeries } from "@hav/shared/indicators";
import type { SignalList } from "@hav/shared/signal";
import { DestinationsSection } from "./destinations/destinations-section";
import { BfHero } from "./blackfriday/bf-hero";
import { HeroSection } from "./timing/hero-section";
import type { CustomsRate } from "@/shared/customs/customs-rate";
import { HomeFooter } from "./home-footer";
import { TodayBoard } from "./today/today-board";
import { YearBars } from "./timing/year-bars";
import { type Destination, destinationRows } from "./common/destinations";
import { moreCurrenciesCount } from "./destinations/more-currencies";
import { DESTINATIONS } from "./common/places";
import { travelTiming } from "./timing/travel-timing";

export type HomeData = { latest: Fetched<FxLatest>; signals: Fetched<SignalList>; airFare: Fetched<IndicatorSeries>; /** 나라 페이지가 만들어지는 나라 코드 (작업 0344 countryTargets · 0347) */ pageCodes?: readonly string[]; /** 직구 계산기와 같은 관세청 과세환율(달러) · 블프 hero 계산기가 씀 (작업 0381) */ customs?: Record<string, CustomsRate> | null };

export function Home({ latest, signals, airFare, pageCodes = [], customs = null }: HomeData) {
  const rates = latest.ok ? latest.data.rates : [];
  const signalRows = signals.ok ? signals.data.signals : [];
  const windowDays = signals.ok ? signals.data.rule.windowDays : 90;
  const timing = travelTiming(airFare.ok ? airFare.data.points : null);
  return (
    <>
      <SiteNav page="home" />
      <main id="main" tabIndex={-1}>
      {/* 블랙프라이데이 기간(~2026-12-01 17:00 KST)에만 블프 hero 가 기본 hero 대신 보임 — 둘 다 그리고 html data-hero 로 하나만 (작업 0381) */}
      <BfHero rates={rates} customs={customs} />
      <div className="bf-default">
        <HeroSection timing={timing} />
      </div>
      <TodayBoard rates={rates} signals={signalRows} windowDays={windowDays} problem={!latest.ok ? latest.reason : null} pageCodes={pageCodes} />
      <YearBars timing={timing} />
      <DestinationsSection rows={destinationRows(signalRows, rates, DESTINATIONS as Destination[])} windowDays={windowDays} moreCount={moreCurrenciesCount(rates, DESTINATIONS)} />
      </main>
      <HomeFooter />
    </>
  );
}

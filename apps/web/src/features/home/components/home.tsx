// 홈 — 빌드 때 받은 데이터로 그림 (작업 0169 · Figma 01) · 새 디자인(작업 0217 · 시안 B + 환전 타이밍 A) 위 → 아래: 파랑 첫 면(큰 문장 "N월에 떠나세요") → 탑승권 카드(출발 안내판 · 경계에 걸침) → 12달 막대 → 도착지별 환전 타이밍 → 바닥 띠 (사진 · 3D 비행 경로 없음)
//   지수 · 환율 · 신호가 없으면 각 구간이 "아직 받지 못했습니다" 로 바뀜 (숫자를 지어내지 않음)
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import type { FxLatest } from "@hav/shared/fx";
import type { IndicatorSeries } from "@hav/shared/indicators";
import type { SignalList } from "@hav/shared/signal";
import { DestinationsSection } from "./destinations-section";
import { HeroSection } from "./hero-section";
import { HomeFooter } from "./home-footer";
import { TodayBoard } from "./today-board";
import { YearBars } from "./year-bars";
import { type Destination, destinationRows } from "../lib/destinations";
import { moreCurrenciesCount } from "../lib/more-currencies";
import { DESTINATIONS } from "../lib/places";
import { travelTiming } from "../lib/travel-timing";

export type HomeData = { latest: Fetched<FxLatest>; signals: Fetched<SignalList>; airFare: Fetched<IndicatorSeries> };

export function Home({ latest, signals, airFare }: HomeData) {
  const rates = latest.ok ? latest.data.rates : [];
  const signalRows = signals.ok ? signals.data.signals : [];
  const windowDays = signals.ok ? signals.data.rule.windowDays : 90;
  const timing = travelTiming(airFare.ok ? airFare.data.points : null);
  return (
    <>
      <SiteNav page="home" />
      <main id="main" tabIndex={-1}>
      {/* 1024 이상: 제목(왼쪽) · 탑승권 카드(오른쪽) 두 단 — 파랑 면이 카드를 품음 · 1023 이하는 위아래로 쌓임 (작업 0245) */}
      <div className="lg:grid lg:grid-cols-[minmax(2rem,1fr)_minmax(0,31rem)_minmax(0,44rem)_minmax(2rem,1fr)] lg:bg-pin-cheap">
        <HeroSection timing={timing} />
        <TodayBoard rates={rates} signals={signalRows} windowDays={windowDays} problem={!latest.ok ? latest.reason : null} />
      </div>
      <YearBars timing={timing} />
      <DestinationsSection rows={destinationRows(signalRows, rates, DESTINATIONS as Destination[])} windowDays={windowDays} moreCount={moreCurrenciesCount(rates, DESTINATIONS)} />
      </main>
      <HomeFooter />
    </>
  );
}

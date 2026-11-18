// 홈 — 빌드 때 받은 데이터로 그림 (작업 0169 · Figma 01) · 위 → 아래: 여행 타이밍(사진 · 큰 문장) → 오늘 환율(출발 안내판 · 사진에 걸침 · 3D 지구) → 여행 타이밍 그래프 → 도착지별 환전 타이밍 → 바닥 띠 (작업 0177)
//   지수 · 환율 · 신호가 없으면 각 구간이 "아직 받지 못했습니다" 로 바뀜 (숫자를 지어내지 않음)
import type { Fetched } from "@/shared/api";
import { SiteNav } from "@/shared/site-nav";
import type { FxLatest } from "@hav/shared/fx";
import type { IndicatorSeries } from "@hav/shared/indicators";
import type { SignalList } from "@hav/shared/signal";
import { DestinationsSection } from "./destinations-section";
import { HomeFooter } from "./home-footer";
import { TodayBoard } from "./today-board";
import { TravelTimingGraph, TravelTimingSection } from "./travel-timing-section";
import { type Destination, cheapestDestination, destinationRows } from "../lib/destinations";
import { moreCurrenciesCount } from "../lib/more-currencies";
import { DESTINATIONS } from "../lib/places";
import { boardCountry } from "../lib/today-board";
import { travelTiming } from "../lib/travel-timing";

export type HomeData = { latest: Fetched<FxLatest>; signals: Fetched<SignalList>; airFare: Fetched<IndicatorSeries> };

export function Home({ latest, signals, airFare }: HomeData) {
  const rates = latest.ok ? latest.data.rates : [];
  const signalRows = signals.ok ? signals.data.signals : [];
  const windowDays = signals.ok ? signals.data.rule.windowDays : 90;
  // 안 고른 상태의 머리 사진 = 안내판 기본 도착지 나라 (같은 계산 · 서버 HTML 에서 바로 · 작업 0209)
  const boardPlace = boardCountry(cheapestDestination(signalRows, rates, DESTINATIONS as Destination[]));
  const timing = travelTiming(airFare.ok ? airFare.data.points : null);
  return (
    <>
      <SiteNav page="home" />
      <TravelTimingSection timing={timing} country={boardPlace} />
      <TodayBoard rates={rates} signals={signalRows} windowDays={windowDays} problem={!latest.ok ? latest.reason : null} />
      <TravelTimingGraph timing={timing} />
      <DestinationsSection rows={destinationRows(signalRows, rates, DESTINATIONS as Destination[])} windowDays={windowDays} moreCount={moreCurrenciesCount(rates, DESTINATIONS)} />
      <HomeFooter />
    </>
  );
}

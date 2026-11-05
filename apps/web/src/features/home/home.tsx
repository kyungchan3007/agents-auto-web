// 홈 — 빌드 때 받은 데이터로 그림 · docs/design.md "홈 화면 흐름" 순서대로
//   1 첫 화면(지구본) → 2 여행지 고르기 → 3 통화 전체 → 4 1년 흐름 → 5 직구 계산기 입구
//   6 만드는 중 입구는 뺌 (2026-10-29 사용자: "이건 없어도 돼 버려" · 작업 0079) — 꼬리말 링크로 /log
import { SiteNav } from "@/shared/site-nav";
import { CalcSection } from "./calc-section";
import { CurrenciesSection } from "./currencies-section";
import { HeroSection } from "./hero-section";
import { type HomeData, homeView } from "./home-data";
import { HomeFooter } from "./home-footer";
import { TripsSection } from "./trips-section";
import { YearSection } from "./year-section";

export type { HomeData };

export function Home(data: HomeData) {
  const view = homeView(data);
  return (
    <>
      <SiteNav page="home" />
      <HeroSection view={view} />
      <TripsSection stops={view.stops} />
      <CurrenciesSection view={view} />
      <YearSection view={view} />
      <CalcSection />
      <HomeFooter windowDays={view.windowDays} />
    </>
  );
}

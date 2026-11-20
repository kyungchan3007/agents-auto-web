import type { Metadata } from "next";
import { FlightsPage } from "@/features/travel-price/components/flights-page";
import { fxMonthlyAverage } from "@/features/travel-price/lib/travel-index";
import { api } from "@/shared/api";

export const metadata: Metadata = {
  title: "여행 타이밍 · 항공료 · 단체여행비 물가지수 · Flapfx",
  alternates: { canonical: "/flights" },
  description: "국제항공료 · 해외단체여행비 소비자물가지수 — 작년 같은 달과 비교하고 어느 달이 싼 편인지 · 원/달러 환율 월평균과 나란히",
};

// 여행 품목 지수(통계청 KOSIS)는 빌드 때 우리 API 에서 — 두 품목 5년치 + 같은 기간 원/달러 · 못 받으면 "준비 중" (숫자를 만들지 않음)
export default async function Page() {
  const [air, tour, usd, airfare] = await Promise.all([api.indicator("kosis-cpi:air-fare", 60), api.indicator("kosis-cpi:package-tour", 60), api.history("USD", 1000), api.airfareCalendar()]);
  const travel = [
    { key: "air-fare", name: "국제항공료", points: air.ok ? air.data.points : null },
    { key: "package-tour", name: "해외단체여행비", points: tour.ok ? tour.data.points : null },
  ];
  // 항공권 출발일 달력(작업 0234)은 못 받으면 구역이 "아직 받지 못했습니다"로 — 빌드를 멈추지 않음 (없어도 다른 구역은 그대로)
  return <FlightsPage travel={travel} fxMonthly={usd.ok ? fxMonthlyAverage(usd.data.rates) : []} airfare={airfare.ok ? airfare.data : null} />;
}

import type { Metadata } from "next";
import { FlightsPage } from "@/features/travel-price/components/flights-page";
import { fxMonthlyAverage } from "@/features/travel-price/lib/travel-index";
import { api } from "@/shared/api";

export const metadata: Metadata = {
  title: "여행 타이밍 · 항공료 · 단체여행비 물가지수 · Tripfx",
  alternates: { canonical: "/flights" },
  description: "국제항공료 · 해외단체여행비 소비자물가지수 — 작년 같은 달과 비교하고 어느 달이 싼 편인지 · 원/달러 환율 월평균과 나란히",
};

// 여행 품목 지수(통계청 KOSIS)는 빌드 때 우리 API 에서 — 두 품목 5년치 + 같은 기간 원/달러 · 못 받으면 "준비 중" (숫자를 만들지 않음)
export default async function Page() {
  const [air, tour, usd] = await Promise.all([api.indicator("kosis-cpi:air-fare", 60), api.indicator("kosis-cpi:package-tour", 60), api.history("USD", 1000)]);
  const travel = [
    { key: "air-fare", name: "국제항공료", points: air.ok ? air.data.points : null },
    { key: "package-tour", name: "해외단체여행비", points: tour.ok ? tour.data.points : null },
  ];
  return <FlightsPage travel={travel} fxMonthly={usd.ok ? fxMonthlyAverage(usd.data.rates) : []} />;
}

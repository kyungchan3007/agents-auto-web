import type { Metadata } from "next";
import { PricePage } from "@/features/travel-price/components/price-page";
import { fxMonthlyAverage } from "@/features/travel-price/lib/travel-index";
import { api } from "@/shared/api";

export const metadata: Metadata = {
  title: "여행 물가 · Tripfx",
  alternates: { canonical: "/prices" },
  description: "한국보다 물가가 싼 여행지 · 비싼 여행지 — 세계은행 물가 자료 · 오늘 그 나라 통화 신호",
};

// 물가 · 신호는 빌드 때 우리 API 에서 (매일 다시 빌드)
export default async function Page() {
  // 여행 품목 지수(통계청 · 작업 0164): 두 품목 5년치 + 같은 기간 원/달러 — 못 받으면 "준비 중" (숫자를 만들지 않음)
  const [levels, signals, air, tour, usd] = await Promise.all([api.priceLevels(), api.signals(), api.indicator("kosis-cpi:air-fare", 60), api.indicator("kosis-cpi:package-tour", 60), api.history("USD", 1000)]);
  const travel = [
    { key: "air-fare", name: "국제항공료", points: air.ok ? air.data.points : null },
    { key: "package-tour", name: "해외단체여행비", points: tour.ok ? tour.data.points : null },
  ];
  return <PricePage levels={levels} signals={signals} travel={travel} fxMonthly={usd.ok ? fxMonthlyAverage(usd.data.rates) : []} />;
}

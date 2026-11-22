import type { Metadata } from "next";
import { PricePage } from "@/features/travel-price/components/price-page";
import { api } from "@/shared/api";
import { JsonLd } from "@/shared/json-ld";
import { breadcrumbLd, pageMeta } from "@/shared/seo";

export const metadata: Metadata = pageMeta({ path: "/prices", title: "여행 물가 · Flapfx", description: "한국보다 물가가 싼 여행지 · 비싼 여행지 — 세계은행 물가 자료 · 오늘 그 나라 통화 신호" });

// 물가 · 신호는 빌드 때 우리 API 에서 (매일 다시 빌드)
export default async function Page() {
  const [levels, signals] = await Promise.all([api.priceLevels(), api.signals()]);
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "여행 물가", path: "/prices" }])} />
      <PricePage levels={levels} signals={signals} />
    </>
  );
}

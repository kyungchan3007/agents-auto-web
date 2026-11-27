import type { Metadata } from "next";
import { loadSideViews } from "@/features/prices/country/load";
import { PricePage } from "@/features/prices/price-page";
import { sideEntry } from "@/features/prices/side/side-view";
import { api } from "@hav/shared/api";
import { JsonLd } from "@/shared/seo/json-ld";
import { breadcrumbLd, pageMeta } from "@/shared/seo/seo";

export const metadata: Metadata = pageMeta({ path: "/prices", title: "여행지 물가 비교 · 한국보다 싼 나라 · 비싼 나라 · Flapfx", description: "한국보다 물가가 싼 여행지 · 비싼 여행지 — 세계은행 물가 자료 · 오늘 그 나라 통화 신호" });

// 물가 · 신호는 빌드 때 우리 API 에서 (매일 다시 빌드)
export default async function Page() {
  const [levels, signals] = await Promise.all([api.priceLevels(), api.signals()]);
  // 목록 나라 사이드바 내용 — 나라 페이지와 같은 계산 · 물가를 못 받았으면 비워 링크 그대로 (작업 0361)
  const side = levels.ok ? (await loadSideViews(levels.data)).map(sideEntry) : [];
  return (
    <>
      <JsonLd data={breadcrumbLd([{ name: "여행 물가", path: "/prices" }])} />
      <PricePage levels={levels} signals={signals} side={side} />
    </>
  );
}

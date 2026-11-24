import type { MetadataRoute } from "next";
import { api } from "@hav/shared/api";
import { PUBLIC_PAGES, SITE_URL } from "@/shared/site";
import { sitemapEntries } from "@/shared/seo/sitemap-entries";
import { loadTargets } from "@/features/prices/country/load";

// 빌드 때 한 번 만듦 (정적 내보내기) · 통화 상세는 API 가 준 통화 전부 — 통화 페이지(generateStaticParams)와 같은 목록
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [latest, airfare, countries] = await Promise.all([api.latest(), api.airfareCalendar(), loadTargets()]);
  // 환율을 안 보여 주는 /flights 의 갱신일 — 항공권 달력을 받은 날 (받지 못하면 넣지 않음) · /about 은 글이 매일 바뀌지 않아 날짜를 넣지 않음
  return sitemapEntries(SITE_URL, PUBLIC_PAGES, latest.ok ? latest.data.rates : [], { "/flights": airfare.ok ? airfare.data.fetchedOn : null }, countries);
}

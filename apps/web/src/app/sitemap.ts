import type { MetadataRoute } from "next";
import { api } from "@/shared/api";
import { PUBLIC_PAGES, SITE_URL } from "@/shared/site";
import { sitemapEntries } from "@/shared/sitemap-entries";

// 빌드 때 한 번 만듦 (정적 내보내기) · 통화 상세는 API 가 준 통화 전부 — 통화 페이지(generateStaticParams)와 같은 목록
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const latest = await api.latest();
  return sitemapEntries(SITE_URL, PUBLIC_PAGES, latest.ok ? latest.data.rates : []);
}

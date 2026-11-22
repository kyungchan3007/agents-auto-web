import type { MetadataRoute } from "next";
import { api } from "@/shared/api";
import { PUBLIC_PAGES, SITE_URL } from "@/shared/site";
import { sitemapEntries } from "@/shared/sitemap-entries";

// 빌드 때 한 번 만듦 (정적 내보내기) · 통화 상세는 API 가 준 통화 전부 — 통화 페이지(generateStaticParams)와 같은 목록
export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [latest, airfare, signals] = await Promise.all([api.latest(), api.airfareCalendar(), api.signals()]);
  // 환율을 안 보여 주는 두 페이지의 갱신일 — 항공권 달력을 받은 날 · 소개가 설명하는 신호의 가장 최근 환율 날짜 (받지 못하면 날짜를 넣지 않음)
  const signalDate = signals.ok ? signals.data.signals.reduce<string | null>((m, s) => (s.latest && (m === null || s.latest.date > m) ? s.latest.date : m), null) : null;
  return sitemapEntries(SITE_URL, PUBLIC_PAGES, latest.ok ? latest.data.rates : [], { "/flights": airfare.ok ? airfare.data.fetchedOn : null, "/about": signalDate });
}

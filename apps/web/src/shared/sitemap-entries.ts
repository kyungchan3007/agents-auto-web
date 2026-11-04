// sitemap 항목 — 환율을 보여 주는 페이지만 실제 환율 기준일을 lastModified 로 (작업 0114) · 못 받으면 날짜를 만들지 않음 (FX-02)
import type { FxRate } from "@hav/shared/fx";

const RATE_PAGES = new Set<string>(["/", "/currencies", "/prices", "/calc"]);

export function sitemapEntries(siteUrl: string, pages: readonly string[], rates: Pick<FxRate, "currency" | "date">[]) {
  const latest = rates.reduce<string | null>((m, r) => (m === null || r.date > m ? r.date : m), null);
  return [
    ...pages.map((p) => ({
      url: `${siteUrl}${p}`,
      changeFrequency: "daily" as const,
      priority: p === "/" ? 1 : 0.8,
      ...(latest && RATE_PAGES.has(p) ? { lastModified: latest } : {}),
    })),
    ...rates.map((r) => ({ url: `${siteUrl}/currencies/${r.currency}`, changeFrequency: "daily" as const, priority: 0.5, lastModified: r.date })),
  ];
}

// sitemap 항목 — 환율을 보여 주는 페이지만 실제 환율 기준일을 lastModified 로 (작업 0114) · 못 받으면 날짜를 만들지 않음 (FX-02)
// 그 밖의 페이지(/flights · /about)는 자료 갱신일을 pageDates 로 받음 — 없으면 넣지 않음 (작업 0304)
import type { FxRate } from "@hav/shared/fx";

const RATE_PAGES = new Set<string>(["/", "/currencies", "/prices", "/calc"]);

export function sitemapEntries(siteUrl: string, pages: readonly string[], rates: Pick<FxRate, "currency" | "date">[], pageDates: Record<string, string | null | undefined> = {}) {
  const latest = rates.reduce<string | null>((m, r) => (m === null || r.date > m ? r.date : m), null);
  return [
    ...pages.map((p) => ({
      url: `${siteUrl}${p}`,
      changeFrequency: "daily" as const,
      priority: p === "/" ? 1 : 0.8,
      ...(latest && RATE_PAGES.has(p) ? { lastModified: latest } : pageDates[p] ? { lastModified: pageDates[p] } : {}),
    })),
    ...rates.map((r) => ({ url: `${siteUrl}/currencies/${r.currency}`, changeFrequency: "daily" as const, priority: 0.5, lastModified: r.date })),
  ];
}

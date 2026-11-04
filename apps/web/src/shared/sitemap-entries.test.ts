import { describe, expect, it } from "vitest";
import { sitemapEntries } from "./sitemap-entries";

describe("sitemap 항목 (작업 0114)", () => {
  it("환율 페이지 · 통화 상세만 실제 기준일 · 작업실은 날짜 없음", () => {
    const r = sitemapEntries("https://x", ["/", "/log"], [{ currency: "USD", date: "2026-11-04" }, { currency: "JPY", date: "2026-11-03" }]);
    expect(r).toEqual([
      { url: "https://x/", changeFrequency: "daily", priority: 1, lastModified: "2026-11-04" },
      { url: "https://x/log", changeFrequency: "daily", priority: 0.8 },
      { url: "https://x/currencies/USD", changeFrequency: "daily", priority: 0.5, lastModified: "2026-11-04" },
      { url: "https://x/currencies/JPY", changeFrequency: "daily", priority: 0.5, lastModified: "2026-11-03" },
    ]);
  });

  it("환율을 못 받으면 날짜를 만들지 않음", () => {
    expect(sitemapEntries("https://x", ["/"], [])).toEqual([{ url: "https://x/", changeFrequency: "daily", priority: 1 }]);
  });
});

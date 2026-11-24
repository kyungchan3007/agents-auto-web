import { describe, expect, it } from "vitest";
import { sitemapEntries } from "../shared/seo/sitemap-entries";

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
  it("나라별 여행 물가 /prices/[code] — 5번째 인자로 받은 나라 코드마다 한 줄 (작업 0344) · 환율 기준일이 있으면 그 날", () => {
    const r = sitemapEntries("https://x", ["/prices"], [{ currency: "USD", date: "2026-11-04" }], {}, ["JPN", "MAC"]);
    expect(r).toContainEqual({ url: "https://x/prices/JPN", changeFrequency: "daily", priority: 0.6, lastModified: "2026-11-04" });
    expect(r).toContainEqual({ url: "https://x/prices/MAC", changeFrequency: "daily", priority: 0.6, lastModified: "2026-11-04" });
    expect(r.filter((e) => e.url.includes("/prices/"))).toHaveLength(2);
  });

  it("나라 코드를 안 주면 지금과 같음 · 환율을 못 받으면 나라 줄에도 날짜를 만들지 않음 (작업 0344)", () => {
    expect(sitemapEntries("https://x", ["/"], [])).toEqual([{ url: "https://x/", changeFrequency: "daily", priority: 1 }]);
    expect(sitemapEntries("https://x", [], [], {}, ["JPN"])).toEqual([{ url: "https://x/prices/JPN", changeFrequency: "daily", priority: 0.6 }]);
  });
});

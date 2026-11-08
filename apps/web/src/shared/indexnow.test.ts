import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { INDEXNOW_KEY, changedUrls, indexNowBody, parseSitemap } from "./indexnow";
import { SITE_URL } from "./site";

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>https://tripfx.pages.dev/</loc><lastmod>2026-11-09</lastmod></url>
<url><loc>https://tripfx.pages.dev/about</loc><lastmod>2026-11-01T00:00:00.000Z</lastmod></url>
<url><loc>https://tripfx.pages.dev/currencies/USD</loc><lastmod>2026-11-09</lastmod></url>
<url><loc>https://tripfx.pages.dev/geo</loc></url>
<url><loc>https://evil.example/</loc><lastmod>2026-11-09</lastmod></url>
</urlset>`;

describe("IndexNow 색인 요청 (작업 0144)", () => {
  const entries = parseSitemap(xml, SITE_URL);
  it("sitemap 에서 이 사이트 주소와 변경일만", () => {
    expect(entries).toEqual([
      { loc: "https://tripfx.pages.dev/", lastmod: "2026-11-09" },
      { loc: "https://tripfx.pages.dev/about", lastmod: "2026-11-01" },
      { loc: "https://tripfx.pages.dev/currencies/USD", lastmod: "2026-11-09" },
      { loc: "https://tripfx.pages.dev/geo", lastmod: null },
    ]);
  });
  it("그날 바뀐 주소만 · 전부 보내기 · 바뀐 것이 없으면 빈 목록", () => {
    expect(changedUrls(entries, "2026-11-09")).toEqual(["https://tripfx.pages.dev/", "https://tripfx.pages.dev/currencies/USD"]);
    expect(changedUrls(entries, "2026-11-09", true)).toHaveLength(4);
    expect(changedUrls(entries, "2026-11-10")).toEqual([]);
  });
  it("요청 본문 — 호스트 · 키 · 키 파일 주소", () => {
    expect(indexNowBody(["https://tripfx.pages.dev/"], SITE_URL)).toEqual({
      host: "tripfx.pages.dev",
      key: INDEXNOW_KEY,
      keyLocation: `https://tripfx.pages.dev/${INDEXNOW_KEY}.txt`,
      urlList: ["https://tripfx.pages.dev/"],
    });
  });
  it("키 파일이 public 에 있고 내용이 키와 같음 (다르면 403)", () => {
    const file = readFileSync(fileURLToPath(new URL(`../../public/${INDEXNOW_KEY}.txt`, import.meta.url)), "utf8");
    expect(file.trim()).toBe(INDEXNOW_KEY);
  });
});

// IndexNow 색인 요청 — sitemap 에서 바뀐 주소만 골라 요청 본문을 만든다 (순수 함수 · 작업 0144)
//   IndexNow 는 Bing · 네이버 · Yandex 등이 함께 받는다 · 키는 공개 파일(public/<키>.txt)이 원래 방식이라 비밀값이 아님
//   보내기는 scripts/indexnow.ts (GitHub Actions indexnow.yml) · node 가 바로 읽도록 import 없이 사이트 주소를 인자로 받음

export const INDEXNOW_KEY = "a6932e161e92d438629d7ca38466be2c";
export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS = 10_000; // IndexNow 한 번에 보낼 수 있는 최대

export type SitemapEntry = { loc: string; lastmod: string | null };

/** sitemap.xml → 주소 · 변경일 (이 사이트 주소만) */
export function parseSitemap(xml: string, site: string): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  for (const m of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
    const loc = /<loc>\s*([^<\s]+)\s*<\/loc>/.exec(m[1])?.[1];
    if (!loc || !(loc === site || loc.startsWith(`${site}/`))) continue;
    out.push({ loc, lastmod: /<lastmod>\s*([^<\s]+)\s*<\/lastmod>/.exec(m[1])?.[1]?.slice(0, 10) ?? null });
  }
  return out;
}

/** 보낼 주소 — since 날짜(포함) 이후에 바뀐 것 · all 이면 전부 */
export function changedUrls(entries: SitemapEntry[], since: string, all = false): string[] {
  return [...new Set(entries.filter((e) => all || (e.lastmod !== null && e.lastmod >= since)).map((e) => e.loc))].slice(0, MAX_URLS);
}

export function indexNowBody(urls: string[], site: string) {
  return { host: new URL(site).host, key: INDEXNOW_KEY, keyLocation: `${site}/${INDEXNOW_KEY}.txt`, urlList: urls };
}

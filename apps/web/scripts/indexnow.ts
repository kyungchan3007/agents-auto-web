// GitHub Actions 가 부름: 운영 sitemap 에서 오늘(한국 날짜) 바뀐 주소를 IndexNow 로 알림 (작업 0144)
//   node --experimental-strip-types apps/web/scripts/indexnow.ts [--all]
//   응답은 상태 코드만 출력 · 바뀐 주소가 없으면 보내지 않음
import { INDEXNOW_ENDPOINT, changedUrls, indexNowBody, parseSitemap } from "../src/shared/indexnow.ts";
import { SITE_URL } from "../src/shared/site.ts";

const all = process.argv.includes("--all");
const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);

const res = await fetch(`${SITE_URL}/sitemap.xml`, { signal: AbortSignal.timeout(30_000) });
if (!res.ok) throw new Error(`sitemap 받기 실패: HTTP ${res.status}`);
const urls = changedUrls(parseSitemap(await res.text(), SITE_URL), today, all);
if (urls.length === 0) {
  console.log(`오늘(${today}) 바뀐 주소가 없어 보내지 않음`);
  process.exit(0);
}
const sent = await fetch(INDEXNOW_ENDPOINT, {
  method: "POST",
  headers: { "content-type": "application/json; charset=utf-8" },
  body: JSON.stringify(indexNowBody(urls, SITE_URL)),
  signal: AbortSignal.timeout(30_000),
});
console.log(`IndexNow ${urls.length}개 주소 보냄 · HTTP ${sent.status}`);
// 200 · 202 = 받음 · 그 밖은 실패 (400 형식 · 403 키 · 422 주소 · 429 너무 잦음)
if (sent.status !== 200 && sent.status !== 202) process.exit(1);

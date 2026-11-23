// 작업 0322 — GA4 태그는 운영 주소에서만 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   요구 1: flapfx.com · www.flapfx.com 에서는 googletagmanager.com/gtag/js?id=G-9B9FLT5S9X 를 불러 page_view 를 보냄
//   요구 2: 미리보기(*.workers.dev) · localhost · 어드민(admin.flapfx.com) 에서는 요청 0개 · 페이지에 gtag 스크립트 없음
//   운영 주소 흉내: 브라우저 요청 https://<호스트>/… 를 로컬 서버(e2e 서버)로 돌려 줌 — 화면은 그 호스트에서 열린 것처럼 hostname 이 바뀜
//   googletagmanager.com 은 실제로 나가지 않게 가로채 빈 스크립트로 답함 (네트워크 요청 없음)
import { type BrowserContext, type Page, expect, test } from "@playwright/test";

const ID = "G-9B9FLT5S9X";
const LOCAL = "http://127.0.0.1:4399";

async function mimic(context: BrowserContext, host: string) {
  const seen: string[] = [];
  await context.route(/googletagmanager\.com|google-analytics\.com/, async (route) => {
    seen.push(route.request().url());
    await route.fulfill({ status: 200, contentType: "application/javascript", body: "/* gtag stub */" });
  });
  await context.route(new RegExp(`^https://${host.replace(/\./g, "\\.")}/`), async (route) => {
    const u = new URL(route.request().url());
    try {
      await route.fulfill({ response: await route.fetch({ url: `${LOCAL}${u.pathname}${u.search}` }) });
    } catch {
      await route.abort();
    }
  });
  return seen;
}
async function openAs(page: Page, host: string, path = "/about") {
  const seen = await mimic(page.context(), host);
  await page.goto(`https://${host}${path}`, { waitUntil: "domcontentloaded" });
  // afterInteractive 스크립트가 붙을 시간
  await page.waitForLoadState("load");
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));
  // 그 호스트로 열린 진짜 화면인지 — 못 열렸는데 '요청 0개' 로 통과하지 않게
  expect(await page.evaluate(() => location.hostname), "열린 호스트").toBe(host);
  expect((await page.locator("main").first().innerText()).length, "본문이 그려짐").toBeGreaterThan(20);
  return seen;
}
const gtagScripts = (page: Page) => page.locator('script[src*="googletagmanager.com"]').count();

test.describe("GA4 태그 — 운영 주소에서만 (작업 0322)", () => {
  for (const host of ["flapfx.com", "www.flapfx.com"]) {
    test(`요구 1: ${host} 에서는 gtag.js(id=${ID})를 불러오고 page_view 를 보냄`, async ({ page }) => {
      const seen = await openAs(page, host);
      const js = seen.filter((u) => u.includes("googletagmanager.com/gtag/js"));
      expect(js.length, "gtag.js 요청").toBeGreaterThanOrEqual(1);
      expect(js[0], "측정 ID").toContain(`id=${ID}`);
      expect(await gtagScripts(page), "gtag 스크립트 태그").toBeGreaterThanOrEqual(1);
      const layer = await page.evaluate(() => JSON.stringify((window as unknown as { dataLayer?: unknown[] }).dataLayer ?? []));
      expect(layer, "dataLayer 에 측정 ID 설정").toContain(ID);
    });
  }

  for (const host of ["admin.flapfx.com", "agents-auto-web.workers.dev", "preview-0322.hav.workers.dev"]) {
    test(`요구 2: ${host} 에서는 구글 쪽 요청 0개 · gtag 스크립트 없음 · dataLayer 없음`, async ({ page }) => {
      const seen = await openAs(page, host);
      expect(seen, "구글 요청").toEqual([]);
      expect(await gtagScripts(page), "gtag 스크립트 태그").toBe(0);
      const has = await page.evaluate(() => "dataLayer" in window || "gtag" in window);
      expect(has, "dataLayer · gtag 전역").toBe(false);
    });
  }

  test("요구 2: 로컬 e2e 서버(127.0.0.1)에서도 요청 0개 · gtag 스크립트 없음", async ({ page }) => {
    const seen: string[] = [];
    page.on("request", (r) => {
      if (/googletagmanager\.com|google-analytics\.com/.test(r.url())) seen.push(r.url());
    });
    await page.goto("/about");
    await page.waitForLoadState("load");
    await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));
    expect(seen, "구글 요청").toEqual([]);
    expect(await gtagScripts(page), "gtag 스크립트 태그").toBe(0);
  });

  test("요구 5: 운영 주소에서도 화면 모양은 같음 — 같은 글 · 가로 넘침 0", async ({ page }) => {
    await openAs(page, "flapfx.com");
    const prod = await page.locator("main").first().innerText();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    await page.goto("/about");
    expect(await page.locator("main").first().innerText(), "운영 주소와 로컬의 본문 글").toBe(prod);
  });
});

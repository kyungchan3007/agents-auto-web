import { chromium, devices } from "@playwright/test";
const OUT = process.argv[2];
const BASE = "http://127.0.0.1:4399";
const st = { cookies: [], origins: [{ origin: BASE, localStorage: [{ name: "flapfx:intro-off", value: "1" }] }] };
const b = await chromium.launch({ channel: "chrome" });
for (const [name, dev] of [["wide", { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } }], ["phone", { ...devices["Pixel 7"], viewport: { width: 390, height: 844 } }]]) {
  const ctx = await b.newContext({ ...dev, storageState: st, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  for (const [slug, path] of [["home", "/"], ["usd", "/currencies/USD"], ["prices", "/prices"], ["calc", "/calc"], ["flights", "/flights"]]) {
    await p.goto(BASE + path); await p.waitForTimeout(1200);
    await p.screenshot({ path: `${OUT}/${slug}-${name}.png`, fullPage: true });
  }
  await ctx.close();
}
await b.close();

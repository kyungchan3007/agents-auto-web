// 큰 제목 · 큰 숫자 글꼴 Pretendard 800 — 작업 0176 · 실행은 lead 가 PR 직전에 (빌드한 사이트를 읽음)
// 사용자 "너무 뚱뚱해서 보기 힘들다 … A안 Pretendard 800" · 레이아웃 깨짐 확인: 375 · 1440 에서 홈 · 통화 · 직구 · 여행 물가
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/currencies/USD", "/calc", "/prices"];

for (const width of [375, 1440]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    for (const path of PAGES) {
      test(`${path} — 가로로 넘치지 않음`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle"); // 기존 반응형 · 기능 e2e 와 같게 — 하이드레이션 · 글꼴 교체가 끝난 뒤 잼
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "가로 넘침").toBeLessThanOrEqual(0);
      });

      test(`${path} — 큰 제목은 Pretendard 800 · 자간 -0.03em @design`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        await page.evaluate(() => document.fonts.ready);
        const h1 = await page.getByRole("heading", { level: 1 }).first().evaluate((el) => {
          const s = getComputedStyle(el);
          return { family: s.fontFamily, weight: s.fontWeight, size: parseFloat(s.fontSize), spacing: parseFloat(s.letterSpacing) };
        });
        expect(h1.family).toMatch(/Pretendard/);
        expect(h1.family).not.toMatch(/Gasoek/i);
        expect(Number(h1.weight)).toBe(800);
        expect(h1.spacing / h1.size, "자간(em)").toBeCloseTo(-0.03, 2);
      });
    }

    test("font-display 를 쓰는 모든 요소(큰 제목 · 큰 숫자)가 Pretendard 800 · 숫자는 같은 폭 @design", async ({ page }) => {
      await page.goto("/calc");
      await page.locator('[data-testid="calc-input"]').getByLabel(/물건 값/).fill("180");
      await page.evaluate(() => document.fonts.ready);
      const styles = await page.locator(".font-display").evaluateAll((els) => els.map((el) => ({ text: (el.textContent ?? "").slice(0, 20), family: getComputedStyle(el).fontFamily, weight: getComputedStyle(el).fontWeight })));
      expect(styles.length).toBeGreaterThan(0);
      for (const s of styles) {
        expect(s.family, s.text).toMatch(/Pretendard/);
        expect(Number(s.weight), s.text).toBe(800);
      }
      const nums = await page.locator('[data-testid="calc-result"] .tabular-nums').first().evaluate((el) => getComputedStyle(el).fontVariantNumeric);
      expect(nums).toContain("tabular-nums");
    });
  });
}

test("본문은 그대로 IBM Plex Sans KR @design", async ({ page }) => {
  await page.goto("/");
  const family = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  expect(family).toMatch(/IBM_Plex_Sans_KR|IBM Plex Sans KR/i);
  expect(family).not.toMatch(/^"?Pretendard/);
});

test("자체 호스팅 — 글꼴 요청이 모두 같은 주소 · Pretendard 는 필요한 조각 몇 개만(전부 받지 않음)", async ({ page, baseURL }) => {
  const fonts: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "font") fonts.push(r.url());
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const origin = new URL(baseURL ?? "http://127.0.0.1:4399").origin;
  expect(fonts.filter((u) => !u.startsWith(origin)), "외부 글꼴 요청").toEqual([]);
  const pret = fonts.filter((u) => u.includes("/fonts/pretendard/Pretendard-ExtraBold.subset."));
  expect(pret.length, "받은 Pretendard 조각").toBeGreaterThan(0);
  expect(pret.length, "조각 92개 전부를 받지 않음 (unicode-range)").toBeLessThanOrEqual(30);
});

test("바다 띠 · 사진 위 큰 글씨도 가로로 안 넘침 — 홈 · /about · /flights (375)", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  for (const path of ["/", "/about", "/flights"]) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), path).toBeLessThanOrEqual(0);
  }
});

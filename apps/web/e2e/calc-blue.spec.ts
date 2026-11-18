// 작업 0221 사용자 결정 — /calc 머리 파랑 면 (넓은 화면 1280 · 휴대폰) · 테스트 먼저
//   표시: data-testid="calc-band"(파랑 띠) · "calc-input"(입력 카드) · "calc-result"(결과 꼬리표) · "calc-summary"(휴대폰 요약 줄)
//   크기 고정(0208)은 calc-redesign · calc-design · calc-gap 이 그대로 검사
import { type Page, expect, test } from "@playwright/test";

const BLUE = "rgb(36, 56, 168)"; // --hav-pin-cheap #2438A8
const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`).first();
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const lum = (rgb: string) => {
  const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number).map((v) => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const settle = async (page: Page) => { await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/calc"); await page.waitForTimeout(500); };

test.describe("/calc 파랑 머리 (작업 0221 사용자 결정)", () => {
  test("파랑 띠가 메뉴 바로 아래부터 이어짐(메뉴와 한 면) · 색은 #2438A8 · 화면 폭 전체", async ({ page }) => {
    await settle(page);
    const nav = await page.locator("header").first().boundingBox();
    const band = await tid(page, "calc-band").boundingBox();
    expect(band).not.toBeNull();
    const width = page.viewportSize()?.width ?? 0;
    expect(Math.abs((band?.y ?? 0) - ((nav?.y ?? 0) + (nav?.height ?? 0)))).toBeLessThanOrEqual(1.5);
    expect(band?.x ?? 1).toBeLessThanOrEqual(0.5);
    expect((band?.width ?? 0)).toBeGreaterThanOrEqual(width - 1);
    expect(await tid(page, "calc-band").evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(BLUE);
    expect(await page.locator("header").first().evaluate((e) => getComputedStyle(e).backgroundColor)).toBe(BLUE);
  });

  test("제목은 흰 글자(종이색 #F4F9F8) · 금액은 노랑(#F7C548) · 설명 · 라벨은 파랑 면 위 4.5 이상", async ({ page }) => {
    await settle(page);
    const h1 = page.getByRole("heading", { level: 1 });
    const h1Color = await h1.evaluate((e) => getComputedStyle(e).color);
    expect(h1Color).toBe("rgb(244, 249, 248)");
    expect(await h1.locator("span").first().evaluate((e) => getComputedStyle(e).color)).toBe("rgb(247, 197, 72)");
    const desc = page.getByText("물건 값을 넣으면 면세 한도 안인지");
    const label = page.getByText("직구 계산", { exact: true }).first();
    for (const [name, loc] of [["설명", desc], ["라벨", label]] as const) {
      const c = await loc.evaluate((e) => getComputedStyle(e).color);
      expect(contrast(c, BLUE), name).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("세금이 붙는 문장에서도 제목 글자(흰 · 노랑)가 파랑 면 위에서 읽힘", async ({ page }) => {
    await settle(page);
    await page.locator("#price").fill("350");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("붙습니다");
    const h1 = page.getByRole("heading", { level: 1 });
    expect(contrast(await h1.evaluate((e) => getComputedStyle(e).color), BLUE)).toBeGreaterThanOrEqual(4.5);
    const nums = h1.locator("span");
    const n = await nums.count();
    for (let i = 0; i < n; i++) expect(contrast(await nums.nth(i).evaluate((e) => getComputedStyle(e).color), BLUE), `금액 ${i}`).toBeGreaterThanOrEqual(4.5);
  });

  test("입력 카드 · 결과 꼬리표가 파랑 띠 아래 경계에 걸침 — 카드 위쪽은 파랑 면 안 · 아래쪽은 흰 면", async ({ page }) => {
    await settle(page);
    const band = await tid(page, "calc-band").boundingBox();
    const bandBottom = (band?.y ?? 0) + (band?.height ?? 0);
    const ids = isPhone(page) ? ["calc-input"] : ["calc-input", "calc-result"];
    for (const id of ids) {
      const b = await tid(page, id).boundingBox();
      expect(b?.y ?? 9999, `${id} 위쪽이 파랑 면 안`).toBeLessThan(bandBottom - 40);
      expect((b?.y ?? 0) + (b?.height ?? 0), `${id} 아래쪽이 흰 면`).toBeGreaterThan(bandBottom + 40);
    }
  });

  test("흰 입력 카드는 그림자로 구분 · 휴대폰 요약 줄은 보이고 글자가 읽힘", async ({ page }) => {
    await settle(page);
    expect(await tid(page, "calc-input").evaluate((e) => getComputedStyle(e).boxShadow)).not.toBe("none");
    if (isPhone(page)) {
      await expect(tid(page, "calc-summary")).toBeVisible();
      const s = await tid(page, "calc-summary").evaluate((e) => ({ c: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor }));
      expect(contrast(s.c, s.bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("값이 바뀌어도(세 줄 문장) 카드 · 아래 구간 위치 고정 — 파랑 면 안 제목 자리가 세 줄 몫", async ({ page }) => {
    await settle(page);
    const y0 = (await tid(page, "calc-input").boundingBox())?.y ?? 0;
    const below0 = await page.evaluate(() => (document.querySelector('[data-testid="import-price-section"]') as HTMLElement).getBoundingClientRect().top + scrollY);
    await page.getByRole("radiogroup", { name: "보내는 곳" }).getByRole("radio").nth(1).check();
    await page.waitForTimeout(300);
    await page.locator("#price").fill("350");
    await page.waitForTimeout(300);
    expect(Math.abs(((await tid(page, "calc-input").boundingBox())?.y ?? 0) - y0)).toBeLessThanOrEqual(1);
    const below1 = await page.evaluate(() => (document.querySelector('[data-testid="import-price-section"]') as HTMLElement).getBoundingClientRect().top + scrollY);
    expect(Math.abs(below1 - below0)).toBeLessThanOrEqual(1);
  });

  test("가로 넘침 없음 · 파랑 띠가 카드 줄을 덮지 않음(카드 클릭 가능)", async ({ page }) => {
    await settle(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await page.locator("#price").fill("77");
    await expect(page.locator("#price")).toHaveValue("77");
  });
});

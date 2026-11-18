// 작업 0212 (#251) — 통화 상세 · 여행 물가 디자인 검사 지적 7가지
import { type Locator, type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const box = async (loc: Locator) => {
  const b = await loc.boundingBox();
  if (!b) throw new Error("화면에 없음");
  return b;
};

test.describe("통화 상세 (작업 0212)", () => {
  test("휴대폰 — 1년 최저 · 최고 · 평균 카드가 한 줄 세 칸 · 글자가 칸 밖으로 안 나감", async ({ page }) => {
    await page.goto("/currencies/USD");
    const cards = tid(page, "currency-detail").locator("dl > div");
    await expect(cards).toHaveCount(3);
    const boxes = [await box(cards.nth(0)), await box(cards.nth(1)), await box(cards.nth(2))];
    if (isPhone(page)) {
      expect(Math.abs(boxes[0].y - boxes[1].y)).toBeLessThan(1);
      expect(Math.abs(boxes[1].y - boxes[2].y)).toBeLessThan(1);
      expect(boxes[0].x).toBeLessThan(boxes[1].x);
      expect(boxes[1].x).toBeLessThan(boxes[2].x);
      for (let i = 0; i < 3; i++) expect(await cards.nth(i).locator("dd").evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    } else {
      expect(Math.abs(boxes[0].y - boxes[2].y)).toBeLessThan(1); // 넓은 화면도 한 줄 (그대로)
    }
  });

  test("1년 최저 · 최고 · 평균 값은 같은 소수 자릿수", async ({ page }) => {
    await page.goto("/currencies/USD");
    const values = await tid(page, "currency-detail").locator("dl > div dd").allInnerTexts();
    const digits = values.map((v) => v.match(/\.(\d+)/)?.[1].length ?? 0);
    expect(new Set(digits).size, values.join(" | ")).toBe(1);
  });
});

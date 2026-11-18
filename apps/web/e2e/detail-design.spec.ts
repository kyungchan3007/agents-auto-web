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

  test("휴대폰 — 위쪽 통화 줄의 판정 알약이 그 통화 칸 안에 있음", async ({ page }) => {
    test.skip(!isPhone(page), "휴대폰 전용");
    await page.goto("/currencies/USD");
    const links = tid(page, "currency-list").locator("nav ul li a");
    let checked = 0;
    for (let i = 0; i < 3; i++) {
      const link = links.nth(i);
      const pill = link.locator("span.rounded-pill");
      if ((await pill.count()) === 0) continue;
      const lb = await box(link);
      const pb = await box(pill);
      expect(pb.x, "알약 왼쪽").toBeGreaterThanOrEqual(lb.x - 0.5);
      expect(pb.x + pb.width, "알약 오른쪽").toBeLessThanOrEqual(lb.x + lb.width + 0.5);
      expect(pb.y + pb.height, "알약 아래").toBeLessThanOrEqual(lb.y + lb.height + 0.5);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
    // 칸끼리 겹치지 않음
    const a = await box(links.nth(0));
    const b = await box(links.nth(1));
    expect(a.x + a.width).toBeLessThanOrEqual(b.x + 0.5);
  });

  test("넓은 화면 — 왼쪽 목록 맨 아래 줄이 중간에서 잘리지 않음 (줄 경계에서 끝남 · 여러 높이)", async ({ page }) => {
    test.skip(isPhone(page), "넓은 화면 전용");
    for (const height of [700, 800, 900]) {
      await page.setViewportSize({ width: 1280, height });
      await page.goto("/currencies/USD");
      await page.waitForTimeout(300);
      const ul = tid(page, "currency-list").locator("nav ul");
      const ub = await box(ul);
      const items = tid(page, "currency-list").locator("nav ul li");
      const n = await items.count();
      let partial = 0;
      for (let i = 0; i < n; i++) {
        const b = await box(items.nth(i));
        const inside = b.y + b.height <= ub.y + ub.height + 1;
        const outside = b.y >= ub.y + ub.height - 1;
        if (!inside && !outside) partial++;
      }
      expect(partial, `높이 ${height}`).toBe(0);
      expect(await ul.evaluate((el) => el.scrollHeight > el.clientHeight), "목록은 계속 스크롤 가능").toBe(true);
    }
  });
});

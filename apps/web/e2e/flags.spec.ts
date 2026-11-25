// 작업 0199 (#234) — 나라 국기는 SVG 그림 · 이모지 국기 글자(윈도우에서 "JP" 로 보임)가 없고 · 휴대폰 폭에서 겹치지 않음
import { type Locator, type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const REGIONAL = /[\u{1F1E6}-\u{1F1FF}]/u;
const noEmojiFlag = async (page: Page) => expect(REGIONAL.test(await page.locator("body").innerText())).toBe(false);
const box = async (loc: Locator) => {
  const b = await loc.boundingBox();
  if (!b) throw new Error("화면에 없음");
  return b;
};
// 국기 옆 글자와 겹치지 않음 — 국기 오른쪽 끝이 다음 글자 왼쪽 시작보다 왼쪽
const noOverlap = async (flag: Locator, text: Locator) => {
  const f = await box(flag);
  const t = await box(text);
  expect(f.x + f.width).toBeLessThanOrEqual(t.x + 1);
};

test.describe("나라 국기 (작업 0199)", () => {
  test("홈 도착지별 환전 타이밍 — 줄마다 svg 국기", async ({ page }) => {
    await page.goto("/");
    const rows = tid(page, "dest-row");
    const n = await rows.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) await expect(rows.nth(i).locator("svg").first()).toBeVisible();
    await noEmojiFlag(page);
    await noOverlap(rows.first().locator("svg").first(), tid(page, "dest-city").first()); // 작업 0217: 국기는 도시 이름 왼쪽
  });

  test("통화 목록 — 줄마다 svg 국기 (/currencies 목록 페이지의 표 · 작업 0365)", async ({ page }) => {
    await page.goto("/currencies");
    const items = page.getByRole("navigation", { name: "통화 목록" }).locator("li");
    const n = await items.count();
    expect(n).toBeGreaterThan(3);
    for (let i = 0; i < Math.min(n, 6); i++) await expect(items.nth(i).locator("svg").first()).toBeVisible();
    await noEmojiFlag(page);
  });

  test("통화 상세 — 제목 옆 svg 국기 · 유로는 EU", async ({ page }) => {
    await page.goto("/currencies/JPY");
    await expect(tid(page, "currency-detail").locator("svg[role='img']").first()).toBeVisible();
    await expect(tid(page, "currency-detail").locator("title", { hasText: "국기" }).first()).toBeAttached();
    await noEmojiFlag(page);
    await page.goto("/currencies/EUR");
    await expect(tid(page, "currency-detail").locator("svg").first()).toBeVisible();
  });

  test("여행 물가 — 나라 줄마다 svg 국기 · 이모지 없음", async ({ page }) => {
    await page.goto("/prices");
    const items = tid(page, "price-bands").locator("section ul li");
    const n = await items.count();
    expect(n).toBeGreaterThan(5);
    for (let i = 0; i < n; i++) await expect(items.nth(i).locator("svg").first()).toBeAttached();
    await noEmojiFlag(page);
    await noOverlap(items.first().locator("svg").first(), items.first().locator("span.block").first());
  });
});

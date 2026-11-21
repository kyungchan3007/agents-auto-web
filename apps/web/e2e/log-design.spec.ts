// 작업 0214 (#253) — /log 시안 A: 모든 구간이 같은 흰 카드 하나 · 단계 2열 격자(05 는 가로 전체) · h1 아래 h2 간격 40px · 노란 '자동 검사 통과' 남김
import { type Locator, type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const box = async (loc: Locator) => {
  const b = await loc.boundingBox();
  if (!b) throw new Error("화면에 없음");
  return b;
};
const frame = (loc: Locator) => loc.evaluate((el) => { const s = getComputedStyle(el); return { radius: s.borderTopLeftRadius, bg: s.backgroundColor, border: s.borderTopWidth, padL: s.paddingLeft, padT: s.paddingTop }; });

test.describe("/log 시안 A (작업 0214)", () => {
  test("카드 모양 하나 — 단계 · 상태 · 팀 · 작업 흐름 · 실시간 기록이 같은 둥근 모서리 · 흰 바탕 · 테두리 없음 · 같은 여백 @design", async ({ page }) => {
    await page.goto("/log");
    await page.waitForTimeout(500);
    const cards: Locator[] = [
      tid(page, "story-step").first(),
      tid(page, "story-step").last(),
      tid(page, "status-board").locator("dl > div").first(),
      tid(page, "team-desks").locator("li").first(),
      tid(page, "work-flow").locator(".."),
      tid(page, "record-card"),
    ];
    const first = await frame(cards[0]);
    expect(first.bg).toBe("rgb(255, 255, 255)");
    expect(first.border).toBe("0px");
    for (const [i, c] of cards.entries()) expect(await frame(c), `카드 ${i}`).toEqual(first);
  });

  test("단계는 2열 카드 격자 — 넓은 화면에서 01 · 02 가 한 줄 · 05 는 가로 전체 · 휴대폰은 1열 @design", async ({ page }) => {
    await page.goto("/log");
    const steps = tid(page, "story-step");
    await expect(steps).toHaveCount(5);
    const b = [] as { x: number; y: number; width: number }[];
    for (let i = 0; i < 5; i++) b.push(await box(steps.nth(i)));
    if (isPhone(page)) {
      for (let i = 1; i < 5; i++) expect(Math.abs(b[i].x - b[0].x)).toBeLessThan(1);
    } else {
      expect(Math.abs(b[0].y - b[1].y), "01 · 02 같은 줄").toBeLessThan(1);
      expect(Math.abs(b[2].y - b[3].y), "03 · 04 같은 줄").toBeLessThan(1);
      expect(b[4].width, "05 는 가로 전체").toBeGreaterThan(b[0].width * 1.8);
    }
  });

  test("h1 아래 h2(이 사이트를 어떻게 만들었나) 간격 40px @design", async ({ page }) => {
    await page.goto("/log");
    const h1 = await box(page.getByRole("heading", { level: 1 }));
    const h2 = await box(page.locator("#story-title"));
    expect(Math.abs(h2.y - (h1.y + h1.height) - 40)).toBeLessThanOrEqual(2);
  });

  test("노란 '자동 검사 통과' 표시는 남음 · 팀 책상 이름 4개 · 실시간 기록은 흰 카드 안 글", async ({ page }) => {
    await page.goto("/log");
    const done = tid(page, "work-flow").getByText("자동 검사 통과");
    await expect(done).toBeVisible();
    expect(await done.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(247, 197, 72)");
    await expect(tid(page, "team-desks").locator("li")).toHaveCount(4);
    const rec = tid(page, "record-card");
    expect(await rec.evaluate((el) => getComputedStyle(el).color)).not.toBe("rgb(255, 255, 255)");
  });

  test("가로 넘침 없음 · 콘솔 오류 없음", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto("/log");
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    expect(errors.filter((e) => !/Failed to load resource|favicon/.test(e))).toEqual([]);
  });

  test("제목 위 초록 라벨(작업실)은 그대로 · h1 보다 위 @design", async ({ page }) => {
    await page.goto("/log");
    const eyebrow = page.locator("main p").first();
    await expect(eyebrow).toHaveText("작업실");
    await expect(eyebrow).toBeVisible();
    expect(await eyebrow.evaluate((el) => getComputedStyle(el).color)).toBe("rgb(10, 107, 99)");
    expect((await box(eyebrow)).y).toBeLessThan((await box(page.getByRole("heading", { level: 1 }))).y);
  });
});

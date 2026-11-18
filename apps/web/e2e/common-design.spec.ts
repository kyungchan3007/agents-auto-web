// 작업 0216 — 새 디자인 공통 검사: 파랑 메뉴 띠 · 로고 · 카운트업 · 들어오기 · 움직임 줄이기 · 자바스크립트 끄면 보임
//   견본: /design 의 "움직임" 구간 — data-testid="count-up"(data-final) · "slide-in" · "motion-sample-*"
import { type Page, expect, test } from "@playwright/test";
import { openMenuIfCollapsed } from "./helpers";

const BLUE = "rgb(36, 56, 168)";
const WHITE = "rgb(255, 255, 255)";
const SUN = "rgb(247, 197, 72)";
const PAGES: [string, string][] = [
  ["/", "홈"], ["/flights", "여행 타이밍"], ["/currencies", "통화"], ["/prices", "여행 물가"], ["/calc", "직구 계산"], ["/log", "작업실"], ["/geo", "GEO 측정"], ["/about", "소개"],
];
const css = (loc: ReturnType<Page["locator"]>, prop: string) => loc.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

test.describe("메뉴 띠 · 로고 (작업 0216)", () => {
  for (const [path, name] of PAGES) {
    test(`${name} (${path}) — 메뉴 띠 파랑 · 로고 flap 흰 + fx 노랑`, async ({ page }) => {
      await page.goto(path);
      const header = page.getByRole("banner");
      expect(await css(header, "background-color")).toBe(BLUE);
      const logo = header.getByRole("link", { name: /flapfx/i });
      await expect(logo).toHaveText("flapfx");
      expect(await css(logo, "color")).toBe(WHITE);
      expect(await css(logo.locator("[data-accent]"), "color")).toBe(SUN);
      await expect(logo.locator("[data-accent]")).toHaveText("fx");
    });
  }

  test("메뉴 글자 흰색 · 지금 페이지는 흰 알약(파랑 글자) · 휴대폰 펼친 메뉴도 파랑 면", async ({ page }) => {
    await page.goto("/calc");
    await openMenuIfCollapsed(page);
    const nav = page.getByRole("banner").getByRole("navigation");
    const current = nav.locator('a[aria-current="page"]');
    await expect(current).toHaveText("직구 계산");
    expect(await css(current, "background-color")).toBe(WHITE);
    expect(await css(current, "color")).toBe(BLUE);
    const other = nav.getByRole("link", { name: "여행 물가", exact: true });
    const color = await css(other, "color");
    // 반투명 흰색은 브라우저가 oklab(밝기 … / 투명도) 로 돌려줌 — 밝기 0.9 이상 · rgb 면 가장 어두운 값 190 이상
    const nums = color.match(/[\d.]+/g)!.map(Number);
    if (color.startsWith("oklab(")) expect(nums[0], color).toBeGreaterThan(0.9);
    else expect(Math.min(nums[0], nums[1], nums[2]), color).toBeGreaterThan(190);
    const list = nav.locator("ul");
    const bg = await css(list, "background-color");
    expect([BLUE, "rgba(0, 0, 0, 0)"]).toContain(bg); // 넓은 화면은 띠 바탕 그대로 · 휴대폰은 파랑 면
    if ((page.viewportSize()?.width ?? 0) < 640) expect(bg).toBe(BLUE);
  });

  test("메뉴 링크 이름 · 순서 그대로", async ({ page }) => {
    await page.goto("/");
    await openMenuIfCollapsed(page);
    const names = await page.getByRole("banner").getByRole("navigation").getByRole("link").allInnerTexts();
    expect(names.slice(1)).toEqual(["여행 타이밍", "오늘 환율", "통화", "여행 물가", "직구 계산", "작업실", "GEO 측정"]);
  });
});

const sampleText = (page: Page) => page.getByTestId("motion-sample-count").getByTestId("count-up").locator("[aria-hidden]").innerText();

test.describe("카운트업 (작업 0216)", () => {
  test("움직임 줄이기 — 처음부터 최종 값 · 화면 읽기 글은 최종 값", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/design");
    const cu = page.getByTestId("motion-sample-count").getByTestId("count-up");
    await cu.scrollIntoViewIfNeeded();
    const final = await cu.getAttribute("data-final");
    expect(final).toBe("1,338.8원");
    for (let i = 0; i < 5; i++) {
      expect(await sampleText(page)).toBe(final);
      await page.waitForTimeout(60);
    }
    await expect(cu.locator(".sr-only")).toHaveText(final!);
    await expect(cu.locator("[aria-hidden]")).toHaveAttribute("aria-hidden", "true");
  });

  test("움직임 켜짐 — 화면에 들어오면 값이 바뀌며 올라가 끝나면 최종 값 (한 번만)", async ({ page }) => {
    await page.goto("/design");
    const cu = page.getByTestId("motion-sample-count").getByTestId("count-up");
    const final = (await cu.getAttribute("data-final"))!;
    await page.evaluate(() => {
      (window as unknown as { __seen: string[] }).__seen = [];
      const el = document.querySelector('[data-testid="motion-sample-count"] [aria-hidden]') as HTMLElement;
      const tick = () => {
        const w = window as unknown as { __seen: string[] };
        if (w.__seen[w.__seen.length - 1] !== el.innerText) w.__seen.push(el.innerText);
        requestAnimationFrame(tick);
      };
      tick();
    });
    await cu.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    const seen = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen);
    expect(seen.length).toBeGreaterThan(3);
    expect(seen[seen.length - 1]).toBe(final);
    await expect(cu.locator("[aria-hidden]")).toHaveText(final);
    // 다시 보여도 다시 돌지 않음
    await page.evaluate(() => window.scrollTo(0, 0));
    await cu.scrollIntoViewIfNeeded();
    const after = await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen.length);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen.length)).toBe(after);
  });

  test("자바스크립트를 꺼도 최종 값이 보임", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/design");
    await expect(page.getByTestId("motion-sample-count").locator("[aria-hidden]")).toHaveText("1,338.8원");
    await ctx.close();
  });
});

test.describe("들어오기 (작업 0216)", () => {
  const sample = (page: Page) => page.getByTestId("motion-sample-slide");
  const slide = (page: Page) => sample(page).getByTestId("slide-in");

  test("움직임 줄이기 — 처음부터 제자리 (진행 중인 움직임 없음)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/design");
    await slide(page).scrollIntoViewIfNeeded();
    const home = (await sample(page).boundingBox())!;
    for (let i = 0; i < 5; i++) {
      const b = (await slide(page).boundingBox())!;
      expect(Math.abs(b.x - home.x)).toBeLessThanOrEqual(1);
      expect(await slide(page).evaluate((el) => el.getAnimations().length)).toBe(0);
      await page.waitForTimeout(60);
    }
  });

  test("움직임 켜짐 — 들어올 때 왼쪽에서 시작해 0.7초쯤 뒤 제자리(±1px) · 다시 들어와도 다시 움직이지 않음", async ({ page }) => {
    await page.goto("/design");
    const home = (await sample(page).boundingBox())!;
    await slide(page).scrollIntoViewIfNeeded();
    await expect.poll(() => slide(page).evaluate((el) => el.getAnimations().length), { timeout: 3000 }).toBeGreaterThan(0);
    const mid = (await slide(page).boundingBox())!;
    expect(mid.x).toBeLessThan(home.x - 1);
    await page.waitForTimeout(1200);
    const end = (await slide(page).boundingBox())!;
    expect(Math.abs(end.x - home.x)).toBeLessThanOrEqual(1);
    expect(await slide(page).evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    await page.evaluate(() => window.scrollTo(0, 0));
    await slide(page).scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    expect(await slide(page).evaluate((el) => el.getAnimations().length)).toBe(0);
  });

  test("자바스크립트를 꺼도 보임", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/design");
    await expect(slide(page)).toBeVisible();
    expect(await slide(page).evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    await ctx.close();
  });
});

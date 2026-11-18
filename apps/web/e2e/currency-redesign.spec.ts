// 작업 0219 — 새 디자인 통화 상세 (시안 A) · 테스트 먼저
//   표시: data-testid="currency-jump"(위쪽 검색 + 칩 줄) · "currency-search" · "currency-chips"(칩 줄 nav · 링크마다 국기 · aria-current) · "currency-detail"(본문) · "big-rate"(큰 환율 h1 · data-final)
//        "route-card"(1년 최저 · 최고 · 평균 한 카드) · "route-plane"(오늘 점 · data-position) · "route-min" · "route-max"(카운트업) · "route-avg"
//        "converter"(탑승권) · "converter-board"(결과 글자판) · "year-flow"(1년 흐름 구간) · "year-line"(선 · 그려짐) · "currency-list"(맨 아래 다른 통화 목록)
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const box = async (page: Page, id: string) => {
  const b = await tid(page, id).first().boundingBox();
  if (!b) throw new Error(`${id} 가 화면에 없음`);
  return b;
};
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const num = (s: string) => Number(s.replace(/[^\d.]/g, ""));

test.describe("새 통화 상세 — 위쪽 · 머리 (작업 0219)", () => {
  test("가로 넘침 없음 · 콘솔 오류 없음 · 사진 요청 0 (1280 · 768 · 390)", async ({ page }) => {
    const errors: string[] = [];
    const photos: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("request", (r) => r.url().includes("/images/photos") && photos.push(r.url()));
    for (const [w, h] of [[1280, 800], [768, 900], [390, 844]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/currencies/USD");
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${w}px 가로 넘침`).toBeLessThanOrEqual(0);
    }
    expect(errors).toEqual([]);
    expect(photos).toEqual([]);
  });

  test("위쪽 — 검색과 국기 칩 줄이 머리보다 위 · 칩은 올바른 통화 페이지 · 지금 통화 표시", async ({ page }) => {
    await page.goto("/currencies/USD");
    const search = await box(page, "currency-search");
    const chips = await box(page, "currency-chips");
    const head = await box(page, "big-rate");
    expect(search.y).toBeLessThan(head.y);
    expect(chips.y).toBeLessThan(head.y);
    const links = tid(page, "currency-chips").getByRole("link");
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    for (const h of ["/currencies/JPY", "/currencies/USD", "/currencies/EUR", "/currencies/THB"]) expect(hrefs).toContain(h);
    await expect(tid(page, "currency-chips").locator('a[aria-current="page"]')).toHaveCount(1);
    await expect(tid(page, "currency-chips").locator('a[aria-current="page"]')).toHaveAttribute("href", "/currencies/USD");
    for (let i = 0; i < (await links.count()); i++) await expect(links.nth(i).locator("svg").first()).toBeVisible(); // 국기
    await links.filter({ hasText: "JPY" }).click();
    await expect(page).toHaveURL(/\/currencies\/JPY\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("JPY");
  });

  test("검색 — combobox · 후보 listbox · 키보드로 골라 이동", async ({ page }) => {
    await page.goto("/currencies/USD");
    const input = tid(page, "currency-search").getByRole("combobox", { name: "통화 검색" });
    await input.fill("엔");
    await expect(tid(page, "currency-search").getByRole("listbox")).toBeVisible();
    await expect(tid(page, "currency-search").getByRole("option").first()).toContainText("JPY");
    await input.press("ArrowDown");
    await expect(input).toHaveAttribute("aria-activedescendant", /.+/);
    await input.press("Enter");
    await expect(page).toHaveURL(/\/currencies\/JPY\/?$/);
  });

  test("머리 — 국기 + 이름 라벨 · '○○(코드) 환율' · 큰 환율(카운트업) · 상태 점 + 글 · 기준 글", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText(/\(USD\) 환율/);
    const big = tid(page, "big-rate").getByTestId("count-up");
    const final = (await big.getAttribute("data-final")) ?? "";
    expect(final).toMatch(/^[\d,.]+원$/);
    expect(await big.evaluate((e) => e.textContent)).toBe(final);
    await expect(tid(page, "currency-detail")).toContainText(/(하위|상위) \d+% · (쌈|보통|비쌈)|신호를 받지 못했습니다/);
    await expect(tid(page, "currency-detail")).toContainText(/\d{4}-\d{2}-\d{2} (한국수출입은행|Frankfurter)/);
    // 시안의 영문 작은 라벨은 넣지 않음 (사용자 확인 전)
    for (const en of ["BOARDING PASS", "EXCHANGE", "FROM", "TO · KRW", "USD / KRW"]) await expect(tid(page, "currency-detail")).not.toContainText(en);
  });
});

test.describe("새 통화 상세 — 비행 경로 · 계산 탑승권 (작업 0219)", () => {
  test("1년 최저 · 최고 · 평균 한 카드 — 오늘 점 위치 = (오늘 − 최저)/(최고 − 최저) · 평균 눈금", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    const min = num((await tid(page, "route-min").getByTestId("count-up").getAttribute("data-final")) ?? "");
    const max = num((await tid(page, "route-max").getByTestId("count-up").getAttribute("data-final")) ?? "");
    const today = num((await tid(page, "big-rate").getByTestId("count-up").getAttribute("data-final")) ?? "");
    expect(min).toBeLessThan(max);
    const plane = tid(page, "route-plane");
    const pos = Number(await plane.getAttribute("data-position"));
    expect(pos).toBeCloseTo(Math.min(1, Math.max(0, (today - min) / (max - min))), 2);
    const track = (await plane.locator("xpath=..").boundingBox())!;
    const p = (await plane.boundingBox())!;
    expect(Math.abs(p.x + p.width / 2 - (track.x + track.width * pos))).toBeLessThanOrEqual(1);
    await expect(tid(page, "route-avg")).toContainText(/1년 평균 [\d,.]+원/);
    await expect(tid(page, "route-card")).toContainText("1년 최저");
    await expect(tid(page, "route-card")).toContainText("1년 최고");
  });

  test("카운트업 — 움직임 줄이기면 처음부터 최종 · 켜면 끝나서 최종 값과 같음 · 글이 겹치지 않음", async ({ page }) => {
    await page.goto("/currencies/USD");
    await tid(page, "route-card").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1700);
    const counts = tid(page, "currency-detail").getByTestId("count-up");
    const n = await counts.count();
    expect(n).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < n; i++) expect(await counts.nth(i).evaluate((e) => e.textContent)).toBe(await counts.nth(i).getAttribute("data-final"));
  });

  test("계산 탑승권 — 넓은 화면은 오른쪽(따라옴) · 휴대폰은 경로 카드 아래 · 짙은 남색 · 결과는 글자판 · 같은 입력 → 같은 값", async ({ page }) => {
    await page.goto("/currencies/USD");
    const conv = await box(page, "converter");
    const route = await box(page, "route-card");
    if (isPhone(page)) expect(conv.y).toBeGreaterThanOrEqual(route.y + route.height - 1);
    else {
      expect(conv.x).toBeGreaterThan(route.x + route.width - 1);
      expect(await tid(page, "converter").evaluate((el) => getComputedStyle(el.parentElement as HTMLElement).position)).toBe("sticky");
    }
    const bgc = await tid(page, "converter").evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bgc).not.toBe("rgb(255, 255, 255)");
    const rate = num((await tid(page, "big-rate").getByTestId("count-up").getAttribute("data-final")) ?? "");
    const input = tid(page, "converter").getByRole("textbox").first();
    await input.fill("100");
    const board = tid(page, "converter-board").getByTestId("flap-board");
    await expect(board).toHaveAttribute("role", "img");
    await expect.poll(async () => num((await board.getAttribute("aria-label")) ?? "")).toBeGreaterThan(rate * 100 * 0.99);
    expect(num((await board.getAttribute("aria-label")) ?? "")).toBeLessThan(rate * 100 * 1.01);
    await input.fill("200");
    await expect.poll(async () => num((await board.getAttribute("aria-label")) ?? "")).toBeGreaterThan(rate * 200 * 0.99);
    await expect(tid(page, "converter")).toContainText("실제로 바꿀 때");
    await expect(page.locator("#converter-note")).toContainText("매매기준율");
    await page.getByRole("group", { name: "빠른 금액" }).getByRole("button").first().click();
    await expect(board).toHaveAttribute("aria-label", /[\d,]+원/);
  });
});

test.describe("새 통화 상세 — 1년 흐름 · 아래 목록 (작업 0219)", () => {
  test("선이 그려지며 나타남(한 번) · 움직임 줄이기면 처음부터 다 그려짐 · 자바스크립트 끄면 다 그려짐", async ({ page, browser, baseURL }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    const line = tid(page, "year-line");
    await line.scrollIntoViewIfNeeded();
    for (let i = 0; i < 3; i++) {
      expect(await line.evaluate((el) => getComputedStyle(el).strokeDashoffset)).toMatch(/^0(px)?$/);
      await page.waitForTimeout(60);
    }
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const p2 = await ctx.newPage();
    await p2.goto("/currencies/USD");
    expect(await p2.locator('[data-testid="year-line"]').evaluate((el) => getComputedStyle(el).strokeDashoffset)).toMatch(/^0(px)?$/);
    await ctx.close();
  });

  test("움직임 켜짐 — 화면에 들어오면 그려지는 중(선이 일부)이다가 끝나면 다 그려짐 · 다시 보여도 다시 안 그림", async ({ page }) => {
    await page.goto("/currencies/USD");
    const line = tid(page, "year-line");
    await line.scrollIntoViewIfNeeded();
    await expect.poll(() => line.evaluate((el) => el.getAnimations().length), { timeout: 3000 }).toBeGreaterThan(0);
    await page.waitForTimeout(1800);
    expect(await line.evaluate((el) => getComputedStyle(el).strokeDashoffset)).toMatch(/^0(px)?$/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await line.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100);
    expect(await line.evaluate((el) => el.getAnimations().length)).toBe(0);
  });

  test("기간 탭 1개월 · 3개월 · 1년 — 누르면 aria-pressed 가 바뀜 (지금 기능 그대로)", async ({ page }) => {
    await page.goto("/currencies/USD");
    const tabs = tid(page, "year-flow").getByRole("group", { name: "기간" });
    await tabs.getByRole("button", { name: "1개월" }).click();
    await expect(tabs.getByRole("button", { name: "1개월" })).toHaveAttribute("aria-pressed", "true");
    await tabs.getByRole("button", { name: "1년" }).click();
    await expect(tabs.getByRole("button", { name: "1년" })).toHaveAttribute("aria-pressed", "true");
  });

  test("맨 아래 다른 통화 목록 — 그래프 아래 · 링크가 올바른 통화 페이지", async ({ page }) => {
    await page.goto("/currencies/USD");
    const flow = await box(page, "year-flow");
    const list = await box(page, "currency-list");
    expect(list.y).toBeGreaterThanOrEqual(flow.y + flow.height - 1);
    const jpy = tid(page, "currency-list").getByRole("link", { name: /JPY/ }).first();
    await expect(jpy).toHaveAttribute("href", "/currencies/JPY");
    await expect(tid(page, "currency-list").locator('a[aria-current="page"]')).toHaveAttribute("href", "/currencies/USD");
  });
});

// 작업 0217 — 새 디자인 홈 검사 (시안 B + 환전 타이밍 A) · 테스트 먼저
//   표시: data-testid="home-hero"(파랑 첫 면) · "hero-month"(노랑 월) · "ticket-band"(경계에 걸치는 파랑 띠) · "ticket"(카드) · "ticket-evidence" · "ticket-bar"
//        "year-bars"(role=img) · "year-bar"(data-tone high|low|mid|none) · "year-link" · "dest-list"(흰 판) · "dest-row" · "dest-rate"(data-final) · "dest-dot"(data-position) · "dest-flag"
import { type Page, expect, test } from "@playwright/test";

const BLUE = "rgb(36, 56, 168)";
const SUN = "rgb(247, 197, 72)";
const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const box = async (page: Page, id: string, n = 0) => {
  const b = await tid(page, id).nth(n).boundingBox();
  if (!b) throw new Error(`${id} 가 화면에 없음`);
  return b;
};
const bg = (page: Page, id: string) => tid(page, id).first().evaluate((el) => getComputedStyle(el).backgroundColor);

test.describe("새 홈 — 첫 화면 (작업 0217)", () => {
  test("메뉴와 한 면으로 이어지는 파랑 · 큰 제목 'N월에 떠나세요' (월만 노랑) · 설명 한 줄", async ({ page }) => {
    await page.goto("/");
    const header = await page.getByRole("banner").boundingBox();
    const hero = await box(page, "home-hero");
    expect(await bg(page, "home-hero")).toBe(BLUE);
    expect(Math.abs(hero.y - (header!.y + header!.height))).toBeLessThanOrEqual(1);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(/^\d+월에 떠나세요$/);
    expect(await tid(page, "hero-month").evaluate((el) => getComputedStyle(el).color)).toBe(SUN);
    await expect(tid(page, "hero-month")).toHaveText(/^\d+월$/);
    await expect(tid(page, "home-hero")).toContainText("통계청 국제항공료 지수로 보면");
  });

  test("탑승권 카드가 파랑 면과 하늘 면 경계에 걸침 · 글자판은 카드 안 · 아래에 판정 한 줄 · 막대 · 고르기 버튼", async ({ page }) => {
    await page.goto("/");
    const band = await box(page, "ticket-band");
    const card = await box(page, "ticket");
    expect(await bg(page, "ticket-band")).toBe(BLUE);
    const vw = page.viewportSize()?.width ?? 0;
    expect(band.x, "파랑 띠가 왼쪽 끝부터").toBeLessThanOrEqual(1);
    expect(band.x + band.width, "파랑 띠가 오른쪽 끝까지").toBeGreaterThanOrEqual(vw - 1);
    expect(band.y + band.height).toBeGreaterThan(card.y + 20); // 파랑 띠 끝이 카드 위쪽보다 아래 ·
    expect(band.y + band.height).toBeLessThan(card.y + card.height - 20); // 카드 아래쪽보다 위 = 경계에 걸침
    const flap = await box(page, "flap-board");
    expect(flap.x).toBeGreaterThanOrEqual(card.x);
    expect(flap.x + flap.width).toBeLessThanOrEqual(card.x + card.width + 1);
    await expect(tid(page, "ticket")).toContainText("이번 주 가장 싸게 갈 수 있는 곳");
    await expect(tid(page, "ticket-evidence")).toContainText("최근 90일");
    await expect(tid(page, "ticket-bar")).toBeVisible();
    // 작업 0217 사용자 지적: "내 여행지 고르기" 버튼 · 시트 없이 카드 안에서 바로 바꿈
    await expect(tid(page, "ticket").getByTestId("trip-switcher")).toBeVisible();
    await expect(page.getByTestId("pick-trip-open")).toHaveCount(0);
    // 시안의 영문 작은 라벨은 넣지 않음 (사용자 확인 전)
    for (const en of ["DEPARTURES", "BOARDING PASS", "12 MONTHS", "EXCHANGE", "DESTINATION", "KRW", "STATUS"]) await expect(page.locator("main")).not.toContainText(en);
  });

  test("가로 넘침 없음 · 콘솔 오류 없음 (1280 · 768 · 390)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    for (const [w, h] of [[1280, 800], [768, 900], [390, 844]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/");
      await page.waitForTimeout(300);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(over, `${w}px 가로 넘침`).toBeLessThanOrEqual(0);
    }
    expect(errors).toEqual([]);
  });

  test("사진 요청 0 (인트로 끝 · 홈에서 /images/photos 를 받지 않음)", async ({ page }) => {
    const urls: string[] = [];
    page.on("request", (r) => r.url().includes("/images/photos") && urls.push(r.url()));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(urls).toEqual([]);
    await expect(page.locator("main img[src*='photos']")).toHaveCount(0);
  });
});

test.describe("새 홈 — 12달 막대 (작업 0217)", () => {
  test("12개 · 가장 비싼 달 빨강 · 가장 싼 달 노랑 · 나머지 연한 파랑 · 막대 위 글 · 자세히 링크", async ({ page }) => {
    await page.goto("/");
    const bars = tid(page, "year-bar");
    await expect(bars).toHaveCount(12);
    const tones = await bars.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.tone));
    expect(tones.filter((t) => t === "high")).toHaveLength(1);
    expect(tones.filter((t) => t === "low")).toHaveLength(1);
    const hiI = tones.indexOf("high");
    const loI = tones.indexOf("low");
    const heights = await bars.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    expect(heights[hiI]).toBe(Math.max(...heights));
    expect(heights[loI]).toBe(Math.min(...heights));
    const color = (i: number) => bars.nth(i).evaluate((e) => getComputedStyle(e).backgroundColor);
    expect(await color(loI)).toBe(SUN);
    expect(await color(hiI)).toBe("rgb(193, 58, 34)");
    await expect(tid(page, "year-bars")).toHaveAttribute("role", "img");
    await expect(tid(page, "year-bars")).toContainText(`${hiI + 1}월 가장 비쌈`);
    await expect(tid(page, "year-bars")).toContainText(`${loI + 1}월 가장 쌈`);
    const link = tid(page, "year-link");
    await expect(link).toHaveAttribute("href", "/flights");
    await expect(link).toContainText("항공료 그래프 자세히");
    await expect(page.locator("main")).toContainText("지수는 값이 클수록 항공료가 비싸다는 뜻이며");
    // 3D 비행 경로는 홈에서 뺌
    await expect(tid(page, "plane-route")).toHaveCount(0);
  });
});

test.describe("새 홈 — 도착지별 환전 타이밍 (작업 0217)", () => {
  test("흰 판 하나 · 줄마다 국기 · 도시 · 통화 · 금액 · 동그라미 · 상태 · 더 보기 링크", async ({ page }) => {
    await page.goto("/");
    const list = tid(page, "dest-list");
    expect(await bg(page, "dest-list")).toBe("rgb(255, 255, 255)");
    // 흰 바탕 위 흰 판은 옅은 선으로 구분 (작업 0216 흰 바탕 결정)
    expect(await tid(page, "dest-list").evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth))).toBeGreaterThanOrEqual(1);
    const n = await tid(page, "dest-row").count();
    expect(n).toBeGreaterThanOrEqual(4);
    expect(await list.locator('[data-testid="dest-row"]').count()).toBe(n);
    await expect(tid(page, "dest-flag")).toHaveCount(n);
    await expect(list.locator("svg").first()).toBeVisible(); // 도시 사진 대신 국기 (SVG)
    await expect(tid(page, "dest-row").first()).toContainText(/하위 \d+% · 쌈|하위 \d+% · 보통|상위 \d+% · 비쌈/);
    await expect(tid(page, "more-currencies")).toContainText("다른 통화");
  });

  test("움직임 줄이기 — 금액이 처음부터 최종 값 · 동그라미도 처음부터 제자리", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const rate = tid(page, "dest-rate").first();
    await rate.scrollIntoViewIfNeeded();
    const final = (await rate.getAttribute("data-final"))!;
    for (let i = 0; i < 4; i++) {
      expect(await rate.evaluate((e) => e.textContent)).toBe(final);
      await page.waitForTimeout(60);
    }
    const dot = tid(page, "dest-dot").first();
    const pos = Number(await dot.getAttribute("data-position"));
    const track = (await dot.locator("xpath=..").boundingBox())!;
    const d = (await dot.boundingBox())!;
    expect(Math.abs(d.x + d.width / 2 - (track.x + track.width * pos))).toBeLessThanOrEqual(1);
  });

  test("움직임 켜짐 — 끝나면 금액 = 최종 값 · 동그라미 = 지금 위치(±1px) · 숫자 글이 겹치지 않음", async ({ page }) => {
    await page.goto("/");
    const rate = tid(page, "dest-rate").first();
    await rate.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1600);
    const final = (await rate.getAttribute("data-final"))!;
    expect(await rate.evaluate((e) => e.textContent)).toBe(final);
    expect(final).toMatch(/^[\d,.]+원$/);
    const dot = tid(page, "dest-dot").first();
    const pos = Number(await dot.getAttribute("data-position"));
    const track = (await dot.locator("xpath=..").boundingBox())!;
    const d = (await dot.boundingBox())!;
    expect(Math.abs(d.x + d.width / 2 - (track.x + track.width * pos))).toBeLessThanOrEqual(1);
  });

  test("움직임 켜짐 — 들어올 때 금액과 동그라미가 같이 움직임 (처음엔 최종 값보다 작음)", async ({ page }) => {
    await page.goto("/");
    const rate = tid(page, "dest-rate").first();
    const final = (await rate.getAttribute("data-final"))!;
    await page.evaluate(() => {
      const w = window as unknown as { __rates: string[]; __dots: number[] };
      w.__rates = [];
      w.__dots = [];
      const r = document.querySelector('[data-testid="dest-rate"]') as HTMLElement;
      const d = document.querySelector('[data-testid="dest-dot"]') as HTMLElement;
      const tick = () => {
        if (w.__rates[w.__rates.length - 1] !== r.textContent) w.__rates.push(r.textContent ?? "");
        const x = d.getBoundingClientRect().x;
        if (w.__dots[w.__dots.length - 1] !== x) w.__dots.push(x);
        requestAnimationFrame(tick);
      };
      tick();
    });
    await rate.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    const { rates, dots } = await page.evaluate(() => {
      const w = window as unknown as { __rates: string[]; __dots: number[] };
      return { rates: w.__rates, dots: w.__dots };
    });
    expect(rates.length).toBeGreaterThan(3);
    expect(rates[rates.length - 1]).toBe(final);
    expect(dots.length).toBeGreaterThan(3); // 동그라미도 같은 동안 움직임
  });

  test("자바스크립트를 꺼도 금액 · 막대 · 12달 막대가 보임", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/");
    await expect(tid(page, "dest-rate").first()).toHaveText(/^[\d,.]+원$/);
    await expect(tid(page, "year-bar")).toHaveCount(12);
    await expect(tid(page, "flap-board")).toBeVisible();
    await ctx.close();
  });
});

// 작업 0217 사용자 지적 — 홈 카드 안에서 여행지를 바로 바꿈 (원문 "내여행지 고르기 말고 지금처럼 여행지 바꾸면 바로 확인하면 좋을거 같아")
test.describe("새 홈 — 카드 안 여행지 바꾸기 (작업 0217 지적)", () => {
  const board = (page: Page) => tid(page, "ticket").getByTestId("flap-board");
  const switcher = (page: Page) => tid(page, "trip-switcher");

  test("버튼 · 시트 없음 — 카드 안에 자주 가는 곳 칩 줄 + 검색 칸이 바로 보임 (칩마다 국기 · 이름)", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("pick-trip-open")).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const chips = switcher(page).getByTestId("pick-chip");
    expect(await chips.count()).toBeGreaterThanOrEqual(6);
    await expect(chips.first().locator("svg")).toBeVisible();
    await expect(switcher(page).getByRole("combobox", { name: "여행지 검색" })).toBeVisible();
    const card = await box(page, "ticket");
    const sw = await box(page, "trip-switcher");
    expect(sw.y).toBeGreaterThan(card.y + 200);
    expect(sw.y + sw.height).toBeLessThanOrEqual(card.y + card.height + 1); // 카드 안
  });

  test("칩을 누르면 안내판 글 · 판정 줄 · 막대가 그 나라로 바로 바뀌고 눌린 칩 표시(aria-pressed) · 새로고침해도 유지", async ({ page }) => {
    await page.goto("/");
    await switcher(page).getByTestId("pick-chip").filter({ hasText: "도쿄" }).click();
    await expect(board(page)).toHaveAttribute("aria-label", /도쿄/, { timeout: 1500 });
    await expect(switcher(page).getByTestId("pick-chip").filter({ hasText: "도쿄" })).toHaveAttribute("aria-pressed", "true");
    await expect(tid(page, "ticket")).toContainText(/내가 고른 여행지/);
    await expect(tid(page, "ticket-evidence")).toContainText("최근 90일");
    await switcher(page).getByTestId("pick-chip").filter({ hasText: "방콕" }).click();
    await expect(board(page)).toHaveAttribute("aria-label", /방콕/, { timeout: 1500 });
    await expect(switcher(page).getByTestId("pick-chip").filter({ hasText: "도쿄" })).toHaveAttribute("aria-pressed", "false");
    await page.reload();
    await expect(board(page)).toHaveAttribute("aria-label", /방콕/);
    await expect(switcher(page).getByTestId("pick-chip").filter({ hasText: "방콕" })).toHaveAttribute("aria-pressed", "true");
  });

  test("목록에 없는 나라는 같은 줄 검색 칸으로 — 입력 → 후보(listbox · option) → 키보드 · 마우스로 고르기", async ({ page }) => {
    await page.goto("/");
    const input = switcher(page).getByRole("combobox", { name: "여행지 검색" });
    await input.fill("두바이");
    await expect(switcher(page).getByRole("listbox")).toBeVisible();
    await input.press("ArrowDown");
    await expect(input).toHaveAttribute("aria-activedescendant", /.+/);
    await input.press("Enter");
    await expect(board(page)).toHaveAttribute("aria-label", /두바이/, { timeout: 1500 });
    await input.fill("하노이");
    await switcher(page).getByRole("option").first().click();
    await expect(board(page)).toHaveAttribute("aria-label", /하노이/, { timeout: 1500 });
    await expect(switcher(page).getByRole("listbox")).toHaveCount(0);
  });

  test("휴대폰 — 칩 줄은 가로 스크롤 없이 줄바꿈 · 가로 넘침 없음", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const list = switcher(page).locator("ul").first();
    expect(await list.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const ys = await list.locator("li").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
    expect(new Set(ys).size, "휴대폰에서는 두 줄 이상으로 줄바꿈").toBeGreaterThan(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    await switcher(page).getByTestId("pick-chip").filter({ hasText: "파리" }).click();
    await expect(board(page)).toHaveAttribute("aria-label", /파리/, { timeout: 1500 });
  });
});

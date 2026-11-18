// 작업 0218 — 새 디자인 /flights (시안 A + 머리 글자판) · 테스트 먼저
//   표시: data-testid="flights-hero"(흰 머리) · "hero-board"(머리 글자판 묶음) · "flights-ticket"(탑승권 카드) · "slide-in"(들어오기) · "yoy-cards"(오른쪽 숫자) · "yoy-dot" · "cheap-board"(작은 글자판 묶음)
//        "strip-max" · "strip-min" · "strip-fx"(한 줄 띠) · "travel-graph" · (그래프 그림은 0218 그래프 2D 에서 새로 — 비행기 없음)
import { type Page, expect, test } from "@playwright/test";

const WHITE = "rgb(255, 255, 255)";
const BLUE = "rgb(36, 56, 168)";
const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const box = async (page: Page, id: string) => {
  const b = await tid(page, id).first().boundingBox();
  if (!b) throw new Error(`${id} 가 화면에 없음`);
  return b;
};
const bg = (page: Page, id: string) => tid(page, id).first().evaluate((el) => getComputedStyle(el).backgroundColor);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const ready = async (page: Page) => !(((await page.getByRole("heading", { level: 1 }).textContent()) ?? "").includes("준비 중"));

test.describe("새 /flights — 머리 (작업 0218)", () => {
  test("메뉴는 파랑 · 머리는 흰 면 · 그 아래는 하늘 종이 · 사진 없음(요청 0)", async ({ page }) => {
    const urls: string[] = [];
    page.on("request", (r) => r.url().includes("/images/photos") && urls.push(r.url()));
    await page.goto("/flights");
    await page.waitForLoadState("networkidle");
    expect(await page.getByRole("banner").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(BLUE);
    expect(await bg(page, "flights-hero")).toBe(WHITE);
    const header = await page.getByRole("banner").boundingBox();
    const hero = await box(page, "flights-hero");
    expect(Math.abs(hero.y - ((header?.y ?? 0) + (header?.height ?? 0)))).toBeLessThanOrEqual(1);
    expect(urls).toEqual([]);
    await expect(page.locator('[data-testid="photo-header"], img[src*="/images/photos/"]')).toHaveCount(0);
  });

  test("머리 — 왼쪽 라벨 · 제목 · 설명 / 오른쪽 글자판 (휴대폰은 제목 아래)", async ({ page }) => {
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    const h1 = await page.getByRole("heading", { level: 1 }).boundingBox();
    const board = await box(page, "hero-board");
    if (isPhone(page)) expect(board.y).toBeGreaterThanOrEqual((h1?.y ?? 0) + (h1?.height ?? 0) - 1);
    else expect(board.x).toBeGreaterThan((h1?.x ?? 0) + (h1?.width ?? 0) * 0.5);
    await expect(tid(page, "flights-hero")).toContainText("여행 타이밍");
    // 시안의 영문 작은 라벨은 넣지 않음 (사용자 확인 전)
    for (const en of ["FARE WATCH", "DEPARTURES", "FARE INDEX", "BOARDING PASS", "24 MONTHS"]) await expect(page.locator("main")).not.toContainText(en);
  });

  test("글자판 값 = 실제 최신 지수 · 가장 싼 달 = 제목의 달 · 화면 읽기는 한 문장", async ({ page }) => {
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    const board = tid(page, "hero-board").getByTestId("flap-board");
    await expect(board).toHaveAttribute("role", "img");
    const label = (await board.getAttribute("aria-label")) ?? "";
    expect(label).toMatch(/^가장 싼 달은 .+입니다\. 국제항공료 지수 \d+\.\d/);
    const h1 = ((await page.getByRole("heading", { level: 1 }).innerText()) ?? "").replace(/\s+/g, " ");
    const months = [...h1.matchAll(/(\d+)월/g)].map((m) => `${m[1]}월`);
    for (const m of months) expect(label).toContain(m);
    // 탑승권 오른쪽 숫자와 같은 값
    const finals = await tid(page, "yoy-cards").getByTestId("count-up").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.final ?? ""));
    const air = finals.find((f) => /^\d+\.\d$/.test(f));
    expect(air, `숫자 ${finals.join(",")}`).toBeTruthy();
    expect(label).toContain(`국제항공료 지수 ${air}`);
    // 칸 글자(넘어가는 움직임이 끝난 뒤)에도 같은 값
    await page.waitForTimeout(2600);
    const rows = await board.locator('[data-testid="flap-row"]').evaluateAll((els) => els.map((e) => (e.textContent ?? "").replace(/\s+/g, "")));
    expect(rows.join("|")).toContain(String(air));
    expect(rows[0]).toMatch(/^가장싼달/);
  });
});

test.describe("새 /flights — 탑승권 · 한 줄 띠 (작업 0218)", () => {
  test("탑승권 한 장 — 왼쪽 그래프(그대로) · 절취선 · 오른쪽 숫자 · 작은 글자판", async ({ page }) => {
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    const card = await box(page, "flights-ticket");
    const graph = await box(page, "travel-graph");
    const nums = await box(page, "yoy-cards");
    await expect(tid(page, "travel-legend")).toContainText("국제항공료");
    expect(graph.x).toBeGreaterThanOrEqual(card.x);
    expect(nums.x + nums.width).toBeLessThanOrEqual(card.x + card.width + 1);
    if (isPhone(page)) expect(nums.y).toBeGreaterThanOrEqual(graph.y + graph.height - 1); // 그래프 위 · 숫자 아래
    else expect(nums.x).toBeGreaterThan(graph.x + graph.width - 1); // 왼쪽 그래프 · 오른쪽 숫자
    await expect(tid(page, "cheap-board").getByTestId("flap-board")).toHaveAttribute("aria-label", /^가장 싼 달 \d+월/);
    await expect(tid(page, "yoy-cards")).toContainText("같은 달 평균 기준");
  });

  // 작업 0218 사용자 지적 "시안처럼 해줘 표디자인처럼" — 표 뒤 구간은 옅은 면(surface-2 #F2F5F9) · 가장자리 홈 색 = 뒤 구간 색(파인 홈) · "가장 싼 달" 은 작은 칸 셋(1 · 1 · 월)만 단독으로
  //   표시: data-testid="flights-back"(표 뒤 구간) · "flights-ticket-hole"(홈 · 둘)
  test("표 뒤 구간은 옅은 면 · 절취선 끝 동그라미(홈)는 없고 점선만 남음 (작업 0218 사용자 지적 \"동그라미가 없어야 하는거 아냐?\")", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    await page.waitForTimeout(500);
    expect(await tid(page, "flights-back").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(242, 245, 249)");
    expect(await tid(page, "flights-ticket").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(255, 255, 255)");
    await expect(page.locator('[data-testid="flights-ticket-hole"]')).toHaveCount(0);
    // 카드 안에 절취선 동그라미(둥근 모서리 28px 상자)가 하나도 없음 — 점 · 막대 같은 작은 것(≤ 20px)만
    const circles = await tid(page, "flights-ticket").evaluate((card) => [...card.querySelectorAll("*")].filter((e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width >= 24 && Math.abs(r.width - r.height) < 2 && parseFloat(cs.borderTopLeftRadius) >= r.width / 2 - 1 && cs.backgroundColor !== "rgba(0, 0, 0, 0)"; }).length);
    expect(circles, "큰 동그라미").toBe(0);
    // 절취선(점선)은 그대로
    const dashed = await tid(page, "yoy-cards").evaluate((el) => { const p = el.parentElement as HTMLElement; const cs = getComputedStyle(p); return [cs.borderTopStyle, cs.borderLeftStyle]; });
    expect(dashed.includes("dashed"), "점선 절취선").toBe(true);
  });

  test("가장 싼 달 글자판 — 큰 판 틀 없이 작은 칸 셋(1 · 1 · 월)만 단독으로 · 칸은 남색 + 노랑 글자 · 높이 약 44px", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    const board = tid(page, "cheap-board").getByTestId("flap-board");
    const frame = await board.evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, pad: getComputedStyle(el).padding, radius: getComputedStyle(el).borderRadius }));
    expect(frame.bg, "판 틀 배경 없음").toBe("rgba(0, 0, 0, 0)");
    expect(frame.pad, "판 틀 안쪽 여백 없음").toBe("0px");
    const cells = board.locator("> span");
    const n = await cells.count();
    const label = (await board.getAttribute("aria-label")) ?? "";
    const month = /(\d+월)/.exec(label)?.[1] ?? "";
    expect(n, "칸 수 = 글자 수").toBe(month.length);
    for (let i = 0; i < n; i++) {
      const c = await cells.nth(i).evaluate((el) => ({ bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color, h: el.getBoundingClientRect().height }));
      expect(c.bg).toBe("rgb(31, 49, 144)");
      expect(c.color).toBe("rgb(247, 197, 72)");
      expect(Math.abs(c.h - 44)).toBeLessThanOrEqual(2);
    }
  });

  test("넓은 화면 — 탑승권 두 칸 아래 끝이 비슷함 (그래프 칸 내용 아래 끝 ~ 카드 아래 끝 ≤ 카드 안쪽 여백 + 40px · 0218 리뷰)", async ({ page }) => {
    test.skip(isPhone(page), "넓은 화면 전용");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    await page.waitForTimeout(600);
    const card = await box(page, "flights-ticket");
    const legend = await box(page, "travel-legend"); // 왼쪽 칸 맨 아래 내용
    const padding = await tid(page, "flights-ticket").locator("> div").first().evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
    const gap = card.y + card.height - (legend.y + legend.height);
    expect(gap, `그래프 칸 아래 빈칸 ${Math.round(gap)}px`).toBeLessThanOrEqual(padding + 40);
    // 오른쪽 숫자 칸 안의 가장 싼 달 작은 글자판은 시안처럼 작음 (칸 높이 약 44px)
    const mini = await box(page, "cheap-board");
    expect(mini.height, "작은 글자판 높이").toBeLessThanOrEqual(64);
  });

  test("작년 대비는 알약 배지가 아니라 점 + 글 — '작년보다 ±N.N%'", async ({ page }) => {
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    const dots = tid(page, "yoy-dot");
    const n = await dots.count();
    expect(n).toBeGreaterThanOrEqual(1);
    for (let i = 0; i < n; i++) {
      const item = dots.nth(i).locator("xpath=..");
      await expect(item).toHaveText(/^작년보다 [+-]\d+\.\d%$|^작년 값 없음$/);
      expect(await dots.nth(i).evaluate((el) => getComputedStyle(el).borderRadius)).not.toBe("0px"); // 둥근 점
    }
    await expect(page.locator('[data-testid="yoy-cards"] [class*="rounded-pill"]')).toHaveCount(0);
  });

  test("한 줄 띠 세 칸 — 최고 · 최저 · 원/달러 월평균", async ({ page }) => {
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    await expect(tid(page, "strip-max")).toContainText(/\d{4}-\d{2} 최고/);
    await expect(tid(page, "strip-max")).toContainText(/국제항공료 지수 \d+\.\d/);
    await expect(tid(page, "strip-min")).toContainText(/\d{4}-\d{2} 최저/);
    const fx = tid(page, "strip-fx");
    if ((await fx.count()) > 0) await expect(fx).toContainText(/원\/달러 [\d,]+원/);
    // 탑승권 아래
    const card = await box(page, "flights-ticket");
    const strip = await box(page, "strip-max");
    expect(strip.y).toBeGreaterThanOrEqual(card.y + card.height - 1);
  });

  test("가로 넘침 없음 · 콘솔 오류 없음 (1280 · 768 · 390)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    for (const [w, h] of [[1280, 800], [768, 900], [390, 844]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/flights");
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${w}px 가로 넘침`).toBeLessThanOrEqual(0);
    }
    expect(errors).toEqual([]);
  });
});

test.describe("새 /flights — 움직임 (작업 0218)", () => {
  const slide = (page: Page) => tid(page, "slide-in").filter({ has: page.getByTestId("flights-ticket") });

  test("움직임 줄이기 — 탑승권 처음부터 제자리 · 숫자 처음부터 최종 값", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    await slide(page).scrollIntoViewIfNeeded();
    for (let i = 0; i < 4; i++) {
      expect(await slide(page).evaluate((el) => el.getAnimations().length)).toBe(0);
      await page.waitForTimeout(60);
    }
    const counts = tid(page, "yoy-cards").getByTestId("count-up");
    const n = await counts.count();
    expect(n).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < n; i++) expect(await counts.nth(i).evaluate((e) => e.textContent)).toBe(await counts.nth(i).getAttribute("data-final"));
  });

  test("움직임 켜짐 — 탑승권이 왼쪽에서 들어와 제자리(±1px) · 끝나면 숫자 = 최종 값 · 숫자 글이 겹치지 않음", async ({ page }) => {
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    const home = ((await page.getByRole("heading", { level: 1 }).boundingBox())?.x) ?? 0; // 제목 왼쪽 = 탑승권이 서야 할 왼쪽 (같은 가운데 칸)
    await slide(page).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1800);
    expect(Math.abs((await box(page, "flights-ticket")).x - home)).toBeLessThanOrEqual(1);
    expect(await slide(page).evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
    const counts = tid(page, "yoy-cards").getByTestId("count-up");
    const n = await counts.count();
    for (let i = 0; i < n; i++) expect(await counts.nth(i).evaluate((e) => e.textContent)).toBe(await counts.nth(i).getAttribute("data-final"));
  });

  test("자바스크립트를 꺼도 탑승권 · 숫자 · 글자판이 보임", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/flights");
    if (await ready(page)) {
      await expect(tid(page, "flights-ticket")).toBeVisible();
      expect(await slide(page).evaluate((el) => getComputedStyle(el).opacity)).toBe("1");
      await expect(tid(page, "yoy-cards").getByTestId("count-up").first()).toHaveText(/^\d+\.\d$/);
      await expect(tid(page, "hero-board").getByTestId("flap-board")).toBeVisible();
    }
    await ctx.close();
  });
});

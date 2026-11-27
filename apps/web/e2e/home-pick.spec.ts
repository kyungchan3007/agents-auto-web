// 작업 0393 — 기본 hero 고른 곳: 탑승권 모션 · 숫자 칸 · 제안 목록 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 다는 표시(data-testid): hero-facts(숫자 칸) 안 hero-facts-title · hero-fact-rate · hero-fact-tenk · hero-fact-price · hero-fact-bar(role=img) · hero-fact-position · hero-fact-link · hero-facts-mine(고른 뒤에만)
//     제안 목록 줄 오른쪽 hero-suggest-code(공항 코드) · 탑승권 hero-pass(data-s · data-city) 의 라벨 .hp-lbl[data-mine=true] · 링크 hero-pass-go
//   값은 홈이 받는 환율 · 신호 · 물가에서만 — 값이 없는 칸은 글이 정확히 "-" (인도는 통화가 없어 전부 "-")
import { type Locator, type Page, expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const box = async (loc: Locator, name: string) => {
  const b = await loc.first().boundingBox();
  if (!b) throw new Error(`${name} 가 화면에 없음`);
  return b;
};
const front = (page: Page) => page.locator('[data-testid="hero-pass"][data-s="0"]');
const frontCity = async (page: Page) => (await front(page).getAttribute("data-city")) ?? "";
const chip = (page: Page, city: string) => tid(page, "hero-chip").filter({ hasText: city });
const outs = (page: Page) => page.evaluate(() => (window as unknown as { __outs: string[] }).__outs.slice());
const resetOuts = (page: Page) => page.evaluate(() => ((window as unknown as { __outs: string[] }).__outs.length = 0));

test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
  await page.addInitScript(() => {
    localStorage.setItem("flapfx:intro-off", "1");
    // 탑승권이 사라지기 시작한 때(data-s 가 out 으로 바뀐 때)를 도시와 함께 기록 — 한 번 고르는데 여러 번 기록되면 "반복"
    (window as unknown as { __outs: string[] }).__outs = [];
    new MutationObserver((ms) => {
      for (const m of ms) {
        const el = m.target as HTMLElement;
        if (el.getAttribute("data-s") === "out") (window as unknown as { __outs: string[] }).__outs.push(el.getAttribute("data-city") ?? "");
      }
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ["data-s"] });
  });
});

const settle = async (page: Page) => {
  await expect(front(page)).toHaveCount(1);
  await expect.poll(() => page.locator('[data-testid="hero-pass"][data-s="out"]').count(), { timeout: 5000 }).toBe(0);
};

test.describe("고르기 모션 — 처음 모션 한 번 (작업 0393 R1)", () => {
  test("칩 도쿄 → 방콕 → 다낭: 누를 때마다 맨 앞 장이 한 번만 사라지고 그 도시가 맨 앞", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    for (const city of ["도쿄", "방콕", "다낭"]) {
      await settle(page);
      if ((await frontCity(page)) === city) continue; // 자동 넘김으로 이미 맨 앞이면 건너뜀
      const before = await frontCity(page);
      await resetOuts(page);
      await chip(page, city).click();
      await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe(city);
      await page.waitForTimeout(1800); // 끊김 · 반복이 있다면 이 사이에 한 번 더 기록됨
      expect(await outs(page), `${city} 고른 뒤 사라진 장`).toEqual([before]);
      expect(await frontCity(page)).toBe(city);
    }
  });

  test("넘김 중 연달아 누르면 마지막 것만 — 끝난 뒤 맨 앞은 마지막으로 누른 도시 · 장은 도시당 한 장", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    await chip(page, "방콕").click();
    await chip(page, "다낭").click();
    await expect.poll(() => frontCity(page), { timeout: 5000 }).toBe("다낭");
    await page.waitForTimeout(1800);
    expect(await frontCity(page)).toBe("다낭");
    const cities = await tid(page, "hero-pass").evaluateAll((els) => els.map((e) => e.getAttribute("data-city")));
    expect(new Set(cities).size).toBe(cities.length);
  });

  test("고른 뒤 8초가 지나도 자동 넘김 없음 — 맨 앞은 그대로 · 사라진 장 기록 없음", async ({ page }) => {
    test.setTimeout(40_000);
    await page.goto("/");
    await settle(page);
    const target = (await frontCity(page)) === "방콕" ? "다낭" : "방콕";
    await chip(page, target).click();
    await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe(target);
    await page.waitForTimeout(1200);
    await resetOuts(page);
    await page.waitForTimeout(9000);
    expect(await outs(page)).toEqual([]);
    expect(await frontCity(page)).toBe(target);
  });

  test("고른 곳 라벨 · 항공권 링크 — 고른 장에만 \"· 고른 곳\" 과 \"{도시} 항공권 날짜 보기 ›\"", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const target = (await frontCity(page)) === "방콕" ? "다낭" : "방콕";
    await chip(page, target).click();
    await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe(target);
    await expect(front(page).locator('.hp-lbl[data-mine="true"]')).toHaveCount(1);
    await expect(front(page).locator('.hp-lbl[data-mine="true"]')).toContainText("고른 곳");
    await expect(tid(page, "hero-pass").locator('.hp-lbl[data-mine="true"]')).toHaveCount(1);
    await expect(tid(page, "hero-pass-go")).toHaveCount(1);
    await expect(tid(page, "hero-pass-go")).toHaveText(`${target} 항공권 날짜 보기 ›`);
  });
});

test.describe("검색으로 고르기 — 네 도시 밖 (작업 0393 R1 · R3)", () => {
  test("'뉴델리' 입력 → 제안 \"인도 뉴델리\" → Enter: 그 곳 장이 맨 앞 · 덱 밖 장은 하나 · 숫자 칸 제목 · 값 없는 칸은 \"-\"", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    await tid(page, "hero-search").fill("뉴델리");
    await expect(page.getByRole("option", { name: /인도 뉴델리/ })).toBeVisible();
    await tid(page, "hero-search").press("Enter");
    await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe("뉴델리");
    await expect(tid(page, "hero-facts-title")).toHaveText("인도 뉴델리");
    await expect(tid(page, "hero-facts-mine")).toBeVisible();
    for (const id of ["hero-fact-rate", "hero-fact-tenk", "hero-fact-price"]) await expect(tid(page, id), id).toHaveText("-");
    expect(await tid(page, "hero-pass").count()).toBe(5);
    // 또 다른 도시를 고르면 덱 밖 장은 여전히 하나
    await tid(page, "hero-search").fill("뭄바이");
    await tid(page, "hero-search").press("Enter");
    await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe("뭄바이");
    await expect.poll(() => tid(page, "hero-pass").count(), { timeout: 4000 }).toBe(5);
    expect(await tid(page, "hero-pass").evaluateAll((els) => els.map((e) => e.getAttribute("data-city")))).not.toContain("뉴델리");
  });

  test("제안 줄 클릭 · 보기 단추 · Enter 가 같은 결과 — 방콕을 입력해 세 가지로 고름", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const done = async () => {
      await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe("방콕");
      await expect(tid(page, "hero-facts-title")).toHaveText("태국 방콕");
      await settle(page);
    };
    await tid(page, "hero-search").fill("방콕");
    await page.getByRole("option", { name: /방콕/ }).first().click();
    await done();
    await tid(page, "hero-search").fill("다낭");
    await tid(page, "hero-go").click();
    await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe("다낭");
    await settle(page);
    await tid(page, "hero-search").fill("방콕");
    await tid(page, "hero-search").press("Enter");
    await done();
  });

  test("제안 목록이 입력칸과 겹치지 않고(입력칸 아래 8px 안팎) 맨 위에 보임 · 줄 오른쪽 공항 코드", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const input = tid(page, "hero-search");
    await input.fill("인도");
    const list = page.getByRole("listbox", { name: "도시 · 나라 제안" });
    await expect(list).toBeVisible();
    const f = await box(page.locator("form.hp-ask"), "입력칸");
    const l = await box(list, "제안 목록");
    expect(l.y, "목록 위쪽은 입력칸 아래쪽보다 아래").toBeGreaterThanOrEqual(f.y + f.height + 4);
    expect(l.y - (f.y + f.height)).toBeLessThanOrEqual(14);
    // 목록 안 여러 점이 실제로 목록(맨 위)이어야 — 칩 · 안내 글이 비치거나 위에 올라오지 않음
    const hits = await page.evaluate(
      ({ x, y, w, h }) => [0.1, 0.5, 0.9].flatMap((fx) => [0.15, 0.5, 0.85].map((fy) => !!document.elementFromPoint(x + w * fx, y + h * fy)?.closest('[role="listbox"]'))),
      { x: l.x, y: l.y, w: l.width, h: l.height },
    );
    expect(hits.every(Boolean), "목록 위에 다른 것이 올라옴").toBe(true);
    // 불투명 — 배경 알파 1
    const bg = await list.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/^rgb\(/);
    // 도시 · 나라 검색은 그대로: "도쿄" 제안 줄에 공항 코드
    await input.fill("도쿄");
    const opt = page.getByRole("option", { name: /도쿄/ }).first();
    await expect(opt).toBeVisible();
    await expect(opt.locator('[data-testid="hero-suggest-code"]')).toHaveText(/^[A-Z]{3}$/);
    const o = await box(opt, "줄");
    const c = await box(opt.locator('[data-testid="hero-suggest-code"]'), "공항 코드");
    expect(c.x + c.width, "공항 코드는 줄 오른쪽").toBeGreaterThan(o.x + o.width * 0.7);
  });
});

test.describe("숫자 칸 (작업 0393 R2)", () => {
  test("안 골랐을 때 맨 앞 탑승권 도시를 따라감 · 비지 않음 · 값 있는 도시는 \"-\" 아님", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const city = await frontCity(page);
    await expect(tid(page, "hero-facts")).toBeVisible();
    await expect(tid(page, "hero-facts-title")).toContainText(city);
    await expect(tid(page, "hero-facts-mine")).toHaveCount(0);
    for (const id of ["hero-fact-rate", "hero-fact-tenk", "hero-fact-price", "hero-fact-position"]) expect(((await tid(page, id).textContent()) ?? "").trim().length, id).toBeGreaterThan(0);
    await expect(tid(page, "hero-fact-bar")).toHaveAttribute("role", "img");
    // 값이 있는 곳은 숫자가 있음 (환율 칸)
    const rate = (await tid(page, "hero-fact-rate").textContent()) ?? "";
    if (rate.trim() !== "-") expect(rate).toMatch(/\d/);
  });

  test("도쿄 → 방콕 → 다낭 → 뉴델리: 숫자 칸 제목이 따라가고 높이는 같음 (±1px)", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const heights: number[] = [];
    for (const [city, title] of [
      ["도쿄", "일본 도쿄"],
      ["방콕", "태국 방콕"],
      ["다낭", "베트남 다낭"],
    ] as const) {
      await chip(page, city).click();
      await expect(tid(page, "hero-facts-title")).toHaveText(title);
      await settle(page);
      heights.push((await box(tid(page, "hero-facts"), "숫자 칸")).height);
    }
    await tid(page, "hero-search").fill("뉴델리");
    await tid(page, "hero-search").press("Enter");
    await expect(tid(page, "hero-facts-title")).toHaveText("인도 뉴델리");
    await settle(page);
    heights.push((await box(tid(page, "hero-facts"), "숫자 칸")).height);
    expect(Math.max(...heights) - Math.min(...heights), `숫자 칸 높이 ${heights.join(" · ")}`).toBeLessThanOrEqual(1);
  });

  test("값이 있는 도쿄: 오늘 환율 \"원\" · 1만원이면 \"엔\" · 위치 문장 \"90일 중\" · 나라 페이지 링크 · 값을 지어내지 않음(숫자 + 단위 모양)", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    await chip(page, "도쿄").click();
    await expect(tid(page, "hero-facts-title")).toHaveText("일본 도쿄");
    const rate = (await tid(page, "hero-fact-rate").textContent()) ?? "";
    test.skip(rate.trim() === "-", "이 환경의 자료에 엔 환율이 없음");
    expect(rate).toMatch(/\d[\d,.]*원/);
    expect(rate).toContain("1엔");
    expect((await tid(page, "hero-fact-tenk").textContent()) ?? "").toMatch(/\d[\d,]*\s*엔/);
    await expect(tid(page, "hero-fact-position")).toContainText("90일 중");
    await expect(tid(page, "hero-fact-link")).toHaveAttribute("href", /\/(prices|currencies)\//);
  });
});

test.describe("새로고침 뒤 유지 (작업 0393 R1)", () => {
  test("방콕을 고르고 새로고침하면 고른 곳(저장 값 · 숫자 칸 제목)이 그대로", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    await chip(page, "방콕").click();
    await expect(tid(page, "hero-facts-title")).toHaveText("태국 방콕");
    await page.reload();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("flapfx:picked") ?? "null")?.city)).toBe("방콕");
    await expect(tid(page, "hero-facts-title")).toHaveText("태국 방콕");
  });
});

// 작업 0292 — 따로 선 "더 보기" 링크를 한 모양으로 (사용자가 정한 조건: 시안 61번 "다 수정")
//   홈 "다른 통화 N개 모두 보기 ›" · 통화 상세 "이 통화 쓰는 나라 물가 보기 ›" · 여행 물가(통화로 거른 화면) "전체 보기 ›" 가 같은 모양: 굵은 글자 · 파랑 · 아래 밑줄 2px
//   이 링크가 없는 통화(예: 바레인 디나르 BHD)는 같은 글을 안 보이게 자리만 잡아 아래 구간과의 간격이 다른 통화와 같음 · 숨은 글은 읽기 프로그램 · 키보드에 안 잡힘
import { type Page, expect, test } from "@playwright/test";

const SIGN = (el: Element) => {
  const cs = getComputedStyle(el), r = el.getBoundingClientRect();
  // display 는 비교하지 않음 — flex 칸 안의 inline-block 은 계산값이 block 으로 바뀌지만 보이는 모양은 같음. 대신 밑줄이 글자보다 길게 늘어나지 않는지(링크 폭 − 글자 폭)를 잼
  const range = document.createRange();
  range.selectNodeContents(el);
  const textW = range.getBoundingClientRect().width;
  return { weight: cs.fontWeight, size: cs.fontSize, color: cs.color, borderB: `${cs.borderBottomWidth} ${cs.borderBottomStyle} ${cs.borderBottomColor}`, padB: cs.paddingBottom, lineH: cs.lineHeight, h: Math.round(r.height * 10) / 10, deco: cs.textDecorationLine, stretch: Math.round(r.width - textW) <= 2 };
};
const BLUE = "rgb(36, 56, 168)";

async function goto(page: Page, path: string, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}
const homeLink = (page: Page) => page.locator('[data-testid="more-currencies"]');
const detailLink = (page: Page) => page.locator('a[href^="/prices?currency="]', { hasText: "이 통화 쓰는 나라 물가 보기" });
const pricesLink = (page: Page) => page.locator('a[href="/prices"]', { hasText: "전체 보기" });

test.describe("링크 모양 하나 (작업 0292)", () => {
  test("홈 · 통화 상세 · 여행 물가(거른 화면) 링크가 같은 모양 — 굵게 · 파랑 · 밑줄 2px · 같은 크기 · 같은 높이", async ({ page }) => {
    await goto(page, "/");
    test.skip((await homeLink(page).count()) === 0, "홈 링크 없음");
    const home = await homeLink(page).evaluate(SIGN);
    await goto(page, "/currencies/USD");
    test.skip((await detailLink(page).count()) === 0, "통화 상세 링크 없음");
    const detail = await detailLink(page).evaluate(SIGN);
    await goto(page, "/prices?currency=EUR");
    test.skip((await pricesLink(page).count()) === 0, "여행 물가 거른 화면 링크 없음");
    const prices = await pricesLink(page).first().evaluate(SIGN);
    expect(Number(home.weight), "굵기").toBeGreaterThanOrEqual(700);
    expect(home.borderB, "밑줄 두께 2px").toMatch(/^2px solid/);
    expect(home.color, "글자색 파랑").toBe(BLUE);
    expect(home.deco, "글자 밑줄이 아니라 아래 선").toBe("none");
    expect(home.stretch, "홈 밑줄이 글자 폭만큼").toBe(true);
    for (const [name, s] of Object.entries({ "통화 상세": detail, "여행 물가": prices })) {
      expect(s, `${name} 링크 모양이 홈과 같음`).toEqual(home);
    }
  });

  test("휴대폰 390 — 세 링크 모양이 같고 가로로 넘치지 않음", async ({ page }) => {
    const sigs: ReturnType<typeof SIGN>[] = [];
    for (const [path, loc] of [["/", homeLink], ["/currencies/USD", detailLink], ["/prices?currency=EUR", (p: Page) => pricesLink(p).first()]] as const) {
      await goto(page, path, 390);
      test.skip((await loc(page).count()) === 0, `${path} 링크 없음`);
      sigs.push(await loc(page).evaluate(SIGN));
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${path} 가로 넘침`).toBeLessThanOrEqual(0);
    }
    expect(sigs[1]).toEqual(sigs[0]);
    expect(sigs[2]).toEqual(sigs[0]);
  });

  test("링크가 없는 통화(BHD)도 USD 와 아래 구간 간격이 같음(1280 · 390) — 링크 줄 높이 · 위 칸과 거리 · 아래 칸과 거리", async ({ page }) => {
    for (const width of [1280, 390]) {
      const rows: Record<string, { h: number; above: number; below: number }> = {};
      for (const code of ["USD", "JPY", "EUR", "SAR", "BHD", "KWD", "HKD"]) {
        await goto(page, `/currencies/${code}`, width);
        rows[code] = await page.evaluate(() => {
          const el = (document.querySelector('a[href^="/prices?currency="]') ?? Array.from(document.querySelectorAll("span[aria-hidden].invisible")).find((s) => (s.textContent ?? "").includes("물가 보기"))) as HTMLElement | undefined;
          const p = el?.parentElement as HTMLElement;
          const b = p.getBoundingClientRect(), prev = p.previousElementSibling?.getBoundingClientRect(), next = p.nextElementSibling?.getBoundingClientRect();
          return { h: Math.round(b.height * 10) / 10, above: prev ? Math.round((b.top - prev.bottom) * 10) / 10 : 0, below: next ? Math.round((next.top - b.bottom) * 10) / 10 : 0 };
        });
      }
      for (const [code, r] of Object.entries(rows)) {
        expect(Math.abs(r.h - rows.USD.h), `${width}px ${code} 링크 줄 높이 ${r.h} (USD ${rows.USD.h})`).toBeLessThanOrEqual(1);
        expect(Math.abs(r.above - rows.USD.above), `${width}px ${code} 위 칸과 거리`).toBeLessThanOrEqual(1);
        expect(Math.abs(r.below - rows.USD.below), `${width}px ${code} 아래 칸과 거리`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("링크가 없는 통화의 숨은 자리 글은 안 보이고 · 읽기 프로그램에 없고 · 키보드(Tab)에 안 잡힘", async ({ page }) => {
    await goto(page, "/currencies/BHD");
    test.skip((await detailLink(page).count()) > 0, "BHD 에 링크가 있어 숨은 자리가 없음");
    expect(await page.locator("body").innerText(), "보이는 글").not.toContain("이 통화 쓰는 나라 물가 보기");
    await expect(page.getByRole("link", { name: /이 통화 쓰는 나라 물가 보기/ }), "링크 역할(읽기 프로그램)").toHaveCount(0);
    const hidden = page.locator("span[aria-hidden].invisible", { hasText: "이 통화 쓰는 나라 물가 보기" });
    await expect(hidden).toHaveCount(1);
    expect(await hidden.evaluate((e) => getComputedStyle(e).visibility), "보이지 않음").toBe("hidden");
    expect(await hidden.evaluate((e) => e.tagName.toLowerCase()), "링크가 아니라 글 칸").toBe("span");
    const reached: string[] = [];
    for (let i = 0; i < 120; i++) {
      await page.keyboard.press("Tab");
      reached.push(await page.evaluate(() => (document.activeElement as HTMLElement | null)?.innerText?.replace(/\s+/g, " ").trim().slice(0, 40) ?? ""));
    }
    expect(reached.filter((t) => t.includes("물가 보기")), "Tab 으로 닿은 숨은 링크").toEqual([]);
  });

  test("링크가 있는 통화(USD)는 /prices?currency=USD 로 가는 진짜 링크 · 키보드로 닿음", async ({ page }) => {
    await goto(page, "/currencies/USD");
    test.skip((await detailLink(page).count()) === 0, "USD 에 링크 없음");
    await expect(detailLink(page)).toHaveAttribute("href", "/prices?currency=USD");
    await detailLink(page).focus();
    expect(await page.evaluate(() => (document.activeElement as HTMLElement).getAttribute("href"))).toBe("/prices?currency=USD");
  });
});

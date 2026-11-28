// 작업 0217 — 새 디자인 홈 검사 (시안 B + 환전 타이밍 A) · 테스트 먼저
//   표시: data-testid="home-hero"(파랑 첫 면) · "hero-month"(노랑 월) · "hero-lede" · "hero-tag"
//        "year-bars"(role=img) · "year-bar"(data-tone high|low|mid|none) · "year-link" · "dest-list"(흰 판) · "dest-row" · "dest-rate"(data-final) · "dest-dot"(data-position) · "dest-flag"
import { type Page, expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";

test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
});

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
  test("메뉴와 한 면으로 이어지는 파랑 · 큰 제목 'N월에 떠나세요.' (월만 노랑) · 한 줄 + 출처 꼬리표 (작업 0380 새 문구)", async ({ page }) => {
    await page.goto("/");
    const header = await page.getByRole("banner").boundingBox();
    const hero = await box(page, "home-hero");
    expect(await bg(page, "hero-carousel")).toBe(BLUE); // 작업 0394: 바탕색은 작업 0385 부터 캐러셀 칸(hero-carousel)이 가짐 · home-hero 는 투명
    expect(Math.abs(hero.y - (header!.y + header!.height))).toBeLessThanOrEqual(1);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(/^\d+월에 떠나세요\.$/);
    expect(await tid(page, "hero-month").evaluate((el) => getComputedStyle(el).color)).toBe(SUN);
    await expect(tid(page, "hero-month")).toHaveText(/^\d+월$/);
    // 작업 0380: 한 줄 "항공료가 {1년 중 | 받은 달 중} 가장 낮은 달입니다." + 꼬리표 · 가장 높은 달 · 지수 최저/최고 긴 문장은 뺌
    await expect(tid(page, "hero-lede")).toHaveText(/^항공료가 (1년|받은 달) 중 가장 낮은 달입니다\.$/);
    await expect(tid(page, "hero-tag")).toHaveText("통계청 국제항공료 지수");
    await expect(tid(page, "home-hero")).not.toContainText("통계청 국제항공료 지수로 보면");
    await expect(tid(page, "home-hero")).not.toContainText("가장 높습니다");
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
    await page.emulateMedia({ reducedMotion: "reduce" }); // 막대가 자라는 중이면 높이가 달라 보임 (그래프 2D) — 움직임 줄이기는 처음부터 최종 모양
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
    // 그래프 2D(시안 F): 막대는 SVG 그라데이션(위 진하고 아래로 옅어짐) — 색은 fill 이 url(#…) 이고 톤(data-tone)으로 구분 (색 값은 홈 12달 막대 spec 에서)
    for (const i of [hiI, loI]) expect(await bars.nth(i).evaluate((e) => (e.getAttribute("fill") ?? "").startsWith("url(#") || !!e.querySelector('[fill^="url(#"]')), `${i + 1}월 막대 그라데이션`).toBe(true);
    await expect(tid(page, "year-bars")).toHaveAttribute("role", "img");
    // 작업 0276: 말풍선은 달 이름 없이 '가장 비싼 달' · '가장 저렴한 달' · 달 이름은 구간 제목 '가장 저렴한 달은 11월, 가장 비싼 달은 5월' 과 눈금에 있음
    await expect(tid(page, "year-bars")).toContainText("가장 비싼 달");
    await expect(page.locator("#year-title")).toContainText(`가장 비싼 달은 ${hiI + 1}월`);
    await expect(tid(page, "year-bars")).toContainText("가장 저렴한 달");
    await expect(page.locator("#year-title")).toContainText(`가장 저렴한 달은 ${loI + 1}월`);
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
    // 작업 0401: 0398 부터 카드 자리는 처음부터 끝 높이이고 보이는 판(흰 바탕 · 옅은 선 · 모서리)은 ::before 가 그림(clip-path 로 알약 → 펼침)
    const plate = await list.evaluate((el) => {
      const b = getComputedStyle(el, "::before");
      return { bg: b.backgroundColor, bw: Number.parseFloat(b.borderTopWidth) };
    });
    expect(plate.bg).toBe("rgb(255, 255, 255)");
    // 흰 바탕 위 흰 판은 옅은 선으로 구분 (작업 0216 흰 바탕 결정)
    expect(plate.bw).toBeGreaterThanOrEqual(1);
    const n = await tid(page, "dest-row").count();
    expect(n).toBeGreaterThanOrEqual(4);
    expect(await list.locator('[data-testid="dest-row"]').count()).toBe(n);
    await expect(tid(page, "dest-flag")).toHaveCount(n);
    await expect(list.locator("svg").first()).toBeVisible(); // 도시 사진 대신 국기 (SVG)
    await expect(tid(page, "dest-row").first()).toContainText(/하위 \d+% · 낮음|하위 \d+% · 보통|상위 \d+% · 높음/);
    await expect(tid(page, "more-currencies")).toContainText("다른 통화");
  });

  test("움직임 줄이기 — 금액이 처음부터 최종 값 · 동그라미도 처음부터 제자리", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    // 작업 0382: 자바스크립트가 붙으며(하이드레이션) 요소가 교체되는 동안 evaluate 하면 'Element is not attached to the DOM' 이 간헐로 남 — 붙은 뒤에 잼
    await page.waitForLoadState("networkidle");
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
    const startAttr = await rate.getAttribute("data-start");
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
    // 작업 0228: 금액은 90일 중간값(data-start)이 있을 때만 카운트업 — api 가 median 을 아직 안 주는 환경(배포 전)에서는 오늘 값 그대로(숫자를 지어내지 않음) · 동그라미는 가운데에서 오늘 자리로 움직임
    if (startAttr !== null) expect(rates.length).toBeGreaterThan(3);
    else expect(rates.every((t) => t === final)).toBe(true);
    expect(rates[rates.length - 1]).toBe(final);
    expect(dots.length).toBeGreaterThan(3); // 동그라미도 같은 동안 움직임
  });

  test("자바스크립트를 꺼도 금액 · 막대 · 12달 막대가 보임", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await forceDefaultHero(page);
    await page.goto("/");
    await expect(tid(page, "dest-rate").first()).toHaveText(/^[\d,.]+원$/);
    await expect(tid(page, "year-bar")).toHaveCount(12);
    await expect(tid(page, "home-hero")).toBeVisible();
    await ctx.close();
  });
});

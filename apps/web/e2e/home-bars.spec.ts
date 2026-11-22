// 작업 0217 그래프 2D(시안 F) — 홈 '12달 막대' e2e · 테스트 먼저
//   기준 캡처: .tmp/redesign-1118/F/shots/home-1280.png · home-390.png · home-mid.png · 시안 코드 F/home.html (barChart)
//   DOM 계약(builder): svg[data-testid="year-bars"][role=img][data-state=idle|playing|done] 안
//     year-bar[data-month=1~12][data-tone=high|low|mid|none][data-reveal]  막대(위 둥근 모서리 · 아래로 옅어지는 그라데이션 · 그림자) — 안에 fill 이 url(#…) 인 요소
//     year-tag[data-kind=high|low][data-reveal]  '가장 비싼 달'(빨강) · '가장 저렴한 달'(노랑) 말풍선(작업 0276)
//     chart-grid[data-reveal] · chart-axis[data-reveal](왼쪽 눈금 = 실제 지수 숫자 — 시안의 '비쌈 ↑ · 쌈 ↓' 글자는 쓰지 않음)
//     year-month  달 이름 (넓은 화면 '1월'… · 휴대폰 '1'…)
//   움직임(약 2.8초 · 한 번): 눈금 → 1월부터 차례로 자람 → 5월 · 11월이 튀며 색이 들어옴 → 말풍선 톡 · 움직임 줄이기는 처음부터 최종 모양
import { type Page, expect, test } from "@playwright/test";
import { expectInsideViewport, expectTextsInside, reveal, scrollJustBelow, scrollTo, tid } from "./chart-helpers";

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const bars = (page: Page) => tid(page, "year-bars");
const ready = async (page: Page) => (await bars(page).count()) > 0;

type Rec = { t: number; grid: number; bars: number[]; tags: number[] };
async function record(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __r: unknown[]; __raf: number };
    w.__r = [];
    const t0 = performance.now();
    const rv = (el: Element | null) => (el ? Number(el.getAttribute("data-reveal")) : Number.NaN);
    const tick = () => {
      const root = document.querySelector('[data-testid="year-bars"]');
      w.__r.push({
        t: performance.now() - t0,
        grid: rv(root?.querySelector('[data-testid="chart-grid"]') ?? null),
        bars: [...(root?.querySelectorAll('[data-testid="year-bar"]') ?? [])].sort((a, b) => Number(a.getAttribute("data-month")) - Number(b.getAttribute("data-month"))).map(rv),
        tags: [...(root?.querySelectorAll('[data-testid="year-tag"]') ?? [])].sort((a, b) => (a.getAttribute("data-kind") === "high" ? -1 : 1) - (b.getAttribute("data-kind") === "high" ? -1 : 1)).map(rv),
      });
      w.__raf = requestAnimationFrame(tick);
    };
    tick();
  });
}
const stop = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __r: unknown[]; __raf: number };
    cancelAnimationFrame(w.__raf);
    return w.__r as Rec[];
  });

test.describe("홈 12달 막대 — 풍성한 2D (작업 0217 · 시안 F)", () => {
  test("끝나면 최종 모양 — 막대 12개 · 5월(높음) 빨강 · 11월(낮음) 노랑 톤 · 그라데이션 · 말풍선 둘 · 달 이름 12개", async ({ page }) => {
    await page.goto("/");
    test.skip(!(await ready(page)), "지수 자료 없음");
    const chart = bars(page);
    await scrollTo(page, chart);
    await page.waitForTimeout(5000);
    await expect(chart).toHaveAttribute("data-state", "done");
    await expect(chart).toHaveAttribute("role", "img");
    const barEls = chart.locator('[data-testid="year-bar"]');
    await expect(barEls).toHaveCount(12);
    expect(await reveal(chart.locator('[data-testid="chart-grid"]')), "눈금").toBe(1);
    expect(await reveal(chart.locator('[data-testid="chart-axis"]')), "눈금 글").toBe(1);
    const info = await barEls.evaluateAll((els) =>
      els.map((e) => ({
        month: Number(e.getAttribute("data-month")),
        tone: e.getAttribute("data-tone"),
        reveal: Number(e.getAttribute("data-reveal")),
        gradient: (e.getAttribute("fill") ?? "").startsWith("url(#") || !!e.querySelector('[fill^="url(#"]'),
        h: e.getBoundingClientRect().height,
      })),
    );
    expect(info.map((b) => b.month).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const b of info) {
      expect(b.reveal, `${b.month}월 막대`).toBe(1);
      expect(b.gradient, `${b.month}월 그라데이션`).toBe(true);
    }
    expect(info.filter((b) => b.tone === "high")).toHaveLength(1);
    expect(info.filter((b) => b.tone === "low")).toHaveLength(1);
    const hi = info.find((b) => b.tone === "high")!;
    const lo = info.find((b) => b.tone === "low")!;
    expect(hi.h, "가장 비싼 달이 가장 높음").toBe(Math.max(...info.map((b) => b.h)));
    expect(lo.h, "가장 싼 달이 가장 낮음").toBe(Math.min(...info.map((b) => b.h)));
    // 말풍선: 빨강(높음) · 노랑(낮음) — 글에 달 이름
    const tagHigh = chart.locator('[data-testid="year-tag"][data-kind="high"]');
    const tagLow = chart.locator('[data-testid="year-tag"][data-kind="low"]');
    await expect(tagHigh).toHaveText("가장 비싼 달"); // 작업 0276: '5월 가장 비쌈' → '가장 비싼 달'(달 이름은 바로 아래 눈금에 있음)
    await expect(tagLow).toHaveText("가장 저렴한 달"); // 작업 0276: '11월 가장 쌈' → '가장 저렴한 달'
    expect(await reveal(tagHigh)).toBe(1);
    expect(await reveal(tagLow)).toBe(1);
    // 달 이름: 넓은 화면은 '1월' · 휴대폰은 숫자
    const months = await chart.locator('[data-testid="year-month"]').allTextContents();
    expect(months.map((m) => m.trim())).toEqual(Array.from({ length: 12 }, (_, i) => (isPhone(page) ? String(i + 1) : `${i + 1}월`)));
  });

  test("왼쪽 눈금은 실제 지수 숫자 — '비쌈 ↑ · 쌈 ↓' 글자 없음 · 숫자가 아래서 위로 커지는 순서", async ({ page }) => {
    await page.goto("/");
    test.skip(!(await ready(page)), "지수 자료 없음");
    const chart = bars(page);
    await scrollTo(page, chart);
    await page.waitForTimeout(5000);
    const axis = chart.locator('[data-testid="chart-axis"]');
    await expect(axis).not.toContainText("비쌈 ↑");
    await expect(axis).not.toContainText("쌈 ↓");
    await expect(axis).not.toContainText("높음 ↑"); // 작업 0276: 새 낱말로도 글자 눈금을 쓰지 않음
    await expect(axis).not.toContainText("낮음 ↓");
    const ticks = await axis.evaluate((g) =>
      [...g.querySelectorAll("text")].map((t) => ({ txt: (t.textContent ?? "").trim(), y: t.getBoundingClientRect().top })).filter((t) => /^\d{2,3}(\.\d)?$/.test(t.txt)),
    );
    expect(ticks.length, "숫자 눈금").toBeGreaterThanOrEqual(3);
    const byY = ticks.slice().sort((a, b) => b.y - a.y); // 아래 → 위
    for (let i = 1; i < byY.length; i++) expect(Number(byY[i].txt), "위로 갈수록 큰 숫자").toBeGreaterThan(Number(byY[i - 1].txt));
  });

  test("말풍선은 그래프 안 · 어떤 막대도 가리지 않음(위로 올려 점선으로 이음) · 글이 svg 밖으로 안 나감 · 가로 넘침 0", async ({ page }) => {
    await page.goto("/");
    test.skip(!(await ready(page)), "지수 자료 없음");
    const chart = bars(page);
    await scrollTo(page, chart);
    await page.waitForTimeout(5000);
    await expectInsideViewport(page, chart, "12달 막대");
    await expectTextsInside(chart);
    const barBoxes = await chart.locator('[data-testid="year-bar"]').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ x: r.left, y: r.top, r: r.right, b: r.bottom })));
    for (const kind of ["high", "low"]) {
      const t = chart.locator(`[data-testid="year-tag"][data-kind="${kind}"]`);
      const tb = (await t.evaluate((e) => {
        // 말풍선 본체(글 + 상자)만 — 점선 · 꼬리 선은 제외해 글 상자 기준
        const r = (e.querySelector("text") ?? e).getBoundingClientRect();
        return { x: r.left, y: r.top, r: r.right, b: r.bottom };
      })) as { x: number; y: number; r: number; b: number };
      for (const [i, b] of barBoxes.entries()) {
        const hit = Math.min(tb.r, b.r) - Math.max(tb.x, b.x) > 1 && Math.min(tb.b, b.b) - Math.max(tb.y, b.y) > 1;
        expect(hit, `${kind} 말풍선 글이 ${i + 1}번째 막대와 겹침`).toBe(false);
      }
    }
    const h = (await chart.boundingBox())!.height;
    expect(h, "그래프 높이(시안 380 · 휴대폰 300)").toBeGreaterThanOrEqual(isPhone(page) ? 260 : 340);
    expect(h).toBeLessThanOrEqual(isPhone(page) ? 340 : 420);
  });

  test("화면에 들어오기 전엔 시작 안 함(idle · 모든 막대 0) → 들어오면 재생 → 끝나면 done", async ({ page }) => {
    await page.goto("/");
    test.skip(!(await ready(page)), "지수 자료 없음");
    const chart = bars(page);
    await scrollJustBelow(page, chart);
    await page.waitForTimeout(1500);
    await expect(chart).toHaveAttribute("data-state", "idle");
    const rv = await chart.locator('[data-testid="year-bar"]').evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-reveal"))));
    for (const [i, v] of rv.entries()) expect(v, `막대 ${i + 1} 이 이미 자람`).toBe(0);
    expect(await reveal(chart.locator('[data-testid="year-tag"]')), "말풍선이 이미 보임").toBe(0);
    await scrollTo(page, chart);
    await expect(chart).toHaveAttribute("data-state", "done", { timeout: 8000 });
  });

  test("순서 — 눈금 → 1월부터 차례로 자람 → 5월 · 11월 색 → 말풍선(높음이 먼저) · 전체 약 2.8초 안팎(5초 이내)", async ({ page }) => {
    await page.goto("/");
    test.skip(!(await ready(page)), "지수 자료 없음");
    const chart = bars(page);
    await scrollJustBelow(page, chart);
    await page.waitForTimeout(500);
    await record(page);
    await scrollTo(page, chart);
    await page.waitForTimeout(5500);
    const fr = await stop(page);
    const first = (f: (x: Rec) => number | undefined, eps = 0.05) => fr.find((x) => (f(x) ?? 0) > eps)?.t;
    const grid = first((x) => x.grid);
    expect(grid, "눈금이 끝내 안 나타남").toBeDefined();
    const starts = Array.from({ length: 12 }, (_, i) => first((x) => x.bars[i]));
    for (const [i, t] of starts.entries()) expect(t, `${i + 1}월 막대가 끝내 안 자람`).toBeDefined();
    const s = starts as number[];
    expect(grid as number, "눈금이 막대보다 먼저").toBeLessThanOrEqual(s[0]);
    for (let i = 1; i < 12; i++) expect(s[i], `${i + 1}월이 ${i}월보다 먼저 자람`).toBeGreaterThanOrEqual(s[i - 1]);
    expect(s[11] - s[0], "1월 → 12월 시작 간격").toBeGreaterThan(300);
    // 막대는 서서히 자람(중간 진행 프레임)
    expect(fr.some((x) => x.bars[0] > 0.2 && x.bars[0] < 0.8), "1월 막대가 서서히 자람").toBe(true);
    // 말풍선은 모든 막대가 거의 다 자란 뒤 · 높음이 낮음보다 먼저(같거나)
    const allGrown = fr.find((x) => x.bars.every((b) => b >= 0.9))?.t;
    expect(allGrown, "막대가 다 자라지 않음").toBeDefined();
    const tagStart = [first((x) => x.tags[0]), first((x) => x.tags[1])];
    expect(tagStart[0], "높음 말풍선").toBeDefined();
    expect(tagStart[1], "낮음 말풍선").toBeDefined();
    expect(tagStart[0] as number, "말풍선이 막대가 다 자라기 전에 나옴").toBeGreaterThanOrEqual((allGrown as number) - 250);
    expect(tagStart[1] as number, "낮음 말풍선이 높음보다 먼저").toBeGreaterThanOrEqual(tagStart[0] as number);
    const total = fr.find((x) => x.tags.every((v) => v >= 0.999) && x.bars.every((b) => b >= 0.999))?.t;
    expect(total, "끝나지 않음").toBeDefined();
    expect((total as number) - (grid as number), "전체 길이").toBeLessThanOrEqual(5000);
  });

  test("한 번만 — 위로 올라갔다 다시 와도 다시 자라지 않음", async ({ page }) => {
    await page.goto("/");
    test.skip(!(await ready(page)), "지수 자료 없음");
    const chart = bars(page);
    await scrollTo(page, chart);
    await expect(chart).toHaveAttribute("data-state", "done", { timeout: 8000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await record(page);
    await scrollTo(page, chart);
    await page.waitForTimeout(1500);
    const fr = await stop(page);
    for (const f of fr) {
      expect(f.grid).toBeGreaterThanOrEqual(0.999);
      for (const b of f.bars) expect(b, "막대가 다시 낮아짐").toBeGreaterThanOrEqual(0.999);
      for (const t of f.tags) expect(t, "말풍선이 다시 숨음").toBeGreaterThanOrEqual(0.999);
    }
  });

  test("움직임 줄이기 — 처음부터 최종 모양", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    test.skip(!(await ready(page)), "지수 자료 없음");
    await record(page);
    await scrollTo(page, bars(page));
    await page.waitForTimeout(800);
    const fr = await stop(page);
    for (const f of fr) {
      expect(f.grid).toBeGreaterThanOrEqual(0.999);
      for (const b of f.bars) expect(b, `막대가 처음부터 1 이 아님 (t=${f.t.toFixed(0)}ms)`).toBeGreaterThanOrEqual(0.999);
      for (const t of f.tags) expect(t).toBeGreaterThanOrEqual(0.999);
    }
    await expect(bars(page)).toHaveAttribute("data-state", "done");
  });

  test("자바스크립트를 꺼도 최종 모양이 보임 (막대 12 · 말풍선 둘 · 달 이름)", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/");
    if (!(await ready(page))) {
      await ctx.close();
      test.skip(true, "지수 자료 없음");
    }
    await expect(page.locator('[data-testid="year-bars"] [data-testid="year-bar"]')).toHaveCount(12);
    await expect(page.locator('[data-testid="year-bars"] [data-testid="year-tag"]')).toHaveCount(2);
    await expect(page.locator('[data-testid="year-bars"] [data-testid="year-month"]')).toHaveCount(12);
    const rv = await page.locator('[data-testid="year-bars"] [data-testid="year-bar"]').evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-reveal"))));
    for (const v of rv) expect(v).toBe(1);
    await ctx.close();
  });
});

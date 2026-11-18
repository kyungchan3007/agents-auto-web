// 작업 0221 그래프 2D(시안 F) — 직구 계산 '수입물가와 원/달러' 그래프 e2e · 테스트 먼저
//   기준 캡처: .tmp/redesign-1118/F/shots/calc-1280.png · calc-390.png
//   그래프 DOM 계약은 e2e/chart-helpers.ts 맨 위 주석(0216 공통 부품) + 기준선 [data-testid="chart-ref"] (글 "2025-10 = 100")
//   선 둘: price(수입물가지수 · 청록 · 면) · fx(원/달러 월평균 · 남색 · 면) — 각자 끝 말풍선 · 최고/최저 점 없음 · 세로 눈금 숫자 없음(단위가 달라 모양만 비교)
//   배치는 그대로: 왼쪽 숫자 카드 두 장 · 오른쪽 그래프(import-chart) · 그 아래 과세환율
import { type Page, expect, test } from "@playwright/test";
import { expectInsideViewport, expectLineChartFinal, expectTextsInside, firstAbove, firstDone, reveal, scrollJustBelow, scrollTo, startRecording, stopRecording, tid } from "./chart-helpers";

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const chartOf = (page: Page) => tid(page, "import-chart").locator('[data-testid="line-chart"]');
const endValue = (chart: ReturnType<typeof chartOf>, id: string) => chart.locator(`[data-testid="chart-end"][data-series="${id}"] [data-testid="chart-end-value"]`);
const num = (t: string | null) => Number((t ?? "").replace(/[^\d.]/g, ""));
/** 수입물가 자료가 있어 그래프 칸이 있을 때만 검사 — 자료가 없으면 건너뜀 (칸은 있는데 새 선 그래프가 없으면 실패해야 하므로 선 그래프 유무는 보지 않음) */
const ready = async (page: Page) => (await tid(page, "import-chart").count()) > 0;

test.describe("직구 수입물가 그래프 — 풍성한 2D (작업 0221 · 시안 F)", () => {
  test("선 2개 · 둘 다 그라데이션 면 · 기준선 '= 100' 꼬리표 · 끝 말풍선 둘 — 끝나면 최종 모양, 말풍선 숫자 = 왼쪽 숫자 카드의 실제 값", async ({ page }) => {
    await page.goto("/calc");
    const chart = chartOf(page);
    test.skip(!(await ready(page)), "수입물가 자료 없음");
    await scrollTo(page, chart);
    await page.waitForTimeout(5500);
    await expectLineChartFinal(page, chart, { series: ["price", "fx"], areas: ["price", "fx"] });
    await expect(chart.locator('[data-testid="chart-ref"]')).toHaveCount(1); // 기준선
    await expect(chart.locator('[data-testid="chart-ref-label"]')).toHaveText(isPhone(page) ? /= 100/ : /\d{4}-\d{2} = 100/); // 기준선 꼬리표 글 (휴대폰은 짧은 글 '= 100' — 시안 휴대폰)
    if (!isPhone(page)) {
      // 휴대폰 말풍선은 숫자만(시안 휴대폰) — 이름은 넓은 화면에서만
      await expect(chart.locator('[data-testid="chart-end"][data-series="price"]')).toContainText("수입물가");
      await expect(chart.locator('[data-testid="chart-end"][data-series="fx"]')).toContainText("원/달러");
    }
    // 최고/최저 점은 이 그래프에 없음 · 날짜 눈금은 있음
    await expect(chart.locator('[data-testid="chart-mark"]')).toHaveCount(0);
    await expect(chart.locator('[data-testid="chart-axis"]')).toContainText(isPhone(page) ? /\d\d\.\d\d/ : /20\d\d-\d\d/);
    // 말풍선 숫자 = 왼쪽 숫자 카드(import-kpi · count-up data-final)의 값 — 모양만 비교하는 그래프지만 끝 숫자는 실제 값
    const kpiNums = (await tid(page, "import-kpi").locator('[data-testid="count-up"]').evaluateAll((els) => els.map((e) => e.getAttribute("data-final")))).map(num);
    expect(kpiNums.length).toBe(2);
    for (const id of ["price", "fx"]) {
      const v = num(await endValue(chart, id).getAttribute("data-final"));
      expect(kpiNums.some((k) => Math.abs(k - v) <= 0.011), `${id} 끝 값 ${v} 이(가) 숫자 카드 ${kpiNums} 에 없음`).toBe(true);
    }
  });

  test("그래프는 화면 안 · 글이 svg 밖으로 안 나감 · 가로 넘침 0 · 말풍선 둘이 서로 안 겹침 · 높이(시안 380 · 휴대폰 300 근처)", async ({ page }) => {
    await page.goto("/calc");
    test.skip(!(await ready(page)), "수입물가 자료 없음");
    const chart = chartOf(page);
    await scrollTo(page, chart);
    await page.waitForTimeout(5500);
    await expectInsideViewport(page, chart, "그래프");
    await expectTextsInside(chart);
    const bubbles = chart.locator('[data-testid="chart-end-bubble"] rect'); // 상자만(이어주는 줄 제외)
    const a = (await bubbles.nth(0).boundingBox())!;
    const b = (await bubbles.nth(1).boundingBox())!;
    expect(a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height, "말풍선 겹침").toBe(false);
    const h = (await chart.boundingBox())!.height;
    expect(h, "그래프 높이").toBeGreaterThanOrEqual(isPhone(page) ? 260 : 360);
    expect(h, "그래프 높이").toBeLessThanOrEqual(isPhone(page) ? 340 : 460);
  });

  test("화면에 들어오기 전엔 시작 안 함(idle · 0) → 들어오면 재생 → 끝나면 done", async ({ page }) => {
    await page.goto("/calc");
    test.skip(!(await ready(page)), "수입물가 자료 없음");
    const chart = chartOf(page);
    await scrollJustBelow(page, chart);
    await page.waitForTimeout(1500);
    await expect(chart).toHaveAttribute("data-state", "idle");
    expect(await reveal(chart.locator('[data-testid="chart-line"]').first())).toBe(0);
    expect(await reveal(chart.locator('[data-testid="chart-end-bubble"]').first())).toBe(0);
    await scrollTo(page, chart);
    await expect(chart).toHaveAttribute("data-state", "done", { timeout: 8000 });
  });

  test("순서 — 눈금 → 선 왼쪽부터(수입물가 먼저 · 원/달러 뒤) → 색 면 → 끝 점 → 말풍선 → 숫자 카운트업", async ({ page }) => {
    await page.goto("/calc");
    test.skip(!(await ready(page)), "수입물가 자료 없음");
    const chart = chartOf(page);
    await scrollJustBelow(page, chart);
    await page.waitForTimeout(500);
    const sel = {
      grid: '[data-testid="chart-grid"]',
      priceLine: '[data-testid="chart-series"][data-series="price"] [data-testid="chart-line"]',
      fxLine: '[data-testid="chart-series"][data-series="fx"] [data-testid="chart-line"]',
      priceArea: '[data-testid="chart-series"][data-series="price"] [data-testid="chart-area"]',
      dot: '[data-testid="chart-end"][data-series="price"] [data-testid="chart-end-dot"]',
      bubble: '[data-testid="chart-end"][data-series="price"] [data-testid="chart-end-bubble"]',
      count: '[data-testid="chart-end"][data-series="price"] [data-testid="chart-end-value"]',
    };
    await startRecording(page, sel);
    await scrollTo(page, chart);
    await page.waitForTimeout(5500);
    const fr = await stopRecording(page);
    const at = Object.fromEntries(Object.keys(sel).map((k) => [k, firstAbove(fr, k)])) as Record<keyof typeof sel, number>;
    for (const [k, v] of Object.entries(at)) expect(v, `${k} 이(가) 끝내 안 나타남`).toBeDefined();
    expect(at.grid, "눈금이 선보다 먼저").toBeLessThan(at.priceLine);
    expect(at.priceLine, "첫 선이 둘째 선보다 먼저").toBeLessThan(at.fxLine);
    expect(at.priceArea, "면이 선 시작보다 뒤").toBeGreaterThan(at.priceLine);
    expect(at.priceLine, "선이 끝 점보다 먼저").toBeLessThan(at.dot);
    expect(at.dot, "끝 점이 말풍선보다 먼저").toBeLessThanOrEqual(at.bubble + 1);
    expect(at.bubble, "말풍선이 카운트업보다 먼저").toBeLessThanOrEqual(at.count + 1);
    const lineVals = fr.map((f) => f.v.priceLine).filter((v) => !Number.isNaN(v));
    expect(lineVals.some((v) => v > 0.2 && v < 0.8), "선이 서서히 그려짐").toBe(true);
    for (let i = 1; i < lineVals.length; i++) expect(lineVals[i]).toBeGreaterThanOrEqual(lineVals[i - 1] - 1e-6);
    expect(firstDone(fr, "priceArea") ?? 0, "면이 선보다 먼저 완성").toBeGreaterThanOrEqual(firstDone(fr, "priceLine") as number);
  });

  test("끝 숫자 둘은 카운트업 — 도중 값은 최종과 다르고 끝나면 같음", async ({ page }) => {
    await page.goto("/calc");
    test.skip(!(await ready(page)), "수입물가 자료 없음");
    const chart = chartOf(page);
    await scrollJustBelow(page, chart);
    const finals = await chart.locator('[data-testid="chart-end-value"]').evaluateAll((els) => els.map((e) => e.getAttribute("data-final")));
    await page.evaluate(() => {
      const w = window as unknown as { __txt: string[][] };
      const els = [...document.querySelectorAll('[data-testid="import-chart"] [data-testid="chart-end-value"]')];
      w.__txt = els.map(() => []);
      const tick = () => {
        els.forEach((el, i) => {
          const t = el.textContent ?? "";
          if (w.__txt[i][w.__txt[i].length - 1] !== t) w.__txt[i].push(t);
        });
        requestAnimationFrame(tick);
      };
      tick();
    });
    await scrollTo(page, chart);
    await page.waitForTimeout(5500);
    const all = await page.evaluate(() => (window as unknown as { __txt: string[][] }).__txt);
    expect(all.length).toBe(2);
    all.forEach((txts, i) => {
      expect(txts.length, `숫자 ${i + 1} 바뀐 횟수`).toBeGreaterThan(3);
      expect(txts[txts.length - 1].trim()).toBe(finals[i]?.trim());
      expect(txts.slice(0, -1).some((t) => t.trim() !== finals[i]?.trim())).toBe(true);
    });
  });

  test("한 번만 — 위로 올라갔다 다시 와도 다시 그리지 않음", async ({ page }) => {
    await page.goto("/calc");
    test.skip(!(await ready(page)), "수입물가 자료 없음");
    const chart = chartOf(page);
    await scrollTo(page, chart);
    await expect(chart).toHaveAttribute("data-state", "done", { timeout: 8000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await startRecording(page, { line: '[data-testid="chart-line"]', bubble: '[data-testid="chart-end-bubble"]', grid: '[data-testid="chart-grid"]' });
    await scrollTo(page, chart);
    await page.waitForTimeout(1500);
    const fr = await stopRecording(page);
    for (const f of fr) for (const [k, v] of Object.entries(f.v)) expect(v, `${k} 가 다시 숨음`).toBeGreaterThanOrEqual(0.999);
  });

  test("움직임 줄이기 — 처음부터 최종 모양", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/calc");
    test.skip(!(await ready(page)), "수입물가 자료 없음");
    const chart = chartOf(page);
    await startRecording(page, { grid: '[data-testid="chart-grid"]', line: '[data-testid="chart-line"]', bubble: '[data-testid="chart-end-bubble"]' });
    await scrollTo(page, chart);
    await page.waitForTimeout(800);
    const fr = await stopRecording(page);
    for (const f of fr) for (const [k, v] of Object.entries(f.v)) expect(v, `${k} 가 처음부터 1 이 아님`).toBeGreaterThanOrEqual(0.999);
    await expect(chart).toHaveAttribute("data-state", "done");
    for (const id of ["price", "fx"]) expect((await endValue(chart, id).textContent())?.trim()).toBe((await endValue(chart, id).getAttribute("data-final"))?.trim());
  });

  test("자바스크립트를 꺼도 최종 모양이 보임", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/calc");
    if (!(await ready(page))) {
      await ctx.close();
      test.skip(true, "수입물가 자료 없음");
    }
    const chart = chartOf(page);
    expect(await reveal(chart.locator('[data-testid="chart-line"]').first())).toBe(1);
    for (const id of ["price", "fx"]) expect((await endValue(chart, id).textContent())?.trim()).toBe((await endValue(chart, id).getAttribute("data-final"))?.trim());
    await ctx.close();
  });

  test("옛 칸 정리 — 선 끝 글자 칸(import-end-label)은 말풍선으로 대체 · 숫자 카드 두 장 그대로", async ({ page }) => {
    await page.goto("/calc");
    test.skip(!(await ready(page)), "수입물가 자료 없음");
    await expect(page.locator('[data-testid="import-end-label"]')).toHaveCount(0);
    await expect(tid(page, "import-kpi")).toHaveCount(2);
  });
});

// 작업 0219 그래프 2D(시안 F) — 통화 상세 '1년 흐름' 그래프 e2e · 테스트 먼저
//   기준 캡처: .tmp/redesign-1118/F/shots/currency-1280.png · currency-390.png
//   그래프 DOM 계약은 e2e/chart-helpers.ts 맨 위 주석(0216 공통 부품) + 기준선: [data-testid="chart-ref"] (점선 · 글 "1년 평균 1,447.1원" — 기간 이름 + 평균)
//   선 하나: rate(매매기준율 · 면 있음 · 최고(빨강) · 최저(남색) 점) · 끝 "오늘" 큰 말풍선 = 마지막 날 실제 값 · 평균 점선 꼬리표
//   배치는 그대로: 왼쪽 큰 제목 · 오른쪽 기간 알약 묶음 · 가로 전체 그래프 (year-flow > period-chart)
import { type Page, expect, test } from "@playwright/test";
import { expectInsideViewport, expectLineChartFinal, expectTextsInside, firstAbove, firstDone, reveal, scrollJustBelow, scrollTo, startRecording, stopRecording, tid } from "./chart-helpers";

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const chartOf = (page: Page) => tid(page, "year-flow").locator('[data-testid="line-chart"]');
const endValue = (chart: ReturnType<typeof chartOf>) => chart.locator('[data-testid="chart-end"][data-series="rate"] [data-testid="chart-end-value"]');
/** 그래프의 읽기용 글(aria-label) 맨 끝 "마지막 2026-11-18 1,338.8원" 에서 값 글 */
const lastValue = async (chart: ReturnType<typeof chartOf>) => {
  const label = (await chart.getAttribute("aria-label")) ?? "";
  const m = label.match(/마지막 \d{4}-\d{2}-\d{2} (.+)$/);
  if (!m) throw new Error(`aria-label 에 마지막 값이 없음: ${label}`);
  return m[1].trim();
};

test.describe("통화 상세 1년 흐름 — 풍성한 2D (작업 0219 · 시안 F)", () => {
  test("선 1개 · 그라데이션 면 · 최고/최저 점 · 평균 점선 꼬리표 · 끝 '오늘' 말풍선 — 끝나면 최종 모양, 말풍선 숫자 = 마지막 날 실제 값", async ({ page }) => {
    await page.goto("/currencies/USD");
    const chart = chartOf(page);
    await expect(chart).toHaveCount(1);
    await scrollTo(page, chart);
    await page.waitForTimeout(5500);
    await expectLineChartFinal(page, chart, { series: ["rate"], areas: ["rate"], marks: true, ends: { rate: await lastValue(chart) } });
    await expect(chart.locator('[data-testid="chart-mark"][data-kind="max"]')).toHaveText(/^최고 [\d,]+(\.\d+)?원$/);
    await expect(chart.locator('[data-testid="chart-mark"][data-kind="min"]')).toHaveText(/^최저 [\d,]+(\.\d+)?원$/);
    await expect(chart.locator('[data-testid="chart-ref"]')).toHaveText(/평균 [\d,]+(\.\d+)?원/);
    await expect(chart.locator('[data-testid="chart-end"][data-series="rate"]')).toContainText("오늘");
    await expect(chart.locator('[data-testid="chart-axis"]')).toContainText(/20\d\d-\d\d/); // 날짜 눈금
    await expect(chart.locator('[data-testid="chart-axis"]')).toContainText(/1,\d{3}/); // 값 눈금(원)
  });

  test("평균 점선은 최저 ~ 최고 사이 · 최고 점이 선에서 가장 높고 최저 점이 가장 낮음 (위치 관계)", async ({ page }) => {
    await page.goto("/currencies/USD");
    const chart = chartOf(page);
    await scrollTo(page, chart);
    await page.waitForTimeout(5500);
    const y = async (loc: ReturnType<typeof chart.locator>) => {
      const b = await loc.boundingBox();
      if (!b) throw new Error("화면에 없음");
      return b.y + b.height / 2;
    };
    const max = chart.locator('[data-testid="chart-mark"][data-kind="max"]');
    const min = chart.locator('[data-testid="chart-mark"][data-kind="min"]');
    const ref = chart.locator('[data-testid="chart-ref"]');
    const [ym, yn, yr] = [await y(max), await y(min), await y(ref)];
    expect(ym, "최고 꼬리표가 최저보다 위").toBeLessThan(yn);
    expect(yr, "평균 점선이 최고보다 아래").toBeGreaterThan(ym);
    expect(yr, "평균 점선이 최저보다 위").toBeLessThan(yn + 40);
  });

  test("그래프는 화면 안 · 글이 svg 밖으로 안 나감 · 가로 넘침 0 · 꼬리표 · 말풍선이 서로 안 겹침 · 높이가 납작하지 않음", async ({ page }) => {
    await page.goto("/currencies/USD");
    const chart = chartOf(page);
    await scrollTo(page, chart);
    await page.waitForTimeout(5500);
    await expectInsideViewport(page, chart, "그래프");
    await expectTextsInside(chart);
    const parts = chart.locator('[data-testid="chart-mark"], [data-testid="chart-end-bubble"]');
    const boxes: { x: number; y: number; width: number; height: number }[] = [];
    for (let i = 0; i < (await parts.count()); i++) {
      const b = await parts.nth(i).boundingBox();
      if (b) boxes.push(b);
    }
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        expect(a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height, `꼬리표 · 말풍선 ${i + 1} · ${j + 1} 겹침`).toBe(false);
      }
    expect((await chart.boundingBox())!.height, "그래프 높이").toBeGreaterThanOrEqual(isPhone(page) ? 240 : 380);
  });

  test("화면에 들어오기 전엔 시작 안 함(idle · 0) → 들어오면 재생 → 끝나면 done", async ({ page }) => {
    await page.goto("/currencies/USD");
    const chart = chartOf(page);
    await scrollJustBelow(page, chart);
    await page.waitForTimeout(1500);
    await expect(chart).toHaveAttribute("data-state", "idle");
    expect(await reveal(chart.locator('[data-testid="chart-line"]'))).toBe(0);
    expect(await reveal(chart.locator('[data-testid="chart-end-bubble"]'))).toBe(0);
    await scrollTo(page, chart);
    await expect(chart).toHaveAttribute("data-state", "done", { timeout: 8000 });
  });

  test("순서 — 눈금 → 선 왼쪽부터 → 최고/최저 점 → 색 면 → 끝 점 → 말풍선 → 숫자 카운트업", async ({ page }) => {
    await page.goto("/currencies/USD");
    const chart = chartOf(page);
    await scrollJustBelow(page, chart);
    await page.waitForTimeout(500);
    const sel = {
      grid: '[data-testid="chart-grid"]',
      line: '[data-testid="chart-line"]',
      mark: '[data-testid="chart-mark"][data-kind="max"]',
      area: '[data-testid="chart-area"]',
      dot: '[data-testid="chart-end-dot"]',
      bubble: '[data-testid="chart-end-bubble"]',
      count: '[data-testid="chart-end-value"]',
    };
    await startRecording(page, sel);
    await scrollTo(page, chart);
    await page.waitForTimeout(5500);
    const fr = await stopRecording(page);
    const at = Object.fromEntries(Object.keys(sel).map((k) => [k, firstAbove(fr, k)])) as Record<keyof typeof sel, number>;
    for (const [k, v] of Object.entries(at)) expect(v, `${k} 이(가) 끝내 안 나타남`).toBeDefined();
    expect(at.grid, "눈금이 선보다 먼저").toBeLessThan(at.line);
    expect(at.line, "선이 점보다 먼저").toBeLessThanOrEqual(at.mark);
    expect(at.mark, "점이 끝 점보다 먼저").toBeLessThan(at.dot);
    expect(at.area, "면이 선 시작보다 뒤").toBeGreaterThan(at.line);
    expect(at.dot, "끝 점이 말풍선보다 먼저").toBeLessThanOrEqual(at.bubble + 1);
    expect(at.bubble, "말풍선이 카운트업보다 먼저").toBeLessThanOrEqual(at.count + 1);
    const lineVals = fr.map((f) => f.v.line).filter((v) => !Number.isNaN(v));
    expect(lineVals.some((v) => v > 0.2 && v < 0.8), "선이 서서히 그려짐").toBe(true);
    for (let i = 1; i < lineVals.length; i++) expect(lineVals[i]).toBeGreaterThanOrEqual(lineVals[i - 1] - 1e-6);
    expect(firstDone(fr, "area") ?? 0, "면이 선보다 먼저 완성").toBeGreaterThanOrEqual(firstDone(fr, "line") as number);
  });

  test("끝 '오늘' 숫자는 카운트업 — 도중 값은 최종과 다르고 끝나면 같음", async ({ page }) => {
    await page.goto("/currencies/USD");
    const chart = chartOf(page);
    await scrollJustBelow(page, chart);
    const final = (await endValue(chart).getAttribute("data-final"))!;
    await page.evaluate(() => {
      const w = window as unknown as { __txt: string[] };
      w.__txt = [];
      const el = document.querySelector('[data-testid="chart-end-value"]') as Element;
      const tick = () => {
        const t = el.textContent ?? "";
        if (w.__txt[w.__txt.length - 1] !== t) w.__txt.push(t);
        requestAnimationFrame(tick);
      };
      tick();
    });
    await scrollTo(page, chart);
    await page.waitForTimeout(5500);
    const txts = await page.evaluate(() => (window as unknown as { __txt: string[] }).__txt);
    expect(txts.length, "숫자가 바뀐 횟수").toBeGreaterThan(3);
    expect(txts[txts.length - 1].trim()).toBe(final.trim());
    expect(txts.slice(0, -1).some((t) => t.trim() !== final.trim())).toBe(true);
  });

  test("한 번만 — 위로 올라갔다 다시 와도 다시 그리지 않음", async ({ page }) => {
    await page.goto("/currencies/USD");
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

  test("기간 버튼 1개월 · 3개월 · 1년 — 눌린 기간의 그래프(읽기용 글 · 평균 꼬리표 이름) · 끝 값 '오늘'은 같음 · 바뀐 그래프도 끝나면 최종 모양", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    const flow = tid(page, "year-flow");
    const group = flow.getByRole("group", { name: "기간" });
    const chart = chartOf(page);
    const today = await lastValue(chart);
    for (const label of ["1개월", "3개월", "1년"]) {
      await group.getByRole("button", { name: label }).click();
      await expect(group.getByRole("button", { name: label })).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByRole("img", { name: new RegExp(`^${label} 흐름 — `) })).toBeVisible();
      await expect(chart.locator('[data-testid="chart-ref"]')).toContainText(`${label} 평균`);
      await expect(chart).toHaveAttribute("data-state", "done");
      expect(await lastValue(chart), `${label}: 마지막 값`).toBe(today);
      expect((await endValue(chart).textContent())?.trim(), `${label}: 끝 숫자`).toBe(today);
      await expect(chart.locator('[data-testid="chart-mark"]')).toHaveCount(2);
    }
  });

  test("움직임 줄이기 — 처음부터 최종 모양 (done · 모든 부분 1 · 숫자 최종 값)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    const chart = chartOf(page);
    await startRecording(page, { grid: '[data-testid="chart-grid"]', line: '[data-testid="chart-line"]', bubble: '[data-testid="chart-end-bubble"]' });
    await scrollTo(page, chart);
    await page.waitForTimeout(800);
    const fr = await stopRecording(page);
    for (const f of fr) for (const [k, v] of Object.entries(f.v)) expect(v, `${k} 가 처음부터 1 이 아님`).toBeGreaterThanOrEqual(0.999);
    await expect(chart).toHaveAttribute("data-state", "done");
    expect((await endValue(chart).textContent())?.trim()).toBe((await endValue(chart).getAttribute("data-final"))?.trim());
  });

  test("자바스크립트를 꺼도 최종 모양이 보임", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/currencies/USD");
    const chart = chartOf(page);
    await expect(chart).toHaveCount(1);
    expect(await reveal(chart.locator('[data-testid="chart-line"]'))).toBe(1);
    expect((await endValue(chart).textContent())?.trim()).toBe((await endValue(chart).getAttribute("data-final"))?.trim());
    await ctx.close();
  });
});

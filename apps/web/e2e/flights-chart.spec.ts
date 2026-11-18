// 작업 0218 그래프 2D(시안 F) — /flights 그래프 e2e · 테스트 먼저
//   기준 캡처: .tmp/redesign-1118/F/shots/flights-1280.png · flights-390.png · flights-mid-900ms-1280.png · flights-mid-1900ms-1280.png
//   그래프 DOM 계약은 e2e/chart-helpers.ts 맨 위 주석 (0216 공통 부품)
//   선 셋: air(국제항공료 · 면 있음 · 최고/최저 점) · tour(해외단체여행비 · 면 있음) · fx(원/달러 · 점선 · 면 없음) — 각자 끝 말풍선
//   배치는 그대로(탑승권 안 왼쪽 그래프 · 오른쪽 숫자 칸 · 범례) — 그래프 그림만 바뀜
import { type Page, expect, test } from "@playwright/test";
import { expectInsideViewport, expectLineChartFinal, expectTextsInside, firstAbove, firstDone, reveal, scrollJustBelow, scrollTo, startRecording, stopRecording, tid } from "./chart-helpers";

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const ready = async (page: Page) => !(((await page.getByRole("heading", { level: 1 }).textContent()) ?? "").includes("준비 중"));
const chartOf = (page: Page) => tid(page, "travel-graph").locator('[data-testid="line-chart"]');
/** 범례 칩 글 "국제항공료 146.8" · "원/달러 월평균 1,341원" 에서 끝 값(마지막 숫자 글) */
const legendValue = async (page: Page, name: string) => {
  const t = (await tid(page, "travel-legend").getByText(name).first().textContent()) ?? "";
  return t.replace(name, "").trim();
};

test.describe("/flights 그래프 — 풍성한 2D (작업 0218 · 시안 F)", () => {
  test("선 3개 · 그라데이션 면(항공료 · 단체여행비) · 최고/최저 점 · 끝 말풍선 — 끝나면 최종 모양, 말풍선 숫자 = 범례의 실제 값", async ({ page }) => {
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    const chart = chartOf(page);
    await scrollTo(page, chart);
    await page.waitForTimeout(5500);
    const hasTour = (await chart.locator('[data-testid="chart-series"][data-series="tour"]').count()) > 0;
    const series = hasTour ? ["air", "tour", "fx"] : ["air", "fx"];
    await expectLineChartFinal(page, chart, {
      series,
      areas: hasTour ? ["air", "tour"] : ["air"],
      marks: true,
      ends: { air: await legendValue(page, "국제항공료"), fx: await legendValue(page, "원/달러 월평균") },
    });
    // 원/달러(점선)는 면이 없음
    await expect(chart.locator('[data-testid="chart-series"][data-series="fx"] [data-testid="chart-area"]')).toHaveCount(0);
    // 최고 · 최저 점은 항공료 선 위 · 꼬리표 글에 실제 지수
    const max = chart.locator('[data-testid="chart-mark"][data-kind="max"]');
    const min = chart.locator('[data-testid="chart-mark"][data-kind="min"]');
    await expect(max).toHaveCount(1);
    await expect(min).toHaveCount(1);
    await expect(max).toContainText(/최고/);
    await expect(min).toContainText(/최저/);
    await expect(max).toContainText(/\d{2,3}\.\d/);
    await expect(min).toContainText(/\d{2,3}\.\d/);
    // 눈금 값 · 날짜(YYYY-MM)가 글로 있음
    await expect(chart.locator('[data-testid="chart-axis"]')).toContainText(isPhone(page) ? /\d\d\.\d\d/ : /20\d\d-\d\d/); // 날짜 눈금 (휴대폰은 '24.07' 짧은 글)
  });

  test("그래프는 탑승권 안 · 화면 안 · 글이 svg 밖으로 안 나감 · 가로 넘침 0 · 말풍선끼리 안 겹침", async ({ page }) => {
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    const chart = chartOf(page);
    await scrollTo(page, chart);
    await page.waitForTimeout(5500);
    await expectInsideViewport(page, chart, "그래프");
    await expectTextsInside(chart);
    const ticket = (await tid(page, "flights-ticket").boundingBox())!;
    const g = (await chart.boundingBox())!;
    expect(g.x).toBeGreaterThanOrEqual(ticket.x - 1);
    expect(g.x + g.width).toBeLessThanOrEqual(ticket.x + ticket.width + 1);
    // 말풍선 상자(rect) · 최고/최저 꼬리표 알약(rect)끼리 겹치지 않음 — 이어주는 줄 · 점은 제외
    const bubbles = chart.locator('[data-testid="chart-end-bubble"] rect, [data-testid="chart-mark"] rect');
    const boxes: { x: number; y: number; width: number; height: number }[] = [];
    for (let i = 0; i < (await bubbles.count()); i++) boxes.push((await bubbles.nth(i).boundingBox())!);
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const hit = a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
        expect(hit, `말풍선 ${i + 1} · ${j + 1} 겹침`).toBe(false);
      }
    // 그래프 높이 — 시안(1280: 약 470px · 390: 약 300px) 이상으로 풍성하게 (너무 납작하지 않음)
    expect(g.height, "그래프 높이").toBeGreaterThanOrEqual(isPhone(page) ? 260 : 360);
  });

  test("화면에 들어오기 전엔 시작 안 함(idle · 모든 부분 0) → 들어오면 재생 → 끝나면 done", async ({ page }) => {
    // 그래프가 첫 화면에 걸쳐 있는 노트북 높이에서는 처음부터 재생되므로, 그래프가 확실히 아래에 있도록 낮은 창(300px)에서 잼
    await page.setViewportSize({ width: page.viewportSize()?.width ?? 1280, height: 300 });
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    const chart = chartOf(page);
    await scrollJustBelow(page, chart);
    await page.waitForTimeout(1500);
    await expect(chart).toHaveAttribute("data-state", "idle");
    expect(await reveal(chart.locator('[data-testid="chart-line"]')), "선이 이미 그려짐").toBe(0);
    expect(await reveal(chart.locator('[data-testid="chart-end-bubble"]')), "말풍선이 이미 보임").toBe(0);
    expect(await reveal(chart.locator('[data-testid="chart-grid"]')), "눈금이 이미 보임").toBe(0);
    await scrollTo(page, chart);
    await expect(chart).toHaveAttribute("data-state", /playing|done/);
    await expect(chart).toHaveAttribute("data-state", "done", { timeout: 8000 });
  });

  test("순서 — 눈금 → 선 왼쪽부터 → 최고/최저 점 → 색 면 → 끝 점 → 말풍선 → 숫자 카운트업", async ({ page }) => {
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    const chart = chartOf(page);
    await scrollJustBelow(page, chart);
    await page.waitForTimeout(500);
    const sel = {
      grid: '[data-testid="chart-grid"]',
      line: '[data-testid="chart-series"][data-series="air"] [data-testid="chart-line"]',
      mark: '[data-testid="chart-mark"][data-kind="max"]',
      area: '[data-testid="chart-series"][data-series="air"] [data-testid="chart-area"]',
      dot: '[data-testid="chart-end"][data-series="air"] [data-testid="chart-end-dot"]',
      bubble: '[data-testid="chart-end"][data-series="air"] [data-testid="chart-end-bubble"]',
      count: '[data-testid="chart-end"][data-series="air"] [data-testid="chart-end-value"]',
    };
    await startRecording(page, sel);
    await scrollTo(page, chart);
    await page.waitForTimeout(5500);
    const fr = await stopRecording(page);
    const t = Object.fromEntries(Object.keys(sel).map((k) => [k, firstAbove(fr, k)])) as Record<keyof typeof sel, number | undefined>;
    for (const [k, v] of Object.entries(t)) expect(v, `${k} 이(가) 끝내 안 나타남`).toBeDefined();
    const at = t as Record<keyof typeof sel, number>;
    expect(at.grid, "눈금이 선보다 먼저").toBeLessThan(at.line);
    expect(at.line, "선이 점보다 먼저").toBeLessThanOrEqual(at.mark);
    expect(at.mark, "점이 끝 점보다 먼저").toBeLessThan(at.dot);
    expect(at.area, "면이 선이 다 그려진 뒤가 아님(선 시작보다는 뒤)").toBeGreaterThan(at.line);
    expect(at.dot, "끝 점이 말풍선보다 먼저(같거나)").toBeLessThanOrEqual(at.bubble + 1);
    expect(at.bubble, "말풍선이 카운트업보다 먼저(같거나)").toBeLessThanOrEqual(at.count + 1);
    // 선은 서서히(중간 진행 프레임이 있음) · 왼쪽부터(진행값이 단조 증가)
    const lineVals = fr.map((f) => f.v.line).filter((v) => !Number.isNaN(v));
    expect(lineVals.some((v) => v > 0.2 && v < 0.8), "선이 서서히 그려짐").toBe(true);
    for (let i = 1; i < lineVals.length; i++) expect(lineVals[i], "선 진행이 뒤로 감").toBeGreaterThanOrEqual(lineVals[i - 1] - 1e-6);
    // 면은 선이 거의 다 그려진 뒤에 차오름
    const doneLine = firstDone(fr, "line");
    expect(doneLine).toBeDefined();
    expect(firstDone(fr, "area") ?? 0, "면이 선보다 먼저 완성").toBeGreaterThanOrEqual(doneLine as number);
  });

  test("끝 말풍선 숫자는 0 에서 시작하지 않고 카운트업 — 도중 값은 최종 값과 다르고 끝나면 같음", async ({ page }) => {
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    const chart = chartOf(page);
    await scrollJustBelow(page, chart);
    const val = chart.locator('[data-testid="chart-end"][data-series="air"] [data-testid="chart-end-value"]');
    const final = (await val.getAttribute("data-final"))!;
    await page.evaluate(() => {
      const w = window as unknown as { __txt: string[] };
      w.__txt = [];
      const el = document.querySelector('[data-testid="chart-end"][data-series="air"] [data-testid="chart-end-value"]') as Element;
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
    expect(txts.slice(0, -1).some((t) => t.trim() !== final.trim()), "도중 값이 최종과 다름").toBe(true);
  });

  test("한 번만 — 위로 올라갔다 다시 와도 다시 그리지 않음(done 유지 · 모든 부분 1)", async ({ page }) => {
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    const chart = chartOf(page);
    await scrollTo(page, chart);
    await expect(chart).toHaveAttribute("data-state", "done", { timeout: 8000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await startRecording(page, { line: '[data-testid="chart-line"]', bubble: '[data-testid="chart-end-bubble"]', grid: '[data-testid="chart-grid"]' });
    await scrollTo(page, chart);
    await page.waitForTimeout(1500);
    const fr = await stopRecording(page);
    for (const f of fr) for (const [k, v] of Object.entries(f.v)) expect(v, `${k} 가 다시 숨음 (t=${f.t.toFixed(0)}ms)`).toBeGreaterThanOrEqual(0.999);
    await expect(chart).toHaveAttribute("data-state", "done");
  });

  test("움직임 줄이기 — 처음부터 최종 모양 (done · 모든 부분 1 · 숫자 최종 값)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    const chart = chartOf(page);
    await startRecording(page, { grid: '[data-testid="chart-grid"]', line: '[data-testid="chart-line"]', bubble: '[data-testid="chart-end-bubble"]' });
    await scrollTo(page, chart);
    await page.waitForTimeout(800);
    const fr = await stopRecording(page);
    for (const f of fr) for (const [k, v] of Object.entries(f.v)) expect(v, `${k} 가 처음부터 1 이 아님 (t=${f.t.toFixed(0)}ms)`).toBeGreaterThanOrEqual(0.999);
    await expect(chart).toHaveAttribute("data-state", "done");
    const val = chart.locator('[data-testid="chart-end"][data-series="air"] [data-testid="chart-end-value"]');
    expect((await val.textContent())?.trim()).toBe((await val.getAttribute("data-final"))?.trim());
  });

  test("자바스크립트를 꺼도 최종 모양이 보임(서버가 그린 SVG · data-reveal 1 · 끝 값 글)", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/flights");
    if (!(await ready(page))) {
      await ctx.close();
      test.skip(true, "자료 없음");
    }
    const chart = chartOf(page);
    await expect(chart).toHaveCount(1);
    expect(await reveal(chart.locator('[data-testid="chart-line"]'))).toBe(1);
    const val = chart.locator('[data-testid="chart-end"][data-series="air"] [data-testid="chart-end-value"]');
    expect((await val.textContent())?.trim()).toBe((await val.getAttribute("data-final"))?.trim());
    await ctx.close();
  });

  test("범례 · 기간 안내 그대로 — 범례 칩 값이 말풍선과 같음 · '지수 · 2020년 = 100' 안내 유지", async ({ page }) => {
    await page.goto("/flights");
    test.skip(!(await ready(page)), "자료 없음");
    await expect(tid(page, "travel-legend")).toContainText("국제항공료");
    await expect(page.getByText("지수 · 2020년 = 100", { exact: false }).first()).toBeVisible();
    const air = chartOf(page).locator('[data-testid="chart-end"][data-series="air"] [data-testid="chart-end-value"]');
    expect(await legendValue(page, "국제항공료")).toBe((await air.getAttribute("data-final"))?.trim());
  });
});

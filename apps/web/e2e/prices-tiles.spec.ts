// 작업 0285(5번) — 정거장 카드 물가 글자판: 자릿수만큼만 칸을 그림(두 자리 값은 앞 빈 칸 없음) · 두 자리 ↔ 세 자리 정거장으로 옮겨도
//   글자판 칸 수가 바뀌며 굴러가는 움직임이 끝까지 되고(최종 칸 수 · 글자 = 값) · 옆 칸(비교 글) · 카드 줄이 밀리지 않음(사용자 조건 "값이 바뀌어도 밀리지 않는다")
//   넓은 화면(1280) 정거장 카드 · 표시: route-stop(단추) · route-card-value(글자판 · 칸 span 이 자식) · route-card-pct · route-card-budget
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);

async function openWide(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/prices");
  await page.waitForLoadState("networkidle");
  await expect.poll(() => tid(page, "route-stop").count(), { timeout: 8000 }).toBeGreaterThan(2);
  await expect.poll(() => tid(page, "route-stop").first().evaluate((el) => Object.keys(el).some((k) => k.startsWith("__reactFiber$"))), { message: "하이드레이션" }).toBe(true);
}
const stopsInfo = (page: Page) => tid(page, "route-stop").evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-value"))));
const geom = (page: Page) =>
  page.evaluate(() => {
    const v = document.querySelector('[data-testid="route-card-value"]') as HTMLElement;
    const pct = document.querySelector('[data-testid="route-card-pct"]') as HTMLElement;
    const budget = document.querySelector('[data-testid="route-card-budget"]') as HTMLElement | null;
    const rv = v.getBoundingClientRect(), rp = pct.getBoundingClientRect(), rb = budget?.getBoundingClientRect();
    return { tiles: v.children.length, text: Array.from(v.children).map((c) => (c.textContent ?? "").trim()).join(""), label: v.getAttribute("aria-label"), valueTop: Math.round(rv.top * 10) / 10, valueH: Math.round(rv.height * 10) / 10, pctLeft: Math.round(rp.left * 10) / 10, budgetLeft: rb ? Math.round(rb.left * 10) / 10 : null, budgetTop: rb ? Math.round(rb.top * 10) / 10 : null };
  });

test.describe("물가 글자판 칸 수 변화 (작업 0285 · 5번)", () => {
  test("글자판은 자릿수만큼만 칸 — 두 자리 값은 칸 둘(앞 빈 칸 없음) · 세 자리 값은 칸 셋 · 칸 글자를 이으면 값", async ({ page }) => {
    await openWide(page);
    const values = await stopsInfo(page);
    for (const k of [0, values.length - 1]) {
      await tid(page, "route-stop").nth(k).click();
      await expect.poll(async () => (await geom(page)).text, { timeout: 8000, message: `${k + 1}번째 값 글자` }).toBe(String(values[k]));
      const g = await geom(page);
      expect(g.tiles, `칸 수 = 자릿수(${values[k]})`).toBe(String(values[k]).length);
      expect(g.text, "앞 빈 칸 없음").toBe(String(values[k]));
    }
  });

  test("두 자리 ↔ 세 자리 정거장으로 옮겨도 — 칸이 늘고 줄며 끝까지 굴러가고 옆 칸 · 값 줄이 밀리지 않음", async ({ page }) => {
    await openWide(page);
    const values = await stopsInfo(page);
    const two = values.findIndex((v) => v < 100), three = values.findIndex((v) => v >= 100);
    test.skip(two < 0 || three < 0, "두 자리 · 세 자리 값이 모두 있어야 함");
    await tid(page, "route-stop").nth(two).click();
    await expect.poll(async () => (await geom(page)).text, { timeout: 8000 }).toBe(String(values[two]));
    const base = await geom(page);
    for (const [from, to] of [[two, three], [three, two]] as const) {
      await tid(page, "route-stop").nth(to).click();
      // 굴러가는 동안(1.5초) 계속 잼: 옆 칸(비교 글)이 안 밀림 · 값 줄 높이 · 위치 그대로 · 칸 수는 두 자리와 세 자리 사이
      const samples: Awaited<ReturnType<typeof geom>>[] = [];
      for (let i = 0; i < 15; i++) {
        samples.push(await geom(page));
        await page.waitForTimeout(100);
      }
      for (const [i, g] of samples.entries()) {
        expect(g.pctLeft, `${from}→${to} ${i * 100}ms 비교 글 가로 위치`).toBeCloseTo(base.pctLeft, 0);
        expect(Math.abs(g.valueH - base.valueH), `${i * 100}ms 값 줄 높이`).toBeLessThanOrEqual(1);
        expect(Math.abs(g.valueTop - base.valueTop), `${i * 100}ms 값 줄 위치`).toBeLessThanOrEqual(1);
        expect(g.tiles, `${i * 100}ms 칸 수`).toBeGreaterThanOrEqual(2);
        expect(g.tiles).toBeLessThanOrEqual(3);
      }
      await expect.poll(async () => (await geom(page)).text, { timeout: 8000, message: "굴러간 뒤 최종 글자 = 값" }).toBe(String(values[to]));
      const end = await geom(page);
      expect(end.tiles, "최종 칸 수 = 자릿수").toBe(String(values[to]).length);
      expect(end.label).toBe(`물가 ${values[to]} (한국 100)`);
      expect(end.pctLeft, "최종 비교 글 위치 그대로").toBeCloseTo(base.pctLeft, 0);
      expect(Math.abs(end.valueH - base.valueH), "최종 값 줄 높이").toBeLessThanOrEqual(1);
    }
  });

  test("연속으로 빠르게 두 번 눌러도 — 남는 칸 없이 마지막 값의 칸 수 · 글자로 정리됨", async ({ page }) => {
    await openWide(page);
    const values = await stopsInfo(page);
    const two = values.findIndex((v) => v < 100), three = values.findIndex((v) => v >= 100);
    test.skip(two < 0 || three < 0, "두 자리 · 세 자리 값이 모두 있어야 함");
    await tid(page, "route-stop").nth(three).click();
    await tid(page, "route-stop").nth(two).click(); // 굴러가는 도중에 다시 누름
    await expect.poll(async () => { const g = await geom(page); return `${g.tiles}:${g.text}`; }, { timeout: 8000, message: "마지막 값으로 정리" }).toBe(`${String(values[two]).length}:${values[two]}`);
    await page.waitForTimeout(600);
    const g = await geom(page);
    expect(g.tiles, "남는 옛 칸 없음").toBe(String(values[two]).length);
  });
});

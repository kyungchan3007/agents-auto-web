// 작업 0283 — 여행 물가 "나라별 물가 노선" 휴대폰 세로 노선 (사용자 결정: 시안 64 "A안으로 해주고 접을수도 있게 하자")
//   휴대폰 폭(760 이하)에서만: 정거장을 세로로 한 줄씩(물가 낮은 나라 → 한국 → 높은 나라) · 옆으로 밀지 않고 일곱 정거장이 모두 보임 ·
//   줄을 누르면 그 줄 아래에 하루 예산이 펼쳐지고(하나만) 다시 누르면 접힘 · 처음에는 첫 정거장 펼침 · 키보드로도(button · aria-expanded) ·
//   줄 높이 44px 이상 · 비행기는 고른 줄로(접어도 마지막으로 고른 줄에 그대로) · 스크립트 없이도 줄 이름 · 값이 보임 · 가로 넘침 0
//   넓은 화면(760 넘음)은 가로 노선 그대로 · 폭은 테스트 안에서 정함(두 프로젝트에서 돎)
//   표시: route-list(세로 노선) · route-row-item(li) · route-row(줄 단추 · data-country · data-value · aria-expanded · aria-controls) · route-row-plane(비행기 · data-plane = 고른 줄 번호) · route-row-pct · route-row-budget(펼친 칸 안)
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const MOBILE = { width: 390, height: 844 };

async function open(page: Page, size = MOBILE) {
  await page.setViewportSize(size);
  await page.goto("/prices");
  await page.waitForLoadState("networkidle");
  return (await tid(page, "route-row").count()) > 0;
}
const hydrate = (page: Page) =>
  expect.poll(() => tid(page, "route-row").first().evaluate((el) => Object.keys(el).some((k) => k.startsWith("__reactFiber$"))), { message: "하이드레이션이 끝나기를 기다림" }).toBe(true);
const expandedFlags = (page: Page) => tid(page, "route-row").evaluateAll((els) => els.map((e) => e.getAttribute("aria-expanded") === "true"));
const visibleDetails = (page: Page) => tid(page, "route-row-budget").evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height > 0).length);

test.describe("여행 물가 휴대폰 세로 노선 (작업 0283)", () => {
  test("390 — 옆으로 밀지 않고 정거장 일곱 줄이 모두 보임 · 값은 물가 낮은 순 · 한국 100 한 줄 · 문서 가로 넘침 0", async ({ page }) => {
    test.skip(!(await open(page)), "물가 자료 없음");
    await tid(page, "route-list").scrollIntoViewIfNeeded();
    const rows = tid(page, "route-row");
    const n = await rows.count();
    expect(n, "정거장 줄 수(일곱 · 자료에 따라 다를 수 있어 3 이상)").toBeGreaterThanOrEqual(3);
    const info = await rows.evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { country: e.getAttribute("data-country"), value: Number(e.getAttribute("data-value")), left: r.left, right: r.right, name: (e.textContent ?? "").trim() }; }));
    // 옆으로 밀지 않고 모두 화면 안
    for (const r of info) { expect(r.left, `${r.name} 왼쪽`).toBeGreaterThanOrEqual(-1); expect(r.right, `${r.name} 오른쪽`).toBeLessThanOrEqual(MOBILE.width + 1); }
    expect(await tid(page, "route-list").evaluate((el) => el.scrollWidth <= el.clientWidth + 1), "세로 노선 안에서 가로로 밀 수 없음(밀 필요 없음)").toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "문서 가로 넘침").toBeLessThanOrEqual(0);
    // 물가 낮은 나라 → 한국 → 높은 나라: 값이 오름차순 · 한국(100)이 한 줄 · 이름이 보임
    const values = info.map((r) => r.value);
    expect(values, "값 오름차순").toEqual([...values].sort((a, b) => a - b));
    expect(info.filter((r) => r.country === "KR").map((r) => r.value)).toEqual([100]);
    for (const r of info) expect(r.name.length, "줄에 이름 · 값").toBeGreaterThan(2);
    await expect(tid(page, "route-row-item")).toHaveCount(n);
  });

  test("처음에는 첫 정거장이 펼쳐져 있음 · 하나만 · 한국이 아닌 첫 줄(가장 싼 나라)", async ({ page }) => {
    test.skip(!(await open(page)), "물가 자료 없음");
    await hydrate(page);
    const flags = await expandedFlags(page);
    expect(flags[0], "첫 줄 펼침").toBe(true);
    expect(flags.filter(Boolean).length, "펼친 줄은 하나").toBe(1);
    expect(await visibleDetails(page), "보이는 펼친 칸 하나").toBe(1);
    expect(await tid(page, "route-row").first().getAttribute("data-country")).not.toBe("KR");
    await expect(tid(page, "route-row-plane")).toHaveAttribute("data-plane", "0");
  });

  test("줄을 누르면 그 줄 아래에 펼침(하나만) · 하루 예산이 값 × 1000 · 다시 누르면 접힘(모두 접힌 상태도 됨)", async ({ page }) => {
    test.skip(!(await open(page)), "물가 자료 없음");
    await hydrate(page);
    const rows = tid(page, "route-row");
    const n = await rows.count();
    const k = Math.min(3, n - 1);
    await rows.nth(k).scrollIntoViewIfNeeded();
    await rows.nth(k).click();
    await expect(rows.nth(k)).toHaveAttribute("aria-expanded", "true");
    expect(await expandedFlags(page), "누른 줄만 펼침").toEqual(Array.from({ length: n }, (_, i) => i === k));
    const value = Number(await rows.nth(k).getAttribute("data-value"));
    const detail = tid(page, "route-row-budget");
    await expect.poll(() => visibleDetails(page), { message: "펼친 칸 하나가 보임" }).toBe(1);
    await expect(detail.filter({ visible: true })).toContainText(`약 ${(value * 1000).toLocaleString("ko-KR")}`);
    // 비교 글: 한국보다 N% 저렴합니다/비쌉니다(한국은 기준)
    const pct = tid(page, "route-row-pct").filter({ visible: true });
    await expect(pct).toHaveText(value === 100 ? /기준/ : value < 100 ? new RegExp(`${100 - value}%.*저렴합니다`) : new RegExp(`${value - 100}%.*비쌉니다`));
    // 다시 누르면 접힘
    await rows.nth(k).click();
    await expect(rows.nth(k)).toHaveAttribute("aria-expanded", "false");
    expect(await expandedFlags(page), "모두 접힘").toEqual(Array.from({ length: n }, () => false));
    await expect.poll(() => visibleDetails(page), { message: "펼친 칸이 없음" }).toBe(0);
    // 다른 줄을 누르면 그 줄만 다시 펼침
    await rows.nth(0).click();
    expect(await expandedFlags(page)).toEqual(Array.from({ length: n }, (_, i) => i === 0));
  });

  test("키보드로 펼치고 접음 — 줄이 button · aria-expanded · aria-controls · Enter · 스페이스", async ({ page }) => {
    test.skip(!(await open(page)), "물가 자료 없음");
    await hydrate(page);
    const rows = tid(page, "route-row");
    const second = rows.nth(1);
    expect(await second.evaluate((el) => el.tagName.toLowerCase()), "줄은 button").toBe("button");
    const target = await second.getAttribute("aria-controls");
    expect(target, "펼친 칸 연결").toBeTruthy();
    await second.focus();
    await page.keyboard.press("Enter");
    await expect(second).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(`#${target}`)).toBeVisible();
    await page.keyboard.press("Space");
    await expect(second).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(`#${target}`)).toBeHidden();
  });

  test("누르는 줄 높이 44px 이상(줄 전체가 단추)", async ({ page }) => {
    test.skip(!(await open(page)), "물가 자료 없음");
    const heights = await tid(page, "route-row").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    for (const [i, h] of heights.entries()) expect(h, `${i + 1}번째 줄 높이`).toBeGreaterThanOrEqual(44);
    const widths = await tid(page, "route-row").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(), p = (e.parentElement as HTMLElement).getBoundingClientRect(); return r.width / p.width; }));
    for (const w of widths) expect(w, "줄이 칸 폭을 채움").toBeGreaterThan(0.98);
  });

  test("비행기가 고른 줄의 세로 선 위로 — 누르면 그 줄로 · 접어도 마지막으로 고른 줄에 그대로 · 움직임 줄이기는 바로", async ({ page }) => {
    test.skip(!(await open(page)), "물가 자료 없음");
    await hydrate(page);
    const rows = tid(page, "route-row");
    const n = await rows.count();
    const plane = tid(page, "route-row-plane");
    /** 비행기 가운데 y 가 그 줄 단추의 위 · 아래 안(같은 문서 좌표)에 들어옴 */
    const onRow = (i: number) =>
      page.evaluate((idx) => {
        const row = document.querySelectorAll('[data-testid="route-row"]')[idx] as HTMLElement;
        const pl = document.querySelector('[data-testid="route-row-plane"]') as HTMLElement;
        const r = row.getBoundingClientRect(), p = pl.getBoundingClientRect();
        const cy = p.top + p.height / 2;
        return cy >= r.top - 2 && cy <= r.bottom + 2;
      }, i);
    await expect.poll(() => onRow(0), { message: "처음 비행기는 첫 줄", timeout: 5000 }).toBe(true);
    const k = Math.min(4, n - 1);
    await rows.nth(k).scrollIntoViewIfNeeded();
    await rows.nth(k).click();
    await expect(plane).toHaveAttribute("data-plane", String(k));
    await expect.poll(() => onRow(k), { message: `비행기가 ${k + 1}번째 줄로`, timeout: 5000 }).toBe(true);
    // 접어도 비행기는 그 줄에 그대로
    await rows.nth(k).click();
    await expect(rows.nth(k)).toHaveAttribute("aria-expanded", "false");
    await expect(plane).toHaveAttribute("data-plane", String(k));
    await expect.poll(() => onRow(k), { message: "접은 뒤에도 비행기는 그 줄", timeout: 5000 }).toBe(true);
    // 움직임 줄이기: 전환 없이 바로 이동
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await page.waitForLoadState("networkidle");
    await hydrate(page);
    const secs = await plane.evaluate((el) => getComputedStyle(el).transitionDuration.split(",").map((x) => parseFloat(x)));
    for (const d of secs) expect(d, "움직임 줄이기: 전환 시간(초)").toBeLessThanOrEqual(0.001);
    await rows.nth(k).scrollIntoViewIfNeeded();
    await rows.nth(k).click();
    await expect.poll(() => onRow(k), { message: "움직임 줄이기에서 바로 그 줄", timeout: 1500, intervals: [50] }).toBe(true);
  });

  test("가는 막대 — 줄마다 값에 비례(한국 100 자리 세로 선) · 설명 한 줄", async ({ page }) => {
    test.skip(!(await open(page)), "물가 자료 없음");
    await tid(page, "route-list").scrollIntoViewIfNeeded();
    await expect(tid(page, "route-list")).toContainText("가는 막대의 세로 선이 한국(100)입니다");
    const bars = await tid(page, "route-row-item").evaluateAll((els) =>
      els.map((li) => {
        const track = li.querySelector("div[aria-hidden].relative.mb-3, div.relative.mb-3") as HTMLElement | null;
        const fill = track?.querySelector("b") as HTMLElement | null;
        const value = Number(li.querySelector('[data-testid="route-row"]')?.getAttribute("data-value"));
        return track && fill ? { ratio: fill.getBoundingClientRect().width / track.getBoundingClientRect().width, value } : null;
      }),
    );
    for (const b of bars.filter((x): x is { ratio: number; value: number } => !!x)) expect(Math.abs(b.ratio - Math.min(1, b.value / 120)), `값 ${b.value} 막대 비율 ${b.ratio.toFixed(3)} (값 ÷ 120)`).toBeLessThanOrEqual(0.02);
    expect(bars.some((b) => b), "막대가 그려짐").toBe(true);
  });

  test("스크립트 없이도(JavaScript 끔) — 정거장 줄 이름 · 값이 모두 보임 · 첫 줄 펼침 · 가로 넘침 0", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: MOBILE });
    const page = await ctx.newPage();
    await page.goto("/prices");
    test.skip((await tid(page, "route-row").count()) === 0, "물가 자료 없음");
    const n = await tid(page, "route-row").count();
    expect(n).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < n; i++) await expect(tid(page, "route-row").nth(i), `${i + 1}번째 줄`).toBeVisible();
    const values = await tid(page, "route-row").evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-value"))));
    for (const v of values) expect(Number.isFinite(v) && v > 0, "값이 있음").toBe(true);
    expect((await tid(page, "route-row").first().getAttribute("aria-expanded")), "첫 줄 펼침").toBe("true");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "가로 넘침").toBeLessThanOrEqual(0);
    await ctx.close();
  });

  test("경계 — 759 는 세로 노선 · 761 이상(1280)은 가로 노선 그대로(나라 단추 줄 · 정거장 카드)", async ({ page }) => {
    test.skip(!(await open(page, { width: 759, height: 900 })), "물가 자료 없음");
    await expect(tid(page, "route-list")).toBeVisible();
    await expect(tid(page, "route-stops")).toBeHidden();
    for (const w of [761, 1280]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(300);
      await expect(tid(page, "route-list"), `${w}px 세로 노선 없음`).toBeHidden();
      await expect(tid(page, "route-stops"), `${w}px 나라 단추 줄`).toBeVisible();
      await expect(tid(page, "route-card").first(), `${w}px 정거장 카드`).toBeVisible();
    }
  });
});

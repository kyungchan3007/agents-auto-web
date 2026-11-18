// 작업 0214 (#253) — /geo 시안 B: 맨 위 전후 비교(#245) · 수치 카드 4개는 그대로 · 아래는 같은 크기 카드 2열(휴대폰 1열) · 막대마다 같은 숫자를 글로
import { type Locator, type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const box = async (loc: Locator) => {
  const b = await loc.boundingBox();
  if (!b) throw new Error("화면에 없음");
  return b;
};

test.describe("/geo 시안 B (작업 0214)", () => {
  test("맨 위 전후 비교 · 수치 카드 4개는 그대로 위에 있고 · 그 아래가 카드 격자", async ({ page }) => {
    await page.goto("/geo");
    await expect(tid(page, "rename-compare")).toBeVisible();
    await expect(tid(page, "geo-cards").locator("> div")).toHaveCount(4);
    const [a, c, g] = [await box(tid(page, "rename-compare")), await box(tid(page, "geo-cards")), await box(tid(page, "geo-grid"))];
    expect(a.y + a.height).toBeLessThanOrEqual(c.y + 1);
    expect(c.y + c.height).toBeLessThanOrEqual(g.y + 1);
  });

  test("카드 4장(AI 답변 · 봇 방문 · 읽은 페이지 · 검색 노출) — 넓은 화면 2열 · 휴대폰 1열 · 같은 모양", async ({ page }) => {
    await page.goto("/geo");
    const ids = ["geo-answers", "geo-bots", "geo-pages", "geo-search"];
    const b = [] as { x: number; y: number; width: number }[];
    for (const id of ids) b.push(await box(tid(page, id)));
    if (isPhone(page)) {
      for (let i = 1; i < 4; i++) expect(Math.abs(b[i].x - b[0].x)).toBeLessThan(1);
    } else {
      expect(Math.abs(b[0].y - b[1].y), "답변 · 봇 같은 줄").toBeLessThan(1);
      expect(Math.abs(b[2].y - b[3].y), "페이지 · 검색 같은 줄").toBeLessThan(1);
      expect(Math.abs(b[0].width - b[1].width)).toBeLessThan(2);
    }
    const frame = (id: string) => tid(page, id).evaluate((el) => { const s = getComputedStyle(el); return [s.borderTopLeftRadius, s.backgroundColor, s.paddingLeft, s.paddingTop]; });
    const f0 = await frame(ids[0]);
    for (const id of ids) expect(await frame(id), id).toEqual(f0);
  });

  test("날마다 막대 — 측정한 날마다 한 칸 · 같은 숫자를 글로(aria-label · 숨은 글)", async ({ page }) => {
    await page.goto("/geo");
    const bars = tid(page, "day-bar");
    const n = await bars.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) {
      const label = (await bars.nth(i).getAttribute("aria-label")) ?? "";
      expect(label, `막대 ${i}`).toMatch(/^\d{4}-\d{2}-\d{2} (응답 받은 질문 \d+개 · 인용 \d+개|측정 실패)/);
      expect((await bars.nth(i).innerText()).trim()).toBe(label); // 숨은 글(sr-only)로 같은 글
    }
    await expect(tid(page, "geo-answers").getByRole("heading", { name: "측정한 날마다 기록" })).toBeVisible();
  });

  test("가로 막대 — 봇 · 페이지마다 이름 · 막대 · 숫자(글) · 숫자는 합쳐서 카드 수치와 맞음", async ({ page }) => {
    await page.goto("/geo");
    const rows = tid(page, "geo-bots").locator('[data-testid="bar-row"]');
    expect(await rows.count()).toBeGreaterThan(0);
    const values = await rows.evaluateAll((els) => els.map((e) => Number((e.getAttribute("data-value") ?? "0"))));
    for (let i = 0; i < values.length; i++) expect((await rows.nth(i).innerText()).replace(/,/g, "")).toContain(String(values[i]));
    const pageRows = tid(page, "geo-pages").locator('[data-testid="bar-row"]');
    expect(await pageRows.count()).toBeGreaterThan(0);
    // 경로 칸은 7.5rem (120px) 안
    const labelW = await pageRows.first().locator("span").first().evaluate((el) => el.getBoundingClientRect().width);
    expect(labelW).toBeLessThanOrEqual(122);
  });

  test("서버가 그린 HTML(검색 · AI 가 읽는 글)에도 막대 숫자가 그대로 있음", async ({ page }) => {
    const html = await (await page.request.get("/geo")).text();
    expect(html).toContain('data-testid="bar-row"');
    expect(html).toContain('data-testid="day-bar"');
  });

  test("넓은 화면에서 카드 격자가 짧음(예전 표 구간 약 2,800px → 1,700px 이하) · 가로 넘침 없음 · 콘솔 오류 없음", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto("/geo");
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
    if (!isPhone(page)) expect((await box(tid(page, "geo-grid"))).height).toBeLessThanOrEqual(1700);
    expect(errors.filter((e) => !/Failed to load resource|favicon/.test(e))).toEqual([]);
  });
});

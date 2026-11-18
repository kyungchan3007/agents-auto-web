// 작업 0220 — 새 디자인 /prices (시안 B) · 테스트 먼저
//   표시: data-testid="prices-band"(첫 화면 파랑 띠) · "budget"(예산 카드 · 경계에 걸침) · "budget-day" · "budget-total"(카운트업) · "ruler"(role=img 한국 = 100 자) · "ruler-pin"(data-value · data-x · data-side) · "ruler-korea" · "price-bands"(세 칸 표)
import { type Page, expect, test } from "@playwright/test";

const BLUE = "rgb(36, 56, 168)";
const SUN = "rgb(247, 197, 72)";
const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const box = async (page: Page, id: string) => {
  const b = await tid(page, id).first().boundingBox();
  if (!b) throw new Error(`${id} 가 화면에 없음`);
  return b;
};
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const num = (s: string) => Number(s.replace(/[^\d.]/g, ""));
const ready = async (page: Page) => (await tid(page, "price-bands").count()) > 0;

test.describe("새 /prices — 첫 화면 (작업 0220)", () => {
  test("가로 넘침 없음 · 콘솔 오류 없음 · 사진 요청 0 (1280 · 768 · 390)", async ({ page }) => {
    const errors: string[] = [];
    const photos: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("request", (r) => r.url().includes("/images/photos") && photos.push(r.url()));
    for (const [w, h] of [[1280, 800], [768, 900], [390, 844]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/prices");
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${w}px 가로 넘침`).toBeLessThanOrEqual(0);
    }
    expect(errors).toEqual([]);
    expect(photos).toEqual([]);
    await expect(page.locator('[data-testid="photo-header"]')).toHaveCount(0);
  });

  test("메뉴와 한 면으로 이어지는 파랑 · 지금 라벨 · 큰 제목(숫자 % 만 노랑) · 지금 설명", async ({ page }) => {
    await page.goto("/prices");
    const header = await page.getByRole("banner").boundingBox();
    const band = await box(page, "prices-band");
    expect(await tid(page, "prices-band").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(BLUE);
    expect(Math.abs(band.y - ((header?.y ?? 0) + (header?.height ?? 0)))).toBeLessThanOrEqual(1);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveText(/는? 한국보다 물가가 \d+% (낮|높)습니다$|^.+은 한국보다 물가가 \d+% (낮|높)습니다$|한국과 물가가 비슷합니다|물가 자료를 받지 못했습니다/);
    if (/\d+%/.test((await h1.textContent()) ?? "")) expect(await h1.locator('[data-testid="emph"]').first().evaluate((el) => getComputedStyle(el).color)).toBe(SUN);
    await expect(h1.locator("xpath=..")).toContainText("여행 물가"); // 제목 위 작은 라벨 유지
    await expect(h1.locator("xpath=..")).toContainText("세계은행 나라별 물가 수준(한국 = 100)");
    for (const en of ["PRICE LEVEL", "DAILY BUDGET", "SCALE"]) await expect(page.locator("main")).not.toContainText(en);
  });

  test("예산 카드가 파랑 면과 하늘 면 경계에 걸침", async ({ page }) => {
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const band = await box(page, "prices-band");
    const card = await box(page, "budget");
    const bandBottom = band.y + band.height;
    expect(bandBottom).toBeGreaterThan(card.y + 20);
    expect(bandBottom).toBeLessThan(card.y + card.height - 20);
    if (!isPhone(page)) expect(card.x).toBeGreaterThan(640); // 넓은 화면은 오른쪽
  });
});

test.describe("새 /prices — 예산 · 자 · 표 (작업 0220)", () => {
  test("예산 계산 — 같은 입력 → 같은 금액 · 하루 × 일수 = 전체 · 틀린 입력은 이유", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const card = tid(page, "budget");
    const fields = card.getByRole("textbox");
    await fields.nth(0).fill("100,000");
    await fields.nth(1).fill("4");
    const day = num((await tid(page, "budget-day").innerText()) ?? "");
    expect(day).toBeGreaterThan(0);
    expect(num((await tid(page, "budget-total").getByTestId("count-up").getAttribute("data-final")) ?? "")).toBe(day * 4);
    await fields.nth(1).fill("2");
    await expect.poll(async () => num((await tid(page, "budget-total").getByTestId("count-up").getAttribute("data-final")) ?? "")).toBe(day * 2);
    await fields.nth(1).fill("abc");
    await expect(card).toContainText("일수는 1 ~ 90일");
    await expect(card).toContainText("여행 하루 예산");
    await expect(page.locator("#budget")).toHaveCount(1);
  });

  test("카운트업 — 움직임 줄이기면 처음부터 최종 · 켜면 끝나서 최종 값과 같음 (겹치지 않음)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const total = tid(page, "budget-total").getByTestId("count-up");
    expect(await total.evaluate((e) => e.textContent)).toBe(await total.getAttribute("data-final"));
    const page2 = await page.context().newPage();
    await page2.goto("/prices");
    await page2.waitForTimeout(1800);
    const t2 = page2.locator('[data-testid="budget-total"] [data-testid="count-up"]');
    expect(await t2.evaluate((e) => e.textContent)).toBe(await t2.getAttribute("data-final"));
    await page2.close();
  });

  test("한국 = 100 자 — 점 위치 = 물가 숫자 비율 · 위 · 아래 번갈아 · 한국 100 표시 · 표의 맨 위 나라들", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const ruler = tid(page, "ruler");
    await expect(ruler).toHaveAttribute("role", "img");
    const rb = (await ruler.boundingBox())!;
    const pins = tid(page, "ruler-pin");
    const n = await pins.count();
    expect(n).toBeGreaterThanOrEqual(2);
    const info = await pins.evaluateAll((els) => els.map((e) => ({ v: Number((e as HTMLElement).dataset.value), x: Number((e as HTMLElement).dataset.x), side: (e as HTMLElement).dataset.side })));
    const lo = Number(await ruler.getAttribute("data-lo"));
    const hi = Number(await ruler.getAttribute("data-hi"));
    for (let i = 0; i < n; i++) {
      expect(info[i].x).toBeCloseTo(((info[i].v - lo) / (hi - lo)) * 100, 1);
      const b = (await pins.nth(i).boundingBox())!;
      const axis = (await tid(page, "ruler-axis").boundingBox())!;
      expect(Math.abs(b.x + b.width / 2 - (axis.x + (axis.width * info[i].x) / 100))).toBeLessThanOrEqual(Math.max(2, b.width / 2 + 1)); // 점 · 이름표 가운데가 자 위 위치 근처
      if (i > 0) expect(info[i].side).not.toBe(info[i - 1].side);
    }
    const kr = tid(page, "ruler-korea");
    await expect(kr).toContainText("한국 100");
    const kb = (await kr.boundingBox())!;
    const axis = (await tid(page, "ruler-axis").boundingBox())!;
    expect(Math.abs(kb.x + kb.width / 2 - (axis.x + (axis.width * (100 - lo)) / (hi - lo)))).toBeLessThanOrEqual(Math.max(2, kb.width / 2 + 1));
    expect(rb.width).toBeGreaterThan(200);
    // 자의 나라들 = 표 구간마다 맨 위 두 줄의 물가 숫자
    const tableTop = await tid(page, "price-bands").locator("section").evaluateAll((secs) =>
      secs.flatMap((s) => Array.from(s.querySelectorAll("li")).slice(0, 2).map((li) => Number(((li.textContent ?? "").match(/물가\s*(\d+)\s*\(한국 100\)/) ?? [])[1]))),
    );
    for (const p of info) expect(tableTop).toContain(p.v);
  });

  test("세 칸 표 — 구간 이름 · 나라 줄에 물가 · 환율 상태 · 나라 더 보기 · 구간 사이 세로 선", async ({ page }) => {
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const bands = tid(page, "price-bands");
    for (const label of ["한국보다 싼 곳", "비슷한 곳", "한국보다 비싼 곳"]) await expect(bands).toContainText(label);
    await expect(bands).toContainText(/물가 \d+ \(한국 100\)/);
    await expect(bands.getByRole("button", { name: /나라 더 보기/ })).toBeVisible();
    // 카드가 아니라 선으로 나눈 표 — 구간에 둥근 테두리 카드 바탕이 없음
    const secBg = await bands.locator("section").first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(secBg).toBe("rgba(0, 0, 0, 0)");
  });

  test("나라 더 보기 — 표 아래 왼쪽 밑줄 글자 링크 (버튼 상자 · 배경 없음) · 누르면 펼침 · 접기 버튼은 지금 모양 그대로 (작업 0220 사용자 지적)", async ({ page }) => {
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    await page.waitForLoadState("networkidle");
    const more = tid(page, "price-bands").getByRole("button", { name: /^나라 더 보기 \(\d+곳\) ›$/ });
    await expect(more).toBeVisible();
    const st = await more.evaluate((el) => {
      const s = getComputedStyle(el);
      return { bg: s.backgroundColor, borderTop: s.borderTopWidth, borderBottom: s.borderBottomWidth, radius: s.borderTopLeftRadius, weight: s.fontWeight };
    });
    expect(st.bg).toBe("rgba(0, 0, 0, 0)"); // 배경 없음
    expect(st.borderTop).toBe("0px"); // 버튼 상자 테두리 없음 — 밑줄만
    expect(parseFloat(st.borderBottom)).toBeGreaterThanOrEqual(2);
    expect(Number(st.weight)).toBeGreaterThanOrEqual(700);
    // 표 아래 왼쪽
    const table = (await tid(page, "price-bands").locator("section").first().boundingBox())!;
    const mb = (await more.boundingBox())!;
    const bands = (await tid(page, "price-bands").boundingBox())!;
    expect(mb.y).toBeGreaterThanOrEqual(table.y + table.height - 1);
    expect(Math.abs(mb.x - bands.x)).toBeLessThanOrEqual(2);
    // 누르면 지금처럼 펼침 (aria-expanded) · 접기는 눈에 띄는 알약 + 화면 아래에 붙음 (#232 · #240 그대로)
    await more.click();
    const fold = tid(page, "price-bands").getByRole("button", { name: "나라 접기" });
    await expect(fold).toHaveAttribute("aria-expanded", "true");
    const fs = await fold.evaluate((el) => { const s = getComputedStyle(el); return { bg: s.backgroundColor, bw: s.borderTopWidth, r: s.borderTopLeftRadius }; });
    expect(fs.bg).not.toBe("rgba(0, 0, 0, 0)");
    expect(parseFloat(fs.bw)).toBeGreaterThanOrEqual(2);
    expect(await tid(page, "fold-bar").evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
    await fold.click();
    await expect(tid(page, "price-bands").getByRole("button", { name: /^나라 더 보기/ })).toBeVisible();
  });

  test("자바스크립트를 꺼도 제목 · 예산 · 자 · 표가 보임", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/prices");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (await ready(page)) {
      await expect(tid(page, "budget")).toBeVisible();
      await expect(tid(page, "ruler")).toBeVisible();
      await expect(tid(page, "price-bands")).toBeVisible();
      await expect(tid(page, "budget-total").getByTestId("count-up")).toHaveText(/[\d,]+원/);
    }
    await ctx.close();
  });
});

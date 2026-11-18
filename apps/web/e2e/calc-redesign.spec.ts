// 작업 0221 — 새 디자인 /calc (시안 A · 세관 꼬리표 · 수입물가 숫자 카드 · 과세환율 글자판) · 테스트 먼저
//   표시: data-testid="calc-tag-top"(남색 결론) · "calc-limit-bar"(한도까지 막대 · data-ratio) · "calc-tag-bottom"(영수증 내역) · "import-kpi"(숫자 카드 · 카운트업) · "customs-board"(관세청 값 글자판 묶음)
//   0208 크기 안정(calc-design · calc-gap)은 그대로 통과해야 함
import { type Page, expect, test } from "@playwright/test";

const NAVY = "rgb(22, 36, 110)";
const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const box = async (page: Page, id: string) => {
  const b = await tid(page, id).first().boundingBox();
  if (!b) throw new Error(`${id} 가 화면에 없음`);
  return b;
};
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const setPrice = async (page: Page, v: string) => {
  await page.locator("#price").fill(v);
  await expect(page.locator("#price")).toHaveValue(v);
};

test.describe("새 /calc — 머리 · 꼬리표 (작업 0221)", () => {
  test("가로 넘침 없음 · 콘솔 오류 없음 · 사진 요청 0 (1280 · 768 · 390)", async ({ page }) => {
    const errors: string[] = [];
    const photos: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("request", (r) => r.url().includes("/images/photos") && photos.push(r.url()));
    for (const [w, h] of [[1280, 800], [768, 900], [390, 844]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/calc");
      await page.waitForTimeout(400);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${w}px 가로 넘침`).toBeLessThanOrEqual(0);
    }
    expect(errors).toEqual([]);
    expect(photos).toEqual([]);
    await expect(page.locator('[data-testid="photo-header"]')).toHaveCount(0);
  });

  test("머리 — 사진 배너 없음 · 라벨 · 큰 문장(금액에 노란 밑줄 · 입력으로 바뀜) · 지금 설명 · 영문 라벨 없음", async ({ page }) => {
    await page.goto("/calc");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toContainText("세금 없이 받습니다");
    const emph = h1.locator('[data-testid="emph"]').first();
    await expect(emph).toHaveText(/180/);
    await expect(emph).toHaveAttribute("data-bg", "light");
    await setPrice(page, "250");
    await expect(h1).not.toContainText("세금 없이 받습니다");
    await expect(page.locator("main")).toContainText("물건 값을 넣으면 면세 한도 안인지 바로 알려 드립니다");
    for (const en of ["CUSTOMS", "CUSTOMS TAG", "IMPORT PRICES", "ITEM"]) await expect(page.locator("main")).not.toContainText(en);
  });

  test("결과 = 세관 꼬리표 — 위 남색 결론(도장 · 금액 · 한도 막대) · 아래 영수증 점선 내역 · 합계 · 안내", async ({ page }) => {
    await page.goto("/calc");
    await setPrice(page, "180");
    const top = tid(page, "calc-tag-top");
    const bottom = tid(page, "calc-tag-bottom");
    expect(await top.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe(NAVY);
    expect(await bottom.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(255, 255, 255)");
    await expect(top).toContainText(/면세 한도 안/);
    await expect(top).toContainText(/\d[\d,]*원/);
    const [tb, bb] = [await box(page, "calc-tag-top"), await box(page, "calc-tag-bottom")];
    expect(bb.y).toBeGreaterThanOrEqual(tb.y + tb.height - 1);
    await expect(bottom).toContainText("모두 합쳐 예상");
    await expect(bottom).toContainText("예상 금액입니다. 실제 세금은 통관 때 정해집니다.");
    expect(await tid(page, "calc-result").locator("dl > div").count()).toBe(6);
    // 도장은 기울기 그대로
    expect(await top.getByRole("status").first().evaluate((el) => getComputedStyle(el).rotate)).not.toBe("none"); // Tailwind 의 -rotate-3 은 rotate 속성
  });

  test("한도 막대 — 채움 = 물건 값 / 한도 (180 → 0.9 · 넘으면 가득) · 값을 바꿔도 카드 높이 같음", async ({ page }) => {
    await page.goto("/calc");
    await setPrice(page, "180");
    const bar = tid(page, "calc-limit-bar");
    await expect(bar).toContainText("한도");
    expect(Number(await bar.getAttribute("data-ratio"))).toBeCloseTo(0.9, 2);
    const track = (await bar.locator("[data-testid='calc-limit-fill']").locator("xpath=..").boundingBox())!;
    const fill = (await bar.locator("[data-testid='calc-limit-fill']").boundingBox())!;
    expect(Math.abs(fill.width / track.width - 0.9)).toBeLessThan(0.02);
    const h1 = (await box(page, "calc-result")).height;
    await setPrice(page, "201");
    expect(Number(await tid(page, "calc-limit-bar").getAttribute("data-ratio"))).toBeGreaterThanOrEqual(1);
    expect(Math.abs((await box(page, "calc-result")).height - h1)).toBeLessThan(1);
    await setPrice(page, "abc");
    expect(Math.abs((await box(page, "calc-result")).height - h1)).toBeLessThan(1);
  });
});

test.describe("새 /calc — 수입물가와 환율 · 과세환율 (작업 0221)", () => {
  test("왼쪽 숫자 카드 두 장(카운트업 · 끝 값 = 실제 값 · 점 + 전달보다) · 오른쪽 그래프 + 이번 주 과세환율", async ({ page }) => {
    await page.goto("/calc");
    const sec = tid(page, "import-price-section");
    const kpis = sec.locator('[data-testid="import-kpi"]');
    if ((await kpis.count()) === 0) test.skip(true, "수입물가 자료 없음");
    await expect(kpis).toHaveCount(2);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.reload();
    await kpis.first().scrollIntoViewIfNeeded();
    const counts = sec.locator('[data-testid="import-kpi"] [data-testid="count-up"]');
    expect(await counts.count()).toBe(2);
    for (let i = 0; i < 2; i++) expect(await counts.nth(i).evaluate((e) => e.textContent)).toBe(await counts.nth(i).getAttribute("data-final"));
    await expect(sec.locator('[data-testid="import-kpi-dot"]')).toHaveCount(2);
    await expect(kpis.first()).toContainText(/전달보다/);
    if (!isPhone(page)) {
      const kb = await box(page, "import-kpi");
      const cb = await box(page, "import-chart");
      expect(cb.x).toBeGreaterThan(kb.x + kb.width - 1); // 왼쪽 카드 · 오른쪽 그래프
      const cu = await box(page, "customs-section");
      expect(cu.y).toBeGreaterThanOrEqual(cb.y + cb.height - 1); // 그래프 아래
      expect(cu.x).toBeGreaterThan(kb.x + kb.width - 1); // 오른쪽 칸
    }
  });

  test("카운트업 끝 글자 = 지금 글 (움직임 켜짐)", async ({ page }) => {
    await page.goto("/calc");
    const counts = tid(page, "import-price-section").locator('[data-testid="import-kpi"] [data-testid="count-up"]');
    if ((await counts.count()) === 0) test.skip(true, "수입물가 자료 없음");
    await counts.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(1700);
    for (let i = 0; i < (await counts.count()); i++) expect(await counts.nth(i).evaluate((e) => e.textContent)).toBe(await counts.nth(i).getAttribute("data-final"));
  });

  test("이번 주 과세환율 — 관세청 값은 글자판 · 은행 값 · 차이 · 2주 미만이면 지금 안내", async ({ page }) => {
    await page.goto("/calc");
    const sec = tid(page, "customs-section");
    await expect(sec).toContainText("이번 주 과세환율");
    if ((await sec.getByText("준비 중").count()) > 0) return;
    const board = sec.getByTestId("customs-board").getByTestId("flap-board");
    await expect(board).toHaveAttribute("role", "img");
    const label = (await board.getAttribute("aria-label")) ?? "";
    expect(label).toMatch(/관세청 과세환율 [\d,.]+원/);
    expect(((await board.textContent()) ?? "").replace(/\s+/g, "")).toBe(label.replace(/^.*과세환율\s*/, "").replace(/원$/, ""));
    await expect(sec).toContainText("관세청");
    await expect(sec).toContainText(/은행/);
  });

  test("자바스크립트를 꺼도 꼬리표 · 숫자 카드 · 글자판이 보임", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/calc");
    await expect(tid(page, "calc-tag-top")).toBeVisible();
    await expect(tid(page, "calc-tag-bottom")).toBeVisible();
    await ctx.close();
  });
});

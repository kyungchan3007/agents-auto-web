// 작업 0220 — 새 디자인 /prices (시안 B) · 테스트 먼저
//   표시: data-testid="prices-band"(첫 화면 파랑 띠) · "budget"(예산 카드 · 경계에 걸침) · "budget-day" · "budget-total"(카운트업) · "route-section"(작업 0230: 정적 자 자리의 노선 · 옛 "ruler"(role=img 한국 = 100 자) · "ruler-pin"(data-value · data-x · data-side) · "ruler-korea" · "price-bands"(세 칸 표)
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

test.describe("새 /prices — 예산 카드 위치 · 크기 (작업 0220 사용자 지적 · 시안 B/prices.html .budget)", () => {
  // 시안(1280): 카드 폭 452px · 위 끝이 제목 첫 줄보다 약 100px 아래 · 파랑 면 아래 끝을 가로질러 아래 약 110px 가 흰 면 · 입력 칸 높이 64px · 결과 숫자 44px · 안쪽 여백 28 30 26
  //   시안은 .budget 이 translateY(150px) (자리는 그대로 두고 아래로 내림) · 파랑 면 끝 = 카드 원래 자리 아래 + 40px
  test("넓은 화면 — 카드 폭 · 제목보다 아래에서 시작 · 파랑/흰 경계를 가로지름(위 대부분 파랑 · 아래 약 110px 흰 면)", async ({ page }) => {
    test.skip(isPhone(page), "넓은 화면 전용");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    await page.waitForTimeout(400);
    const card = await box(page, "budget");
    const band = await box(page, "prices-band");
    const h1 = await page.getByRole("heading", { level: 1 }).boundingBox();
    expect(Math.abs(card.width - 452), `카드 폭 ${Math.round(card.width)}`).toBeLessThanOrEqual(4);
    expect(card.y - (h1?.y ?? 0), "카드 위 끝이 제목 첫 줄 위 끝보다 아래").toBeGreaterThanOrEqual(80);
    expect(card.y - (h1?.y ?? 0), "시안은 약 100px 아래").toBeLessThanOrEqual(140);
    const bandBottom = band.y + band.height;
    const below = card.y + card.height - bandBottom;
    expect(bandBottom - card.y, "카드 위 부분(파랑 안)이 큼").toBeGreaterThanOrEqual(280);
    expect(below, `카드 아래 흰 면 부분 ${Math.round(below)}px`).toBeGreaterThanOrEqual(80);
    expect(below).toBeLessThanOrEqual(160);
    // 아래 구간(한국 = 100 자)은 카드와 겹치지 않음
    const ruler = await box(page, "ruler");
    expect(ruler.y, "자가 카드 아래").toBeGreaterThanOrEqual(card.y + card.height + 20);
  });

  test("넓은 화면 — 입력 칸 높이 약 64px · 결과 숫자 약 44px · 안쪽 여백(위 28 · 옆 30)", async ({ page }) => {
    test.skip(isPhone(page), "넓은 화면 전용");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const heights = await tid(page, "budget").locator("select, input").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
    expect(heights.length).toBeGreaterThanOrEqual(3);
    for (const h of heights) expect(Math.abs(h - 64), `입력 칸 ${Math.round(h)}px`).toBeLessThanOrEqual(3);
    const fs = await tid(page, "budget-total").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(Math.abs(fs - 44), `결과 숫자 ${fs}px`).toBeLessThanOrEqual(2);
    const pad = await tid(page, "budget").evaluate((el) => ({ t: parseFloat(getComputedStyle(el).paddingTop), l: parseFloat(getComputedStyle(el).paddingLeft) }));
    expect(Math.abs(pad.t - 28)).toBeLessThanOrEqual(2);
    expect(Math.abs(pad.l - 30)).toBeLessThanOrEqual(2);
  });

  test("값을 바꿔도(나라 · 입력 오류) 카드 위 끝은 그대로 · 계산 결과 · 가로 넘침 없음", async ({ page }) => {
    test.skip(isPhone(page), "넓은 화면 전용");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const y0 = (await box(page, "budget")).y;
    await tid(page, "budget").getByRole("combobox").selectOption({ index: 1 });
    await tid(page, "budget").locator("input").first().fill("abc");
    await page.waitForTimeout(300);
    expect(Math.abs((await box(page, "budget")).y - y0)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
});

test.describe("새 /prices — 머리 제목 세 줄 (작업 0220 사용자 지적 · 시안 B/shots/prices-1280.png)", () => {
  // 시안: 왼쪽 칼럼에 세 줄 "인도는 한국보다 / 물가가 63% / 낮습니다" · 오른쪽에 예산 카드 — 넓게 두 줄로 놓지 않음 · 줄 나눔은 고른 나라 문장도 같은 규칙 · 휴대폰은 위아래 그대로
  const lines = (page: Page) =>
    page.getByRole("heading", { level: 1 }).evaluate((h) => {
      const r = document.createRange();
      r.selectNodeContents(h);
      const tops = [...r.getClientRects()].filter((x) => x.width > 2).map((x) => Math.round(x.top / 8));
      return new Set(tops).size;
    });

  test("넓은 화면 — 제목이 세 줄(기본 문장) · 폭이 왼쪽 칼럼에 묶여 예산 카드와 겹치지 않음", async ({ page }) => {
    test.skip(isPhone(page), "넓은 화면 전용");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    await page.waitForTimeout(400);
    const h1 = page.getByRole("heading", { level: 1 });
    const text = ((await h1.textContent()) ?? "").trim();
    const n = await lines(page);
    expect(n, `제목 줄 수 · ${text}`).toBeGreaterThanOrEqual(3);
    expect(n).toBeLessThanOrEqual(4);
    const hb = await h1.boundingBox();
    const card = await box(page, "budget");
    expect((hb?.x ?? 0) + (hb?.width ?? 0), "제목 오른쪽 끝이 예산 카드 왼쪽 끝보다 왼쪽").toBeLessThanOrEqual(card.x);
    // 제목 칼럼은 시안처럼 좁음 — 글자 크기의 8배 이하(약 한 줄에 두 단어)
    const fs = await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(hb?.width ?? 9999, "제목 칼럼 폭").toBeLessThanOrEqual(fs * 8);
  });

  test("넓은 화면 — 고른 나라(일본) 문장도 세 줄 \"일본은 한국보다 / 물가가 N% / 높습니다\"", async ({ page }) => {
    test.skip(isPhone(page), "넓은 화면 전용");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("flapfx:picked", JSON.stringify({ v: 1, country: "JPN", city: "도쿄", budget: 0 })));
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("일본은 한국보다");
    await page.waitForTimeout(400);
    expect(await lines(page), "고른 나라 문장 줄 수").toBe(3);
  });

  test("휴대폰 — 지금처럼 제목 아래에 예산 카드(위아래) · 가로 넘침 없음", async ({ page }) => {
    test.skip(!isPhone(page), "휴대폰 전용");
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const hb = await page.getByRole("heading", { level: 1 }).boundingBox();
    const card = await box(page, "budget");
    expect(card.y, "카드가 제목 아래").toBeGreaterThan((hb?.y ?? 0) + (hb?.height ?? 0) - 1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
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

  test("자바스크립트를 꺼도 제목 · 예산 · 노선 · 표가 보임", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/prices");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (await ready(page)) {
      await expect(tid(page, "budget")).toBeVisible();
      await expect(tid(page, "route-section")).toBeVisible(); // 작업 0230: 정적 자 자리에 노선
      await expect(tid(page, "price-bands")).toBeVisible();
      await expect(tid(page, "budget-total").getByTestId("count-up")).toHaveText(/[\d,]+원/);
    }
    await ctx.close();
  });
});

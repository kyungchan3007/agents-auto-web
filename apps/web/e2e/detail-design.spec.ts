// 작업 0212 (#251) — 통화 상세 · 여행 물가 디자인 검사 지적 7가지
import { type Locator, type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const box = async (loc: Locator) => {
  const b = await loc.boundingBox();
  if (!b) throw new Error("화면에 없음");
  return b;
};

test.describe("통화 상세 (작업 0212)", () => {
  test("1년 최저 · 최고 한 줄 · 글자가 칸 밖으로 안 나감 · 가로 넘침 없음 (작업 0219 · 비행 경로 카드)", async ({ page }) => {
    await page.goto("/currencies/USD");
    const [min, max] = [await box(tid(page, "route-min")), await box(tid(page, "route-max"))];
    expect(Math.abs(min.y - max.y)).toBeLessThan(1); // 휴대폰도 한 줄
    expect(min.x).toBeLessThan(max.x);
    const card = await box(tid(page, "route-card"));
    for (const b of [min, max]) {
      expect(b.x).toBeGreaterThanOrEqual(card.x - 1);
      expect(b.x + b.width).toBeLessThanOrEqual(card.x + card.width + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  });

  test("1년 최저 · 최고 · 평균 값은 같은 소수 자릿수", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    const values = [
      (await tid(page, "route-min").getByTestId("count-up").getAttribute("data-final")) ?? "",
      (await tid(page, "route-max").getByTestId("count-up").getAttribute("data-final")) ?? "",
      (await tid(page, "route-avg").innerText()).replace("1년 평균", ""),
    ];
    const digits = values.map((v) => v.match(/\.(\d+)/)?.[1].length ?? 0);
    expect(new Set(digits).size, values.join(" | ")).toBe(1);
  });

  test("휴대폰 — 맨 아래 통화 줄의 판정 알약이 그 통화 칸 안에 있음", async ({ page }) => {
    test.skip(!isPhone(page), "휴대폰 전용");
    await page.goto("/currencies/USD");
    const links = tid(page, "currency-list").locator("nav ul li a");
    let checked = 0;
    for (let i = 0; i < 3; i++) {
      const link = links.nth(i);
      const pill = link.locator("span.rounded-pill");
      if ((await pill.count()) === 0) continue;
      const lb = await box(link);
      const pb = await box(pill);
      expect(pb.x, "알약 왼쪽").toBeGreaterThanOrEqual(lb.x - 0.5);
      expect(pb.x + pb.width, "알약 오른쪽").toBeLessThanOrEqual(lb.x + lb.width + 0.5);
      expect(pb.y + pb.height, "알약 아래").toBeLessThanOrEqual(lb.y + lb.height + 0.5);
      checked++;
    }
    expect(checked).toBeGreaterThan(0);
    // 칸끼리 겹치지 않음 (작업 0219: 맨 아래 목록은 격자 — 같은 줄이면 옆 칸 · 다음 줄이면 아래 칸)
    const a = await box(links.nth(0));
    const b = await box(links.nth(1));
    expect(a.x + a.width <= b.x + 0.5 || a.y + a.height <= b.y + 0.5).toBe(true);
  });

  test("맨 아래 통화 목록 — 격자로 모두 보임 (스크롤 칸 없음 · 중간에서 잘리지 않음 · 가로 넘침 없음)", async ({ page }) => {
    await page.goto("/currencies/USD");
    const ul = tid(page, "currency-list").locator("nav ul");
    expect(await ul.evaluate((el) => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    const ub = await box(ul);
    const items = tid(page, "currency-list").locator("nav ul li");
    const n = await items.count();
    expect(n).toBeGreaterThan(3);
    for (let i = 0; i < n; i++) {
      const b = await box(items.nth(i));
      expect(b.y + b.height, `${i + 1}번째 줄`).toBeLessThanOrEqual(ub.y + ub.height + 1);
      expect(b.x + b.width).toBeLessThanOrEqual(ub.x + ub.width + 1);
    }
  });
});

test.describe("여행 물가 (작업 0212)", () => {
  test("나라 줄 판정 알약은 '환율 …' 으로 시작 — 물가와 구분 (다른 화면 알약은 그대로)", async ({ page }) => {
    await page.goto("/prices");
    const pills = tid(page, "price-bands").locator("a span.rounded-pill");
    const n = await pills.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) expect((await pills.nth(i).innerText()).trim()).toMatch(/^환율 /);
  });

  // 작업 0248 · 17번: 통화 둘러보기 격자는 알약 대신 조용한 글자로 바꿈 — 알약이 있어야 한다는 모양 검사는 디자인 테스트로 나눔
  test("통화 목록 알약은 '환율' 로 시작하지 않음 — 물가 알약과 구분 @design", async ({ page }) => {
    await page.goto("/currencies/USD");
    const first = await tid(page, "currency-list").locator("nav ul li a span.rounded-pill").first().innerText({ timeout: 5000 });
    expect(first.trim()).not.toMatch(/^환율/);
  });

  test("세 카드(싼 곳 · 비슷한 곳 · 비싼 곳)는 같은 틀 — 구분은 제목 색과 작은 점 @design", async ({ page }) => {
    await page.goto("/prices");
    const cards = tid(page, "price-bands").locator("section");
    await expect(cards).toHaveCount(3);
    const frame = (i: number) => cards.nth(i).evaluate((el) => { const s = getComputedStyle(el); return [s.borderTopWidth, s.borderTopStyle, s.borderTopColor, s.borderRadius, s.backgroundColor, s.paddingTop]; }); // 작업 0220: 구간 사이 세로 선 때문에 양 끝 칸의 좌우 안쪽 여백은 다름 — 틀(테두리 · 바탕 · 위 여백)만 비교
    // 하이드레이션 · 첫 그림이 끝나기 전 스타일은 카드마다 다를 수 있어 — 같아질 때까지 다시 읽음(끝내 다르면 시간 초과로 실패 · 작업 0242)
    await expect.poll(async () => JSON.stringify([await frame(1), await frame(2)]) === JSON.stringify([await frame(0), await frame(0)]), { message: "세 카드는 같은 틀" }).toBe(true);
    const title = (i: number) => cards.nth(i).locator("h2").evaluate((el) => getComputedStyle(el).color);
    await expect.poll(async () => (await title(0)) !== (await title(2)), { message: "싼 곳 · 비싼 곳 제목 색은 다름" }).toBe(true);
    await expect(tid(page, "band-mark")).toHaveCount(3);
    await expect.poll(async () => new Set(await tid(page, "band-mark").evaluateAll((els) => els.map((e) => getComputedStyle(e).backgroundColor))).size, { message: "세 구분 점 색이 서로 다름" }).toBe(3);
  });

  test("여행 하루 예산 — 고른 나라가 있으면 그 나라로 시작 · 없으면 일본", async ({ page }) => {
    await page.goto("/prices");
    const select = tid(page, "budget").getByLabel("나라");
    await expect(select).toHaveValue("JPN");
    await page.evaluate(() => localStorage.setItem("flapfx:picked", JSON.stringify({ v: 1, country: "THA", city: "방콕", budget: 0 })));
    await page.goto("/prices");
    await expect(tid(page, "budget").getByLabel("나라")).toHaveValue("THA");
    // 주소의 ?country= 가 더 앞
    await page.goto("/prices?country=FRA");
    await expect(tid(page, "budget").getByLabel("나라")).toHaveValue("FRA");
    // 두바이(아랍에미리트)도 물가 자료에 있는 나라 — 그 나라로 시작
    await page.evaluate(() => localStorage.setItem("flapfx:picked", JSON.stringify({ v: 1, country: "ARE", city: "두바이", budget: 0 })));
    await page.goto("/prices");
    await expect(tid(page, "budget").getByLabel("나라")).toHaveValue("ARE");
  });
});

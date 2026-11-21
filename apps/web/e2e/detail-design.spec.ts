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
    await page.waitForLoadState("networkidle"); // 하이드레이션이 끝난 뒤 잼 — 주말에는 하이드레이션 뒤에 '주말에는 고시가 없어 …' 줄(24px)이 생겨 그 전에 재면 위치가 어긋남 (작업 0095 기능 · 작업 0248 CI 가 토요일에 돎)
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

  // 작업 0260 — 판정 알약 · 조용한 글자('최근 90일 …')는 표에서 없어짐: "휴대폰 줄의 판정 표시가 칸 안에 있음" 검사는 currency-table.spec.ts 의 "휴대폰 — … 가로로 넘치지 않음"(이름 · 환율 · 내린 폭이 줄 안)으로 옮김
  // 작업 0260 — 카드 격자가 표(두 단 · 휴대폰 한 단)로 바뀜: 모두 보임 · 스크롤 칸 없음 · 가로 넘침 없음은 그대로 지킴
  test("맨 아래 통화 목록 — 표로 모두 보임 (스크롤 칸 없음 · 중간에서 잘리지 않음 · 가로 넘침 없음)", async ({ page }) => {
    await page.goto("/currencies/USD");
    const cols = tid(page, "currency-list").locator('[data-testid="currency-col"]');
    const nc = await cols.count();
    expect(nc).toBeGreaterThan(0);
    for (let c = 0; c < nc; c++) {
      const ul = cols.nth(c).locator("ul");
      expect(await ul.evaluate((el) => el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1), `${c + 1}번째 단 스크롤 칸 없음`).toBe(true);
      const ub = await box(ul);
      const items = cols.nth(c).locator("ul li");
      const n = await items.count();
      for (let i = 0; i < n; i++) {
        const b = await box(items.nth(i));
        expect(b.y + b.height, `${c + 1}단 ${i + 1}번째 줄`).toBeLessThanOrEqual(ub.y + ub.height + 1);
        expect(b.x + b.width).toBeLessThanOrEqual(ub.x + ub.width + 1);
      }
    }
    expect(await tid(page, "currency-list").locator("nav ul li").count()).toBeGreaterThan(3);
  });

  // 작업 0250 — 17번이 둘러보기 격자의 알약을 조용한 글자('최근 90일 중 하위 N%' · '최근 90일 최저')로 바꿈 · 남긴 것: 판정 글자가 '환율 …' 알약 글(물가 쪽)로 시작하지 않음
  test("통화 목록의 판정 글자는 '환율 …' 으로 시작하지 않음 — 물가 쪽 알약과 구분", async ({ page }) => {
    await page.goto("/currencies/USD");
    const texts = await tid(page, "currency-list").locator("nav ul li a").allInnerTexts();
    const judged = texts.filter((t) => /최근 90일/.test(t));
    test.skip(judged.length === 0, "판정이 있는 통화 없음");
    for (const t of judged) expect(t, "판정 글자").not.toMatch(/환율 하위|환율 상위/);
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

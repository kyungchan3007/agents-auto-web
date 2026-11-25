// 작업 0356 — 통화 상세 "다른 나라 통화 보기" 버튼 + 오른쪽 사이드바(휴대폰은 아래 시트) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 원문: 모션 A(버튼이 늘어나 사이드바) + 스크롤 1(열린 동안 뒤 화면 잠금) — 움직임의 모양(0.7초 · 곡선 · 국기 날아감)은 @design 이라 여기서 보지 않음
//
// builder 가 다는 표시 (data-testid) — 통화 상세(/currencies/CODE)
//   converter-card         "실제로 바꿀 때" 바깥 카드(버튼 양끝 · 둥글기의 기준 · 안쪽 흰 면 converter 가 아님)
//   currency-more          열기 버튼 · button · aria-expanded · 글 안에 제목 "다른 나라 통화 보기" · 아래 줄 · 국기 · 끝 ›
//                          (자바스크립트가 없으면 a[href="#currency-list"] 링크 — 맨 아래 둘러보기로 이동)
//   currency-more-sub      버튼 아래 줄 ("22개 통화 오늘 환율을 한눈에" / "고른 통화 · 일본 엔 100 846.76원")
//   currency-more-flag     버튼 안 국기 하나하나 · data-currency="JPY"
//   currency-sidebar       role="dialog" 상자(이름 있음 · 제목 "다른 나라 통화") — 열린 동안만 화면에 있음(닫히면 숨김 또는 없음)
//   currency-backdrop      뒤를 덮는 어두운 막(누르면 닫힘)
//   currency-sidebar-close ✕ 닫기 버튼(접근 이름 "닫기")
//   currency-side-date     기준 날짜 YYYY-MM-DD · currency-side-hint "90일 최고보다 많이 내린 순서 · 누르면 그 통화로 바뀝니다"
//   currency-side-list     스크롤되는 목록 상자 (overscroll-behavior: contain)
//   currency-side-row      줄 하나 = 줄 전체가 a[href="/currencies/CODE"] · 안에 currency-name · currency-rate · currency-drop(둘러보기 표와 같은 글) · 국기 · 지금 통화는 aria-current="page" + 배경 칠함
//   사이드바 안 검색 칸 = role=combobox (지금 통화 검색과 같은 동작: '도쿄' → JPY)
// 둘러보기 표(맨 아래 currency-list)는 그대로 — 사이드바 목록의 자료 · 순서 기준
import { type Locator, type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const more = (page: Page) => tid(page, "currency-more");
const side = (page: Page) => tid(page, "currency-sidebar");
const sideRows = (page: Page) => side(page).locator('[data-testid="currency-side-row"]');
const tableRows = (page: Page) => tid(page, "currency-list").locator('li[data-testid="currency-row"]');
const isPhone = () => test.info().project.name === "휴대폰";
const codeOf = (href: string | null) => (href ?? "").replace(/\/+$/, "").split("/").pop() ?? "";

async function box(loc: Locator) {
  const b = await loc.boundingBox();
  if (!b) throw new Error("화면에 없음");
  return b;
}
const tableCodes = async (page: Page) => (await tableRows(page).locator("a[href^='/currencies/']").evaluateAll((as) => as.map((a) => a.getAttribute("href")))).map(codeOf);
const sideCodes = async (page: Page) => (await sideRows(page).evaluateAll((rs) => rs.map((r) => (r.matches("a") ? r : r.querySelector("a"))?.getAttribute("href") ?? ""))).map(codeOf);
const flagCodes = async (page: Page) => more(page).locator('[data-testid="currency-more-flag"]').evaluateAll((els) => els.map((e) => e.getAttribute("data-currency")));

/** 열기: 하이드레이션 전 클릭이 사라질 수 있어 사이드바가 보일 때까지 다시 누름 */
async function open(page: Page) {
  await expect(more(page)).toBeVisible();
  await expect(async () => {
    if ((await more(page).getAttribute("aria-expanded")) !== "true") await more(page).click();
    await expect(side(page)).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 10_000 });
  await expect(more(page)).toHaveAttribute("aria-expanded", "true");
}
const still = async (page: Page) => {
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
};
const closed = async (page: Page) => {
  await expect(side(page)).toBeHidden();
  await expect(more(page)).toHaveAttribute("aria-expanded", "false");
};

test.describe("버튼 (작업 0356 · 10c-cta)", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" }); // 위치 · 크기는 움직임이 끝난 모양으로 잼
    await page.goto("/currencies/USD");
    await still(page);
  });

  test("글 · 아래 줄 개수 = 실제 목록(둘러보기 표) 개수 · aria-expanded 닫힘", async ({ page }) => {
    await expect(more(page)).toContainText("다른 나라 통화 보기");
    const n = await tableRows(page).count();
    expect(n).toBeGreaterThan(3);
    await expect(tid(page, "currency-more-sub")).toHaveText(`${n}개 통화 오늘 환율을 한눈에`);
    await expect(more(page)).toHaveAttribute("aria-expanded", "false");
    await expect(side(page)).toBeHidden();
  });

  test("기본 국기 = 목록 앞 네 통화(둘러보기 표 앞 네 줄과 같은 순서)", async ({ page }) => {
    expect(await flagCodes(page)).toEqual((await tableCodes(page)).slice(0, 4));
  });

  test("위치: 넓은 화면 = 오른쪽 '실제로 바꿀 때' 카드 아래 · 양끝 · 모서리 둥글기는 그 카드와 같고 아래선은 왼쪽 '1년 최저 · 최고' 카드 아래선 / 휴대폰 = 그 카드 아래 · 폭 같음", async ({ page }) => {
    const conv = tid(page, "converter-card"); // 바깥 카드(안쪽 흰 면 converter 가 아님) — 사용자 지적
    const [c, m] = [await box(conv), await box(more(page))];
    expect(m.y, "버튼은 환전 카드 아래").toBeGreaterThanOrEqual(c.y + c.height - 1);
    expect(Math.abs(m.x - c.x), "왼쪽 끝").toBeLessThanOrEqual(1.5);
    expect(Math.abs(m.x + m.width - (c.x + c.width)), "오른쪽 끝").toBeLessThanOrEqual(1.5);
    const radius = (l: Locator) => l.evaluate((el) => getComputedStyle(el).borderTopLeftRadius);
    expect(await radius(more(page)), "모서리 둥글기").toBe(await radius(conv));
    if (!isPhone()) {
      const r = await box(tid(page, "route-card"));
      expect(Math.abs(m.y + m.height - (r.y + r.height)), "아래선 = 1년 최저 · 최고 카드 아래선").toBeLessThanOrEqual(2);
    }
  });

  test("누르는 자리 높이 44px 이상 · 가로 넘침 없음", async ({ page }) => {
    expect((await box(more(page))).height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

  test("테두리 버튼 — 0355 공통 모양 규칙(테두리 · 둥근 모서리)을 따름", async ({ page }) => {
    const s = await more(page).evaluate((el) => { const c = getComputedStyle(el); return { w: parseFloat(c.borderTopWidth), style: c.borderTopStyle }; });
    expect(s.style).toBe("solid");
    expect(s.w).toBeGreaterThanOrEqual(1);
  });
});

test.describe("열기 · 닫기 · 접근성 (작업 0356 · 10c-side)", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    await still(page);
  });

  test("열면 dialog(이름 있음) · 제목 · 기준 날짜 · 안내 글 · 뒤를 덮는 막 · aria-expanded true", async ({ page }) => {
    await open(page);
    await expect(side(page)).toHaveAttribute("role", "dialog");
    await expect(side(page)).toHaveAccessibleName(/다른 나라 통화/);
    await expect(side(page)).toContainText("다른 나라 통화");
    await expect(tid(page, "currency-side-date")).toHaveText(/\d{4}-\d{2}-\d{2}/);
    await expect(tid(page, "currency-side-hint")).toContainText("90일 최고보다 많이 내린 순서 · 누르면 그 통화로 바뀝니다");
    await expect(tid(page, "currency-backdrop")).toBeVisible();
  });

  test("크기: 넓은 화면 = 오른쪽 끝 · 폭 약 440px · 화면 높이 전체 / 휴대폰 = 아래에서 올라온 시트(폭 전체 · 높이 70~95%)", async ({ page }) => {
    await open(page);
    const [b, vp] = [await box(side(page)), page.viewportSize()!];
    if (isPhone()) {
      expect(b.width).toBeGreaterThanOrEqual(vp.width - 1);
      expect(Math.abs(b.y + b.height - vp.height), "아래에 붙음").toBeLessThanOrEqual(1);
      expect(b.height).toBeGreaterThanOrEqual(vp.height * 0.7);
      expect(b.height).toBeLessThanOrEqual(vp.height * 0.95);
    } else {
      expect(Math.abs(b.x + b.width - vp.width), "오른쪽 끝").toBeLessThanOrEqual(1);
      expect(b.width).toBeGreaterThanOrEqual(400);
      expect(b.width).toBeLessThanOrEqual(480);
      expect(b.y).toBeLessThanOrEqual(1);
      expect(b.height).toBeGreaterThanOrEqual(vp.height - 1);
    }
  });

  test("포커스: 열면 사이드바 안으로 · Tab 을 여러 번 눌러도 밖으로 나가지 않음", async ({ page }) => {
    await open(page);
    expect(await side(page).evaluate((el) => el.contains(document.activeElement))).toBe(true);
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      expect(await side(page).evaluate((el) => el.contains(document.activeElement)), `Tab ${i + 1}번째`).toBe(true);
    }
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Shift+Tab");
      expect(await side(page).evaluate((el) => el.contains(document.activeElement)), `Shift+Tab ${i + 1}번째`).toBe(true);
    }
  });

  test("Esc 로 닫힘 · 포커스가 버튼으로 돌아옴", async ({ page }) => {
    await open(page);
    await page.keyboard.press("Escape");
    await closed(page);
    await expect(more(page)).toBeFocused();
  });

  test("✕ 로 닫힘 · 포커스가 버튼으로", async ({ page }) => {
    await open(page);
    await tid(page, "currency-sidebar-close").click();
    await closed(page);
    await expect(more(page)).toBeFocused();
  });

  test("바깥(어두운 막)을 누르면 닫힘", async ({ page }) => {
    await open(page);
    const vp = page.viewportSize()!;
    await page.mouse.click(isPhone() ? vp.width / 2 : 10, isPhone() ? 10 : vp.height / 2);
    await closed(page);
  });

  test("사이드바 안을 누르면 닫히지 않음(막이 아님)", async ({ page }) => {
    await open(page);
    await tid(page, "currency-side-hint").click();
    await expect(side(page)).toBeVisible();
  });

  test("닫았다가 다시 열 수 있음", async ({ page }) => {
    await open(page);
    await page.keyboard.press("Escape");
    await closed(page);
    await open(page);
    await expect(side(page)).toBeVisible();
  });
});

test.describe("목록 (작업 0356)", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    await still(page);
    await open(page);
  });

  test("자료 · 순서 = 맨 아래 둘러보기 표와 같음(통화 · 오늘 환율 · 90일 최고보다 글)", async ({ page }) => {
    expect(await sideCodes(page)).toEqual(await tableCodes(page));
    const pick = (rows: Locator) => rows.evaluateAll((rs) => rs.map((r) => [r.querySelector('[data-testid="currency-name"]')?.textContent?.trim(), r.querySelector('[data-testid="currency-rate"]')?.textContent?.trim(), r.querySelector('[data-testid="currency-drop"]')?.textContent?.trim()].join("|")));
    expect(await pick(sideRows(page))).toEqual(await pick(tableRows(page)));
  });

  test("지금 보는 통화 줄(USD)은 aria-current=page · 배경이 칠해짐(다른 줄은 아님)", async ({ page }) => {
    const cur = side(page).locator('[aria-current="page"]');
    await expect(cur).toHaveCount(1);
    expect(await cur.evaluate((el) => (el.matches("a") ? el : el.querySelector("a"))?.getAttribute("href"))).toMatch(/\/currencies\/USD\/?$/);
    const bg = (l: Locator) => l.evaluate((el) => getComputedStyle(el.closest('[data-testid="currency-side-row"]') ?? el).backgroundColor);
    const other = sideRows(page).filter({ hasNot: page.locator('[aria-current="page"]') }).first();
    expect(await bg(cur)).not.toBe("rgba(0, 0, 0, 0)");
    expect(await bg(cur)).not.toBe(await bg(other));
  });

  test("줄 하나 = 줄 전체가 /currencies/코드 링크 · 국기", async ({ page }) => {
    const n = await sideRows(page).count();
    expect(n).toBeGreaterThan(3);
    for (let i = 0; i < Math.min(n, 5); i++) {
      const row = sideRows(page).nth(i);
      await expect(row.locator("a[href^='/currencies/']").or(row.locator("xpath=self::a[starts-with(@href,'/currencies/')]"))).toHaveCount(1);
      await expect(row.locator("svg").first(), "국기").toBeVisible();
    }
  });

  test("검색 칸 — '도쿄' 를 넣으면 JPY 가 남고 줄이 줄어듦 · 없는 말이면 '찾는 통화가 없습니다'", async ({ page }) => {
    const total = await sideRows(page).count();
    const input = side(page).getByRole("combobox");
    await expect(input).toBeVisible();
    await input.fill("도쿄");
    await expect(async () => {
      const codes = await sideCodes(page);
      expect(codes).toContain("JPY");
      expect(codes.length).toBeLessThan(total);
    }).toPass({ timeout: 5000 });
    await input.fill("zzzzqqqq");
    await expect(side(page)).toContainText("찾는 통화가 없습니다");
    await expect(sideRows(page)).toHaveCount(0);
  });
});

test.describe("통화 고르기 (작업 0356)", () => {
  test("줄을 누르면 사이드바가 닫히고 그 통화 페이지로 바뀜 · 버튼 국기는 그 통화 하나 · 아래 줄 '고른 통화 · …'", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    await still(page);
    await open(page);
    const target = (await sideCodes(page)).find((c) => c !== "USD");
    expect(target, "USD 말고 다른 통화 줄").toBeTruthy();
    await side(page).locator(`a[href$="/currencies/${target}"], a[href$="/currencies/${target}/"]`).first().click();
    await expect(page).toHaveURL(new RegExp(`/currencies/${target}/?$`));
    await expect(side(page)).toBeHidden();
    await expect(more(page)).toHaveAttribute("aria-expanded", "false");
    await expect.poll(() => flagCodes(page)).toEqual([target]);
    await expect(tid(page, "currency-more-sub")).toHaveText(/^고른 통화 · .+ \d[\d,]* [\d,.]+원$/);
    // 새로 고침하면 기본으로 (저장하지 않음)
    await page.reload();
    await still(page);
    expect((await flagCodes(page)).length).toBe(4);
    await expect(tid(page, "currency-more-sub")).toHaveText(/^\d+개 통화 오늘 환율을 한눈에$/);
  });

  test("고른 통화가 목록 아래쪽이면 열 때 그 줄이 보이도록 목록을 미리 내려 둠", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    await still(page);
    const last = (await tableCodes(page)).at(-1)!;
    await page.goto(`/currencies/${last}`);
    await still(page);
    await open(page);
    const inView = await tid(page, "currency-side-list").evaluate((list) => {
      const cur = list.querySelector('[aria-current="page"]');
      if (!cur) return false;
      const [l, c] = [list.getBoundingClientRect(), cur.getBoundingClientRect()];
      return c.top >= l.top - 1 && c.bottom <= l.bottom + 1;
    });
    expect(inView, "지금 통화 줄이 목록 안에서 보임").toBe(true);
  });
});

test.describe("스크롤 1 — 열린 동안 뒤 화면 잠금 (작업 0356)", () => {
  test("목록 끝까지 내려도 페이지 scrollY 그대로 · 옆으로 밀리지 않음 · 닫으면 원래 위치 · 목록은 overscroll contain", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    await still(page);
    await page.evaluate(() => window.scrollTo(0, 240));
    const y0 = await page.evaluate(() => window.scrollY);
    expect(y0).toBeGreaterThan(100);
    const kick = tid(page, "currency-kicker");
    const x0 = (await box(kick)).x;
    await open(page);
    expect(await tid(page, "currency-side-list").evaluate((el) => getComputedStyle(el).overscrollBehaviorY)).toBe("contain");
    const list = tid(page, "currency-side-list");
    const lb = await box(list);
    await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2);
    for (let i = 0; i < 12; i++) await page.mouse.wheel(0, 900); // 끝을 넘겨서 계속 굴림
    await page.waitForTimeout(300);
    expect(await list.evaluate((el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 2), "목록 끝까지 내려감").toBe(true);
    expect(await page.evaluate(() => window.scrollY), "열린 동안 페이지는 그대로").toBe(y0);
    expect(Math.abs((await box(kick)).x - x0), "스크롤바 자리로 옆으로 밀리지 않음").toBeLessThanOrEqual(0.5);
    await page.keyboard.press("Escape");
    await closed(page);
    expect(await page.evaluate(() => window.scrollY), "닫으면 원래 위치").toBe(y0);
    // 닫으면 다시 스크롤됨
    await page.mouse.wheel(0, 200);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(y0);
  });
});

test.describe("움직임 줄이기 · 움직임 있음 (작업 0356)", () => {
  test("움직임 줄이기: 누르자마자 최종 크기로 열림(진행 중인 움직임 없음)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    await still(page);
    await open(page);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Number.POSITIVE_INFINITY && Number(a.effect.getComputedTiming().duration) > 1 && a.playState === "running").length); // 움직임 줄이기가 거는 0.01ms 즉시 전환은 움직임으로 세지 않음
    expect(running, "진행 중인 움직임(1ms 넘는 것)").toBe(0);
    expect(Number(await side(page).evaluate((el) => getComputedStyle(el).opacity))).toBe(1);
    await page.keyboard.press("Escape");
    await expect(side(page)).toBeHidden({ timeout: 300 });
  });

  test("움직임 있음: 열린 뒤 2초 안에 목록이 보이고 닫으면 2초 안에 사라짐 (모양은 @design)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/currencies/USD");
    await still(page);
    await open(page);
    await expect(sideRows(page).first()).toBeVisible({ timeout: 2000 });
    await page.keyboard.press("Escape");
    await expect(side(page)).toBeHidden({ timeout: 2000 });
    await expect(more(page)).toHaveAttribute("aria-expanded", "false");
    await expect(more(page)).toBeFocused();
  });
});

test.describe("자바스크립트 없이 (작업 0356)", () => {
  test("버튼은 맨 아래 둘러보기로 가는 링크 · 둘러보기 표는 그대로 있음", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/currencies/USD");
    const link = more(page);
    await expect(link).toHaveCount(1);
    expect(await link.evaluate((el) => el.tagName)).toBe("A");
    const href = (await link.getAttribute("href")) ?? "";
    expect(href).toMatch(/^#.+/);
    await expect(page.locator(href)).toHaveCount(1);
    expect(await tableRows(page).count()).toBeGreaterThan(3);
    await ctx.close();
  });
});

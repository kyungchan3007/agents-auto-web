// 작업 0359 — 버튼 클릭 이벤트 e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   원문: 운영 주소에서만 · 이벤트 이름은 버튼마다 따로 · 개인정보 없음(고른 통화 · 나라 코드 정도만) · 미리보기 · 로컬에서는 보내지 않음
//   운영 흉내: click-track.ts 머리말 참고(--host-resolver-rules 로 flapfx.com → 127.0.0.1 · dataLayer 에 쌓인 'event' 를 읽음)
//   builder 는 새 표시가 필요 없음: 기존 표시 그대로 — next-card · compare-link · more-countries · faq-item · currency-more · currency-side-row · picked-country-link · 콤보박스 "여행지 검색"
//   이벤트와 누르는 곳(이름은 packages/shared 이벤트 표):
//     home_search_pick     홈 검색 칸에서 나라(옵션)를 고름        home_country_link   홈 카드 안 나라 페이지 링크
//     country_next_fx · country_next_flight · country_next_budget   /prices/JPN '다음으로 볼 것' 카드 1 · 2 · 3 의 링크
//     country_compare      견줘 볼 나라 링크 · country_all_prices  '다른 나라 물가도 보기' 버튼
//     fx_other_open        통화 상세 '다른 나라 통화 보기' 열기 · fx_other_pick  사이드바에서 통화 줄 누름(매개변수 currency=그 통화)
//     faq_open_prices      /prices/JPN 질문 펼침 · faq_open_currency  /currencies/USD 질문 펼침 (접는 것은 보내지 않음)
//     empty_next           막다른 화면 '그동안 볼 수 있는 것' 링크 — 환율 없는 고정 자료 빌드 전용이라 empty-states.spec.ts 에 있음
import { type Page, expect, test } from "@playwright/test";
import { PROD_LAUNCH, expectClean, names, prodUrl, recordPreview, recordProd, sent } from "./click-track";
import { forceDefaultHero } from "./default-hero";

test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
});

// 브라우저 시작 옵션은 파일 맨 위에서만 줄 수 있음(describe 안은 불가) — flapfx.com 이름만 127.0.0.1 로 풀리므로 미리보기 검사(127.0.0.1)에는 영향 없음
test.use({ launchOptions: PROD_LAUNCH });

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const search = (page: Page) => page.getByRole("combobox", { name: "여행지 검색" });

test.describe("운영 주소에서 누르면 그 이름의 이벤트 하나 (작업 0359)", () => {
  test.beforeEach(async ({ context }) => {
    await recordProd(context);
  });

  const go = async (page: Page, baseURL: string | undefined, path: string) => {
    await page.goto(prodUrl(baseURL, path));
    await page.waitForLoadState("networkidle");
    expect(await page.evaluate(() => location.hostname), "운영 주소를 흉내 냄").toBe("flapfx.com");
    expect(await page.evaluate(() => typeof (window as unknown as { gtag?: unknown }).gtag), "운영에서는 GA4 초기 글이 gtag 를 만듦").toBe("function");
    expect(await names(page), "페이지를 열기만 해서는 클릭 이벤트가 없음").toEqual([]);
  };

  test("홈: 검색 칸에서 나라를 고르면 home_search_pick · 카드의 나라 페이지 링크를 누르면 home_country_link", async ({ page, baseURL }) => {
    await go(page, baseURL, "/");
    await search(page).fill("베트남");
    await page.getByRole("option").first().click();
    await expect.poll(() => names(page)).toEqual(["home_search_pick"]);
    await tid(page, "picked-country-link").click();
    await expect(page).toHaveURL(/\/prices\/VNM\/?$/);
    expect(await names(page)).toEqual(["home_search_pick", "home_country_link"]);
    expectClean(await sent(page));
  });

  test("나라 페이지 '다음으로 볼 것' 카드 셋: 환전 → country_next_fx · 항공권 → country_next_flight · 예산 → country_next_budget", async ({ page, baseURL }) => {
    for (const [i, name] of [[0, "country_next_fx"], [1, "country_next_flight"], [2, "country_next_budget"]] as const) {
      await go(page, baseURL, "/prices/JPN");
      await tid(page, "next-card").nth(i).getByRole("link").click();
      await expect.poll(() => names(page), `${i + 1}번째 카드`).toEqual([name]);
      await page.evaluate(() => sessionStorage.removeItem("__ev"));
    }
  });

  test("견줘 볼 나라 → country_compare · '다른 나라 물가도 보기' → country_all_prices (각각 한 번)", async ({ page, baseURL }) => {
    await go(page, baseURL, "/prices/JPN");
    await tid(page, "compare-link").first().click();
    await expect(page).toHaveURL(/\/prices\/[A-Z]{3}\/?$/);
    expect(await names(page)).toEqual(["country_compare"]);
    await page.evaluate(() => sessionStorage.removeItem("__ev"));
    await go(page, baseURL, "/prices/JPN");
    await tid(page, "more-countries").click();
    await expect(page).toHaveURL(/\/prices\/?$/);
    expect(await names(page)).toEqual(["country_all_prices"]);
  });

  test("나라 페이지 질문을 펼치면 faq_open_prices · 이미 펼친 것을 접으면 보내지 않음 · 다시 펼치면 한 번", async ({ page, baseURL }) => {
    await go(page, baseURL, "/prices/JPN");
    const items = tid(page, "faq-item");
    await items.nth(2).locator("summary").click(); // 처음에는 접혀 있는 셋째
    await expect(items.nth(2)).toHaveAttribute("open", "");
    expect(await names(page)).toEqual(["faq_open_prices"]);
    await items.nth(0).locator("summary").click(); // 펼쳐 있던 첫째를 접음
    await expect(items.nth(0)).not.toHaveAttribute("open", "");
    expect(await names(page), "접을 때는 보내지 않음").toEqual(["faq_open_prices"]);
    await items.nth(0).locator("summary").click(); // 다시 펼침
    await expect(items.nth(0)).toHaveAttribute("open", "");
    expect(await names(page)).toEqual(["faq_open_prices", "faq_open_prices"]);
  });

  test("통화 상세: 열기 → fx_other_open · 사이드바에서 통화를 고르면 fx_other_pick(고른 통화 코드만)", async ({ page, baseURL }) => {
    await go(page, baseURL, "/currencies/USD");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await tid(page, "currency-more").click();
    await expect(tid(page, "currency-sidebar")).toBeVisible();
    expect(await names(page)).toEqual(["fx_other_open"]);
    const row = tid(page, "currency-side-row").filter({ hasNot: page.locator('[aria-current="page"]') }).first();
    const code = ((await row.evaluate((r) => (r.matches("a") ? r : r.querySelector("a"))?.getAttribute("href"))) ?? "").replace(/\/+$/, "").split("/").pop();
    await row.click();
    await expect(page).toHaveURL(new RegExp(`/currencies/${code}/?$`));
    const ev = await sent(page);
    expect(ev.map((e) => e[1])).toEqual(["fx_other_open", "fx_other_pick"]);
    expect(ev[1][2], "고른 통화 코드만").toEqual({ currency: code });
    expectClean(ev);
  });

  test("통화 상세 질문을 펼치면 faq_open_currency", async ({ page, baseURL }) => {
    await go(page, baseURL, "/currencies/USD");
    const items = tid(page, "faq-item");
    await items.nth(2).locator("summary").click();
    await expect(items.nth(2)).toHaveAttribute("open", "");
    expect(await names(page)).toEqual(["faq_open_currency"]);
  });
});

test.describe("미리보기 · 로컬(지금 주소)에서는 어떤 버튼을 눌러도 보내지 않음 (작업 0359)", () => {
  test("같은 버튼들을 눌러도 window.gtag 가 한 번도 불리지 않음", async ({ page, context }) => {
    await recordPreview(context);
    await page.goto("/prices/JPN");
    await page.waitForLoadState("networkidle");
    await tid(page, "faq-item").nth(2).locator("summary").click();
    await tid(page, "next-card").nth(2).getByRole("link").click(); // #budget
    await tid(page, "compare-link").first().click();
    await expect(page).toHaveURL(/\/prices\/[A-Z]{3}\/?$/);
    await page.goto("/currencies/USD");
    await page.waitForLoadState("networkidle");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await tid(page, "currency-more").click();
    await expect(tid(page, "currency-sidebar")).toBeVisible();
    await tid(page, "currency-side-row").filter({ hasNot: page.locator('[aria-current="page"]') }).first().click();
    await expect(page).toHaveURL(/\/currencies\/(?!USD)[A-Z]{3}\/?$/);
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await search(page).fill("베트남");
    await page.getByRole("option").first().click();
    await tid(page, "picked-country-link").click();
    await expect(page).toHaveURL(/\/prices\/VNM\/?$/);
    expect(await sent(page), "보낸 이벤트 없음").toEqual([]);
  });
});

// 작업 0355 — /prices/[code] 아래 "다른 나라 물가도 보기" 테두리 버튼 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   원문: "/prices/[code] 아래 '여행 물가 전체 보기' 작은 밑줄 링크 → 테두리 버튼 '다른 나라 물가도 보기 · 39개 나라 ›'. 나라 수는 실제 목록 개수로. 링크 위치는 그대로."
//         "통화 상세 위쪽 '이 통화 쓰는 나라 물가 보기' 링크는 그대로 둔다."
//   builder 가 다는 표시: data-testid="more-countries" (테두리 버튼 · 링크 → /prices)
//   정렬(왼쪽 칸 맞춤)은 위치 변경이라 새 테스트 없음(작업 종류 ②)
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
// 실제 나라 페이지 목록 = 사이트맵의 /prices/XXX 개수 (고정 숫자가 아니라 빌드가 만든 목록)
async function countryPageCount(page: Page) {
  const xml = await (await page.request.get("/sitemap.xml")).text();
  return new Set([...xml.matchAll(/<loc>[^<]*\/prices\/([A-Z]{3})<\/loc>/g)].map((m) => m[1])).size;
}

test.describe("나라 페이지 아래 테두리 버튼 (작업 0355 · 시안 10-A)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prices/JPN");
  });

  test("글 '다른 나라 물가도 보기 · N개 나라' · N 은 실제 나라 페이지 개수 · 링크는 /prices 그대로", async ({ page }) => {
    const btn = tid(page, "more-countries");
    await expect(btn).toHaveCount(1);
    const n = await countryPageCount(page);
    expect(n).toBeGreaterThan(1);
    await expect(btn).toHaveText(new RegExp(`^다른 나라 물가도 보기 · ${n}개 나라\\s*›$`));
    await expect(btn).toHaveAttribute("href", "/prices");
  });

  test("테두리 버튼 모양 — 테두리가 있고 누르는 자리 높이 44px 이상 (작업 0268)", async ({ page }) => {
    const btn = tid(page, "more-countries");
    await btn.scrollIntoViewIfNeeded();
    const m = await btn.evaluate((el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return { top: parseFloat(s.borderTopWidth), color: s.borderTopColor, style: s.borderTopStyle, h: r.height }; });
    expect(m.style).toBe("solid");
    expect(m.top).toBeGreaterThanOrEqual(1);
    expect(m.color).not.toBe("rgba(0, 0, 0, 0)");
    expect(m.h).toBeGreaterThanOrEqual(44);
  });

  test("작은 밑줄 링크 '여행 물가 전체 보기' 는 없어지고 버튼으로 바뀜 · 자주 묻는 질문 뒤에 있음", async ({ page }) => {
    await expect(page.getByRole("link", { name: "여행 물가 전체 보기" })).toHaveCount(0);
    const afterFaq = await page.evaluate(() => {
      const faq = [...document.querySelectorAll('[data-testid="faq-item"]')].pop();
      const btn = document.querySelector('[data-testid="more-countries"]');
      return !!faq && !!btn && !!(faq.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(afterFaq).toBe(true);
  });

  test("누르면 /prices", async ({ page }) => {
    await tid(page, "more-countries").click();
    await expect(page).toHaveURL(/\/prices\/?$/);
  });

  test("가로 넘침 없음", async ({ page }) => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});

test.describe("통화 상세 위쪽 링크는 그대로 (작업 0355 · 시안 10-B 는 정렬만)", () => {
  test("'이 통화 쓰는 나라 물가 보기' 링크가 그대로 있고 /prices?currency=USD · 테두리 버튼으로 바뀌지 않음", async ({ page }) => {
    await page.goto("/currencies/USD");
    const link = tid(page, "currency-detail").getByRole("link", { name: /이 통화 쓰는 나라 물가 보기/ }).first();
    await expect(link).toHaveAttribute("href", "/prices?currency=USD");
    await expect(tid(page, "more-countries")).toHaveCount(0);
    expect(await link.evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth))).toBe(0);
  });
});

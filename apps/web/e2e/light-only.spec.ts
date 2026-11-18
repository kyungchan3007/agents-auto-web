// 밝은 화면 하나만 — 작업 0173 추가 요청 (사용자 "피그마 시안대로 하나만") · 실행은 lead 가 PR 직전에 (빌드한 사이트를 읽음)
// 기기가 다크 모드여도 바탕은 항상 흰색(#FFFFFF · 작업 0216 사용자 결정 · 예전 하늘 종이 #EAF4F2) · 시안의 어두운 구간(바다 띠 #2438A8)은 그대로
import { expect, test } from "@playwright/test";

test.use({ colorScheme: "dark" }); // 두 프로젝트(넓은 화면 · 휴대폰) 모두 기기 다크 모드로 엶

const SKY = "rgb(255, 255, 255)"; // 흰 바탕 #FFFFFF (작업 0216 · 이름은 예전 그대로)
const SEA = "rgb(36, 56, 168)"; // #2438A8 (예전 울트라마린 띠 · #today 바탕이 이 색이면 안 됨)
const INK = "rgb(22, 36, 110)"; // #16246E 안내판

for (const path of ["/", "/currencies/USD", "/flights", "/prices", "/calc", "/log", "/about", "/geo"]) {
  test(`${path} — 기기 다크 모드여도 바탕은 흰색 · color-scheme 은 light`, async ({ page }) => {
    await page.goto(path);
    const { body, html, scheme } = await page.evaluate(() => ({
      body: getComputedStyle(document.body).backgroundColor,
      html: getComputedStyle(document.documentElement).backgroundColor,
      scheme: getComputedStyle(document.documentElement).colorScheme,
    }));
    expect([body, html], "바탕색").toContain(SKY);
    expect(scheme).toBe("light");
  });
}

test("홈 — 다크 모드에서도 오늘 환율 구간은 하늘 종이 위(전체 띠 없음) · 짙은 남색은 안내판에만 (작업 0177)", async ({ page }) => {
  await page.goto("/");
  const band = await page.locator("#today").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(band).not.toBe(SEA);
  const board = await page.locator('[data-testid="flap-board"]').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(board).toBe(INK);
});

test("주소창 색(theme-color) — 흰색 하나 (다크 모드에서도 같은 값)", async ({ page }) => {
  await page.goto("/");
  const colors = await page.locator('meta[name="theme-color"]').evaluateAll((els) => els.map((e) => (e.getAttribute("content") ?? "").toLowerCase()));
  expect(colors.length).toBeGreaterThan(0);
  for (const c of colors) expect(c).toBe("#ffffff");
});

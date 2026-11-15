// 밝은 화면 하나만 — 작업 0173 추가 요청 (사용자 "피그마 시안대로 하나만") · 실행은 lead 가 PR 직전에 (빌드한 사이트를 읽음)
// 기기가 다크 모드여도 바탕은 항상 하늘 종이(#EAF4F2) · 홈 오늘 환율 구간도 하늘 종이 (작업 0175 네 번째 묶음 — 울트라마린 바다 띠 배경을 없앰)
import { expect, test } from "@playwright/test";

test.use({ colorScheme: "dark" }); // 두 프로젝트(넓은 화면 · 휴대폰) 모두 기기 다크 모드로 엶

const SKY = "rgb(234, 244, 242)"; // #EAF4F2
const SEA = "rgb(36, 56, 168)"; // #2438A8

for (const path of ["/", "/currencies/USD", "/flights", "/prices", "/calc", "/log", "/about", "/geo"]) {
  test(`${path} — 기기 다크 모드여도 바탕은 하늘 종이 · color-scheme 은 light`, async ({ page }) => {
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

test("홈 — 다크 모드에서도 오늘 환율 구간(3D 지구)은 하늘 종이 바탕 (작업 0175 네 번째 묶음 · 울트라마린 바다 띠 아님)", async ({ page }) => {
  await page.goto("/");
  const band = await page.locator("#today").evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(band).not.toBe(SEA);
  expect([band, "rgba(0, 0, 0, 0)"], "구간이 따로 칠하지 않으면 투명 — 바탕은 페이지의 하늘 종이").toContain(band);
  const page_bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect([page_bg, band]).toContain(SKY);
});

test("주소창 색(theme-color) — 하늘 종이 하나 (다크 모드에서도 같은 값)", async ({ page }) => {
  await page.goto("/");
  const colors = await page.locator('meta[name="theme-color"]').evaluateAll((els) => els.map((e) => (e.getAttribute("content") ?? "").toLowerCase()));
  expect(colors.length).toBeGreaterThan(0);
  for (const c of colors) expect(c).toBe("#eaf4f2");
});

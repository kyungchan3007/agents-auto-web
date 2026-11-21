// 작업 0215 (#254) — (빌드 CSS 는 #ffffff 를 #fff 로 줄여 씀) 그림자 · 색을 토큰으로 옮겨도 화면 값은 그대로 (계산된 스타일이 예전과 같음)
import { expect, test } from "@playwright/test";

test("홈 출발 안내판 그림자 — 토큰 shadow-board 가 예전 값(0 10px 24px · 남색 25%)과 같음 @design", async ({ page }) => {
  await page.goto("/");
  const shadow = await page.locator('[data-testid="flap-board"]').first().evaluate((el) => getComputedStyle(el).boxShadow);
  // Tailwind 가 앞에 투명한 테두리 층(ring)을 붙이므로 마지막 층이 예전 값과 같은지 봄
  expect(shadow.endsWith("rgba(22, 36, 110, 0.25) 0px 10px 24px 0px")).toBe(true);
});

test("토큰이 :root 에서 읽힘 — 3D 장면이 쓰는 하늘 · 흰 거품 · 해 노랑 @design", async ({ page }) => {
  await page.goto("/");
  const v = await page.evaluate(() => ["--hav-sky-top", "--hav-sky-mid", "--hav-surface", "--hav-foam", "--hav-sun", "--hav-pin-cheap", "--hav-window-shade"].map((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()));
  expect(v).toEqual(["#afd4e6", "#d3e9ee", "#fff", "#fff", "#f7c548", "#2438a8", "#f4f6f8"]);
});

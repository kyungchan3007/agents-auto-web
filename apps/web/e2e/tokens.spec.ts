// 작업 0215 (#254) — (빌드 CSS 는 #ffffff 를 #fff 로 줄여 씀) 그림자 · 색을 토큰으로 옮겨도 화면 값은 그대로 (계산된 스타일이 예전과 같음)
import { expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";

test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
});

test("출발 안내판 그림자 — 토큰 shadow-board 가 예전 값(0 10px 24px · 남색 25%)과 같음 @design", async ({ page }) => {
  // 작업 0394: 홈의 출발 안내판(flap-board)은 작업 0384 에서 없어짐 — 그림자 토큰 값 자체를 :root 에서 읽음(인트로 안내판이 같은 토큰을 씀)
  await page.goto("/");
  const v = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--shadow-board").trim().replace(/\s+/g, " "));
  expect(v).toMatch(/^0 10px 24px (rgba\(22, ?36, ?110, ?0?\.25\)|#16246e40)$/);
});

test("토큰이 :root 에서 읽힘 — 3D 장면이 쓰는 하늘 · 흰 거품 · 해 노랑 @design", async ({ page }) => {
  await page.goto("/");
  const v = await page.evaluate(() => ["--hav-sky-top", "--hav-sky-mid", "--hav-surface", "--hav-foam", "--hav-sun", "--hav-pin-cheap", "--hav-window-shade"].map((n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim()));
  expect(v).toEqual(["#afd4e6", "#d3e9ee", "#fff", "#fff", "#f7c548", "#2438a8", "#f4f6f8"]);
});

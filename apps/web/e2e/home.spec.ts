// 홈 — 작업 0169 (디자인 변경 ②) · 실행은 lead 가 PR 직전에 (빌드한 사이트를 읽음)
// 값은 날마다 · 자료 유무에 따라 달라서 동작 · 순서 · 문구만 봄 — 지수가 있을 때와 없을 때(지금 운영) 모두 맞아야 함
//   builder 가 다는 표시: id="today"(바다 띠) · id="destinations"(도착지별 환전 타이밍) · data-testid="travel-graph" · data-testid="plane-route"
import { expect, test } from "@playwright/test";
import { openMenuIfCollapsed } from "./helpers";

test("홈 구간 순서 — 여행 타이밍 → 오늘 환율(바다 띠) → 도착지별 환전 타이밍", async ({ page }) => {
  await page.goto("/");
  const y = async (loc: ReturnType<typeof page.locator>) => (await loc.boundingBox())?.y ?? Number.NaN;
  const timing = await y(page.getByText("여행 타이밍", { exact: true }).first());
  const today = await y(page.locator("#today"));
  const dest = await y(page.locator("#destinations"));
  expect(timing, "여행 타이밍").toBeLessThan(today);
  expect(today, "오늘 환율").toBeLessThan(dest);
});

test("여행 타이밍 — 지수가 없으면 '아직 받지 못했습니다' · 그래프 · 비행기 없음 / 있으면 'N월에 떠나세요' · 그래프 · 비행기", async ({ page }) => {
  await page.goto("/");
  const none = page.getByText("국제항공료 지수를 아직 받지 못했습니다");
  const title = page.getByText(/^\d+월에 떠나세요$/);
  await expect(none.or(title)).toBeVisible(); // 둘 중 하나는 반드시
  if (await none.isVisible()) {
    await expect(page.locator('[data-testid="travel-graph"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="plane-route"]')).toHaveCount(0);
  } else {
    await expect(page.locator('[data-testid="travel-graph"]')).toBeVisible();
    await expect(page.locator('[data-testid="plane-route"]')).toHaveCount(1);
  }
});

test("오늘 환율 띠 — 이번 주 가장 싼 곳 문장 또는 '오늘 환율을 아직 받지 못했습니다' · 숫자를 지어내지 않음", async ({ page }) => {
  await page.goto("/");
  const band = page.locator("#today");
  await expect(band).toContainText("오늘 환율");
  await expect(band).toContainText(/이번 주 가장 싸게 갈 수 있는 곳은 .+입니다|오늘 환율을 아직 받지 못했습니다/);
});

test("도착지별 환전 타이밍 — 네 도시 줄이 통화 상세로 연결", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#destinations");
  await expect(section.getByRole("heading", { name: "도착지별 환전 타이밍" })).toBeVisible();
  for (const [city, currency] of [["도쿄", "JPY"], ["방콕", "THB"], ["파리", "EUR"], ["뉴욕", "USD"]]) {
    const link = section.getByRole("link", { name: new RegExp(city) });
    await expect(link, city).toHaveAttribute("href", `/currencies/${currency}`);
  }
});

test("메뉴 '오늘 환율' → 홈의 바다 띠(#today)로", async ({ page }) => {
  await page.goto("/currencies"); // 다른 페이지에서 시작
  await openMenuIfCollapsed(page);
  await page.getByRole("banner").getByRole("navigation").getByRole("link", { name: "오늘 환율", exact: true }).click();
  await expect(page).toHaveURL(/\/#today$/);
  await expect(page.locator("#today")).toBeInViewport();
});

test("바닥 띠 — 비행기 모델 출처(CC-BY 4.0)와 자료 출처", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("Poly by Google");
  await expect(footer).toContainText("CC-BY 4.0");
  await expect(footer).toContainText("한국수출입은행");
  await expect(footer.locator('a[href^="https://poly.pizza/"]')).toHaveCount(1);
});

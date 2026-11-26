// 오늘(2026-10-30) 만든 기능이 실제 브라우저에서 도는지 — 값은 날마다 바뀌어서 동작 · 모양만 봄 (작업 0101)
import { type Page, expect, test } from "@playwright/test";
import { openMenuIfCollapsed } from "./helpers";
import { forceDefaultHero } from "./default-hero";

test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
});

/** 페이지 오류 · 하이드레이션 어긋남 모으기 */
function watchErrors(page: Page) {
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && /hydrat|#418|#425|#423/i.test(m.text())) errs.push(m.text());
  });
  return errs;
}

for (const path of ["/", "/currencies/USD", "/prices", "/flights", "/calc", "/about"]) { // 어드민은 apps/admin/e2e/basics.spec.ts (작업 0312)
  test(`${path} — 페이지 오류 없음 · 가로로 넘치지 않음`, async ({ page }) => {
    const errs = watchErrors(page);
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(errs).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}

// 실제로 바꿀 때 — 시안(작업 0170 · Figma 02): 외화 입력 하나 "=" 노란 원화 결과칸 · 빠른 금액 칩 (예전 원화 ↔ 외화 두 칸 계산기는 시안에 없어 바뀜 · 작업 0086)
test("환율 계산기 — 외화를 넣으면 원화 결과가 바뀜 · 틀린 입력은 이유 (작업 0086 · 0170)", async ({ page }) => {
  await page.goto("/currencies/USD");
  const box = page.getByTestId("converter");
  const input = box.locator("input");
  // 작업 0219: 결과는 글자판 — 화면 읽기 이름(aria-label)이 결과 글 한 문장
  const result = box.getByTestId("converter-board").getByTestId("flap-board");
  await expect(input).toHaveCount(1); // 입력칸은 외화 하나
  await input.fill("100");
  await expect(result).toHaveAttribute("aria-label", /^\d[\d,]*(\.\d+)?원$/);
  const first = await result.getAttribute("aria-label");
  await input.fill("200");
  await expect(result).not.toHaveAttribute("aria-label", first ?? "");
  await expect(result).toHaveAttribute("aria-label", /^\d[\d,]*(\.\d+)?원$/);
  await input.fill("abc");
  await expect(page.locator("#converter-note")).toContainText("0 이상의 숫자");
  await expect(result).toHaveAttribute("aria-label", "—");
});

test("환율 계산기 — 빠른 금액 칩을 누르면 입력과 결과가 채워짐 (작업 0170)", async ({ page }) => {
  await page.goto("/currencies/USD");
  const box = page.getByTestId("converter");
  const chips = box.getByRole("group", { name: "빠른 금액" }).getByRole("button");
  expect(await chips.count()).toBeGreaterThanOrEqual(3);
  await box.locator("input").fill("abc"); // 틀린 값에서 시작해도 칩이 바로잡음
  await chips.nth(1).click();
  await expect(box.locator("input")).toHaveValue(/^\d[\d,]*(\.\d+)?$/);
  await expect(box.getByTestId("converter-board").getByTestId("flap-board")).toHaveAttribute("aria-label", /^\d[\d,]*(\.\d+)?원$/);
});

// 흐름 기간 — 시안(작업 0170): 기간 칩 "1개월 · 3개월 · 1년" 이 그래프 아래로 · 눌린 칩이 표시되고 그래프가 그 기간으로 바뀜 (작업 0087)
test("흐름 기간 — 칩을 누르면 그 기간이 눌림 표시되고 그래프가 바뀜 (작업 0087 · 0170)", async ({ page }) => {
  await page.goto("/currencies/USD");
  const group = page.getByRole("group", { name: "기간" });
  await expect(group.getByRole("button")).toHaveText(["1개월", "3개월", "1년"]);
  await group.getByRole("button", { name: "1개월" }).click();
  await expect(group.getByRole("button", { name: "1개월" })).toHaveAttribute("aria-pressed", "true");
  await expect(group.getByRole("button", { name: "1년" })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("img", { name: /^1개월 흐름 — / })).toBeVisible();
  await group.getByRole("button", { name: "1년" }).click();
  await expect(group.getByRole("button", { name: "1년" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("img", { name: /^1년 흐름 — / })).toBeVisible();
});

test("여행 예산 — 주소의 나라가 골라지고 결과가 나옴 (작업 0088 · 0100)", async ({ page }) => {
  await page.goto("/prices?country=THA#budget");
  await expect(page.locator("#budget select")).toHaveValue("THA");
  await expect(page.locator("#budget")).toContainText("태국 물가는 한국보다");
});

// 여행 품목 영역(국제항공료 · 해외단체여행비 · 3D 비행기)은 /prices 에서 /flights 로 옮김 (작업 0164 · 사용자 결정 2026-11-15)
test("메뉴 '여행 타이밍' → /flights · 여행 품목 영역은 /flights 에만 있음 (작업 0164)", async ({ page }) => {
  await page.goto("/");
  await openMenuIfCollapsed(page); // 휴대폰은 메뉴 버튼을 먼저 펼침 (작업 0168)
  await page.getByRole("banner").getByRole("navigation").getByRole("link", { name: "여행 타이밍", exact: true }).click();
  await expect(page).toHaveURL(/\/flights\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible(); // 큰 문장(작업 0170: 지수가 없으면 "준비 중")
  await page.goto("/prices");
  await expect(page.locator('[data-testid="travel-graph"]')).toHaveCount(0);
});

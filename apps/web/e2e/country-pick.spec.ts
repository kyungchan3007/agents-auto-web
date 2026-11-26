// 작업 0201 (#233) — 여행지 고르기 시트 · 여행 물가 머리 (휴대폰 + 넓은 화면) · 작업 0222: 사진이 없어져 파일 이름을 country-pick 으로, 사진 줄은 지움
// 인트로는 config 의 storageState 로 꺼져 있음 — 시트로 고른 값은 localStorage("flapfx:picked") 에 저장되어 새로고침해도 유지
import { type Page, expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";

test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
});

// 작업 0217 지적: 홈은 버튼 · 시트 없이 카드 안 칩 · 검색으로 바로 바꿈 — 시트(dialog)는 여행 물가 "다른 나라 보기"(pick-trip-other)에만 남음
const open = (page: Page) => page.getByTestId("pick-trip-other").first();
const switcher = (page: Page) => page.getByTestId("trip-switcher");
const savePicked = (page: Page, country = "JPN", city = "도쿄") => page.addInitScript(([c, t]) => localStorage.setItem("flapfx:picked", JSON.stringify({ v: 1, country: c, city: t, budget: 0 })), [country, city]);
const dialog = (page: Page) => page.getByRole("dialog", { name: "어디로 떠나세요?" });
// 홈 — 카드 안 검색 칸에 쓰고 첫 후보를 고름 (시트 없음)
const choose = async (page: Page, query: string, _optionText?: string) => {
  const box = switcher(page).getByRole("combobox", { name: "여행지 검색" });
  await box.fill(query);
  await switcher(page).getByRole("option").first().click();
};

test.describe("여행지 고르기 시트 (작업 0201)", () => {
  test("안 고른 첫 화면 — 지금 물가 문장 · 버튼이 보임", async ({ page }) => {
    await page.goto("/");
    await expect(switcher(page)).toBeVisible();
    await expect(page.getByTestId("pick-trip-open")).toHaveCount(0);
    await page.goto("/prices");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/한국보다 물가가 \d+% 낮습니다/);
  });

  test("시트 — 이름 있는 dialog · 자동완성 · 자주 가는 곳 칩 · Esc 로 닫으면 버튼으로 초점 (여행 물가 \"다른 나라 보기\")", async ({ page }) => {
    await savePicked(page);
    await page.goto("/prices");
    await open(page).click();
    const d = dialog(page);
    await expect(d).toBeVisible();
    await expect(d).toHaveAttribute("aria-modal", "true");
    expect(await d.getByTestId("pick-chip").count()).toBeGreaterThanOrEqual(6);
    const box = d.getByRole("combobox", { name: "여행지 검색" });
    await expect(box).toBeFocused();
    await box.fill("도");
    await expect(d.getByRole("option").first()).toContainText("도쿄");
    await box.press("ArrowDown");
    await expect(box).toHaveAttribute("aria-activedescendant", /.+/);
    await page.keyboard.press("Escape");
    await expect(d).toHaveCount(0);
    await expect(open(page)).toBeFocused();
  });

  test("초점이 시트 안에 갇힘 — Tab 을 여러 번 눌러도 시트 밖으로 나가지 않음", async ({ page }) => {
    await savePicked(page);
    await page.goto("/prices");
    await open(page).click();
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    }
  });

  test("도쿄 고르기 → 안내판이 바뀜 · 새로고침해도 유지", async ({ page }) => {
    await page.goto("/");
    await choose(page, "도쿄", "도쿄");
    await expect(page.locator("#board")).toContainText(/도쿄/);
    await page.reload();
    await expect(page.locator("#board")).toContainText(/도쿄/);
  });

  test("칩으로 고르기 — 방콕", async ({ page }) => {
    await page.goto("/");
    await switcher(page).getByTestId("pick-chip").filter({ hasText: "방콕" }).click(); // 시트 없이 카드 안 칩 (작업 0217 지적)
    await expect(page.locator("#board")).toContainText(/방콕/);
  });

  test("유로 나라(파리) · 환율 없는 나라(두바이)도 안내판이 그 도시로 바뀜", async ({ page }) => {
    await page.goto("/");
    await choose(page, "파리", "파리");
    await expect(page.locator("#board")).toContainText(/파리/);
    await choose(page, "두바이", "두바이");
    await expect(page.locator("#board")).toContainText(/두바이/);
  });

  test("여행 물가 — 고른 나라 문장 · '다른 나라 보기' 로 바꿈", async ({ page }) => {
    await page.goto("/");
    await choose(page, "도쿄", "도쿄");
    await page.goto("/prices");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/^일본은 한국보다 물가가 \d+% (높|낮)습니다$/);
    await page.getByTestId("pick-trip-other").click();
    await dialog(page).getByRole("combobox", { name: "여행지 검색" }).fill("방콕");
    await dialog(page).getByRole("option", { name: /방콕/ }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/^태국은 한국보다 물가가 \d+% (높|낮)습니다$/);
  });

  test("여행 물가 — 두바이처럼 자료가 없으면 지금 문장", async ({ page }) => {
    await page.goto("/");
    await choose(page, "두바이", "두바이");
    await page.goto("/prices");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/한국보다 물가가/);
  });

  test("망가진 저장 값 · 모르는 나라는 무시 — 지금 안내판(여행 물가)", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("flapfx:picked", '{"v":1,"country":"XXX","city":"없음","budget":0}'));
    await page.goto("/");
    await expect(page.locator("#board")).toContainText("이번 주 가장 싸게 갈 수 있는 곳");
    await page.goto("/prices");
  });
});

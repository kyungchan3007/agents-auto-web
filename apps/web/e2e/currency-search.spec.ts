// 작업 0192 — /currencies 통화 검색 · 자동완성 e2e (넓은 화면 · 휴대폰) · 테스트 먼저 (구현 전에는 FAIL 이 정상)
// 사용자: "통화 쪽에 검색기능도 있으면 좋을거 같아 검색기능 넣을때 자동완성 기능도 있으면 좋고"
//
// builder 가 맞출 화면 약속 (WAI-ARIA combobox · listbox · aria-activedescendant)
//   [data-testid="currency-search"]   검색창 전체 (입력 · 제안 목록 · 결과 없음 문구를 모두 안에 둠) · /currencies 와 /currencies/CODE 왼쪽 영역에 보임
//   role=combobox  입력칸 — aria-autocomplete="list" · aria-expanded(닫힘 "false" · 제안이 열리면 "true") · aria-controls=열린 listbox 의 id · aria-activedescendant=활성 option 의 id(활성 줄이 없으면 속성 없음)
//   role=listbox   제안 목록 (제안이 있을 때만) · 안의 role=option 은 최대 8줄 · 활성 줄은 aria-selected="true"
//   option 글     "JPY 엔화 · 일본 도쿄" 처럼 코드 · 통화 이름 · 맞은 나라 · 도시가 보임
//   화살표 아래 → 다음 제안 활성 · 엔터 → router.push(`/currencies/CODE`) · 마우스 클릭 · 휴대폰 터치로 고르면 같은 곳으로 · Esc → 제안 닫힘
//   결과 없음     "찾는 통화가 없습니다" + 고를 수 있는 통화 수(왼쪽 통화 목록 링크 수와 같은 값) — [data-testid="currency-search"] 안 글에 숫자로
import { type Locator, type Page, expect, test } from "@playwright/test";

const box = (page: Page) => page.getByTestId("currency-search");
const input = (page: Page) => box(page).getByRole("combobox");
const options = (page: Page) => box(page).getByRole("option");
const listLinks = (page: Page) => page.getByRole("navigation", { name: "통화 목록" }).getByRole("link");

/** 하이드레이션 전 입력이 사라질 수 있어, 제안(또는 기대하는 화면)이 보일 때까지 다시 입력 */
async function type(page: Page, text: string, ready: (page: Page) => Locator = (p) => options(p).first()): Promise<void> {
  await expect(input(page)).toBeVisible();
  await expect(async () => {
    await input(page).fill(text);
    await expect(ready(page)).toBeVisible({ timeout: 1000 });
  }).toPass({ timeout: 10_000 });
}

const isPhone = () => test.info().project.name === "휴대폰";

test.describe("통화 검색 — 콤보박스", () => {
  test("/currencies 에 검색창이 있고 닫힌 상태의 속성이 맞음", async ({ page }) => {
    await page.goto("/currencies");
    await expect(box(page)).toBeVisible();
    const c = input(page);
    await expect(c).toBeVisible();
    await expect(c).toHaveAttribute("aria-expanded", "false");
    await expect(c).toHaveAttribute("aria-autocomplete", "list");
    await expect(c).not.toHaveAttribute("aria-activedescendant", /.+/);
    await expect(page.getByRole("listbox")).toHaveCount(0);
    // 입력칸 이름이 있어 화면 읽기 프로그램이 읽을 수 있음
    await expect(c).toHaveAccessibleName(/\S/);
  });

  test("통화 상세(/currencies/USD)에서도 같은 검색창이 보임", async ({ page }) => {
    await page.goto("/currencies/USD");
    await expect(box(page)).toBeVisible();
    await expect(input(page)).toBeVisible();
  });

  test("'도쿄' 입력 → JPY 제안 · 열린 속성 · 줄에 코드 · 이름 · 나라 · 도시가 보임", async ({ page }) => {
    await page.goto("/currencies");
    await type(page, "도쿄");
    const c = input(page);
    await expect(c).toHaveAttribute("aria-expanded", "true");
    const listbox = box(page).getByRole("listbox");
    await expect(listbox).toHaveCount(1);
    const id = await listbox.getAttribute("id");
    expect(id).toBeTruthy();
    await expect(c).toHaveAttribute("aria-controls", id!);
    const jpy = options(page).filter({ hasText: "JPY" });
    await expect(jpy).toHaveCount(1);
    for (const word of ["엔화", "일본", "도쿄"]) await expect(jpy).toContainText(word);
    expect(await options(page).count()).toBeLessThanOrEqual(8);
  });

  test("화살표 아래 + 엔터 → /currencies/JPY · 활성 줄은 aria-activedescendant · aria-selected", async ({ page }) => {
    await page.goto("/currencies");
    await type(page, "도쿄");
    const c = input(page);
    await c.press("ArrowDown");
    const active = await c.getAttribute("aria-activedescendant");
    expect(active).toBeTruthy();
    const opt = page.locator(`[id="${active}"]`);
    await expect(opt).toHaveAttribute("role", "option");
    await expect(opt).toHaveAttribute("aria-selected", "true");
    await expect(opt).toContainText("JPY");
    await c.press("Enter");
    await page.waitForURL(/\/currencies\/JPY\/?$/);
  });

  test("화살표 위 · 아래로 활성 줄이 바뀜 (여러 제안 — 'u')", async ({ page }) => {
    await page.goto("/currencies");
    await type(page, "u");
    const n = await options(page).count();
    expect(n).toBeGreaterThan(1);
    expect(n).toBeLessThanOrEqual(8);
    const c = input(page);
    await c.press("ArrowDown");
    const first = await c.getAttribute("aria-activedescendant");
    await c.press("ArrowDown");
    const second = await c.getAttribute("aria-activedescendant");
    expect(first && second && first !== second).toBe(true);
    await expect(page.locator(`[id="${second}"]`)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(`[id="${first}"]`)).not.toHaveAttribute("aria-selected", "true");
    await c.press("ArrowUp");
    await expect(c).toHaveAttribute("aria-activedescendant", first!);
  });

  test("'달러' 입력 → 제안을 마우스로 누르면(휴대폰은 터치) 그 통화 상세로 감", async ({ page }) => {
    await page.goto("/currencies");
    await type(page, "달러");
    expect(await options(page).count()).toBeGreaterThan(1); // 달러를 쓰는 통화가 여럿
    const usd = options(page).filter({ hasText: "USD" });
    await expect(usd).toHaveCount(1);
    if (isPhone()) await usd.tap();
    else await usd.click();
    await page.waitForURL(/\/currencies\/USD\/?$/);
  });

  test("제안 목록이 열려도 가로로 넘치지 않고 화면 안에 있음 (휴대폰 포함)", async ({ page }) => {
    await page.goto("/currencies");
    await type(page, "u");
    await page.waitForLoadState("networkidle");
    const width = await page.evaluate(() => innerWidth);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    const b = await box(page).getByRole("listbox").boundingBox();
    expect(b).not.toBeNull();
    expect(b!.x).toBeGreaterThanOrEqual(-1);
    expect(b!.x + b!.width).toBeLessThanOrEqual(width + 1);
  });

  test("Esc 로 제안이 닫힘 · 지우면 닫힘", async ({ page }) => {
    await page.goto("/currencies");
    await type(page, "도쿄");
    const c = input(page);
    await expect(c).toHaveAttribute("aria-expanded", "true");
    await c.press("Escape");
    await expect(c).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(c).not.toHaveAttribute("aria-activedescendant", /.+/);
    expect(new URL(page.url()).pathname).toBe("/currencies"); // Esc 가 이동시키지 않음

    await type(page, "엔");
    await expect(c).toHaveAttribute("aria-expanded", "true");
    await c.fill("");
    await expect(c).toHaveAttribute("aria-expanded", "false");
    await expect(options(page)).toHaveCount(0);
  });

  test("'zzzz' → '찾는 통화가 없습니다' + 고를 수 있는 통화 수(목록 링크 수와 같음) · 제안 줄은 없음", async ({ page }) => {
    await page.goto("/currencies");
    const linkCount = await listLinks(page).count();
    expect(linkCount).toBeGreaterThan(0);
    await type(page, "zzzz", (p) => box(p).getByText("찾는 통화가 없습니다"));
    await expect(options(page)).toHaveCount(0);
    const text = (await box(page).innerText()).replace(/,/g, "");
    expect(text.match(/\d+/g) ?? []).toContain(String(linkCount)); // 숫자를 코드에 고정하지 않고 실제 목록과 맞춤
    expect(new URL(page.url()).pathname).toBe("/currencies");
  });

  test("결과 없음에서 엔터를 눌러도 이동하지 않음", async ({ page }) => {
    await page.goto("/currencies");
    await type(page, "zzzz", (p) => box(p).getByText("찾는 통화가 없습니다"));
    await input(page).press("Enter");
    await page.waitForTimeout(500);
    expect(new URL(page.url()).pathname).toBe("/currencies");
  });

  test("상세 화면에서 검색해 다른 통화로 이동", async ({ page }) => {
    await page.goto("/currencies/USD");
    await type(page, "도쿄");
    await input(page).press("ArrowDown");
    await input(page).press("Enter");
    await page.waitForURL(/\/currencies\/JPY\/?$/);
  });
});

test("인트로는 꺼져 있음 — storageState 의 flapfx:intro-off=1 (e2e 기본)", async ({ page }) => {
  await page.goto("/currencies");
  expect(await page.evaluate(() => localStorage.getItem("flapfx:intro-off"))).toBe("1");
  await expect(page.getByTestId("intro")).toHaveCount(0);
});

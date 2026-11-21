// 작업 0253 — 홈 탑승권 상자가 3초 뒤 사라짐 (기능 테스트 · 가짜 시계로 시간을 건너뜀 · 모양 값은 보지 않음)
// 약속: 버튼 data-testid="picked-pass"(aria-expanded) · 상자 aside[aria-label="탑승권"] · 3초 머문 뒤 0.5초 동안 사라지는 중 → 닫힘
// 조건: 누르면 뜬다 · 3초 뒤 없다(aria-expanded=false) · 다시 누르면 뜬다 · 떠 있는 동안 누르면 바로 닫힘
//       상자 위에 올려 두면 안 사라지고 떼면 3초를 다시 셈 · 여행지를 바꾸면 3초를 다시 셈
import { expect, test, type Page } from "@playwright/test";

const PICKED = "flapfx:picked";
const PICK_EVENT = "flapfx:intro-pick";
const STAY = 3000;
const FADE = 500;

const pass = (page: Page) => page.getByTestId("picked-pass");
const box = (page: Page) => page.getByRole("complementary", { name: "탑승권" });

async function openHome(page: Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [PICKED, JSON.stringify({ v: 1, country: "FRA", city: "파리", budget: 1000000 })] as const);
  await page.clock.install({ time: new Date("2026-11-21T10:00:00Z") });
  await page.goto("/");
  await page.clock.pauseAt(new Date("2026-11-21T10:30:00Z")); // 시계를 세워 둠 — 이후에는 runFor 로만 흐름(실제 시간에 흔들리지 않음)
  await page.clock.runFor(100); // 저장된 값을 읽는 0ms 타이머
  await expect(pass(page)).toContainText("파리");
}

test.describe("탑승권 상자 — 3초 뒤 사라짐", () => {
  test("누르면 뜬다 · 3초 뒤 없다 · 다시 누르면 뜬다", async ({ page }) => {
    await openHome(page);
    await expect(box(page)).toHaveCount(0);
    await expect(pass(page)).toHaveAttribute("aria-expanded", "false");
    await pass(page).click();
    await expect(box(page)).toHaveCount(1);
    await expect(pass(page)).toHaveAttribute("aria-expanded", "true");
    await page.clock.runFor(STAY - 200);
    await expect(box(page), "3초가 되기 전에는 떠 있음").toHaveCount(1);
    await page.clock.runFor(200 + FADE + 100);
    await expect(box(page), "3초 + 사라지는 시간 뒤에는 없음").toHaveCount(0);
    await expect(pass(page)).toHaveAttribute("aria-expanded", "false");
    await pass(page).click();
    await expect(box(page), "사라진 뒤 다시 누르면 다시 뜸").toHaveCount(1);
    await expect(pass(page)).toHaveAttribute("aria-expanded", "true");
  });

  test("떠 있는 동안 다시 누르면 바로 닫힘 (3초를 기다리지 않음)", async ({ page }) => {
    await openHome(page);
    await pass(page).click();
    await expect(box(page)).toHaveCount(1);
    await page.clock.runFor(500);
    await pass(page).click();
    await expect(box(page)).toHaveCount(0);
    await expect(pass(page)).toHaveAttribute("aria-expanded", "false");
  });

  test("상자 위에 올려 두면 안 사라지고, 떼면 3초를 처음부터 다시 셈", async ({ page }) => {
    await openHome(page);
    await pass(page).click();
    await expect(box(page)).toHaveCount(1);
    await box(page).hover();
    await page.clock.runFor(STAY * 4);
    await expect(box(page), "올려 두는 동안 계속 떠 있음").toHaveCount(1);
    await expect(pass(page)).toHaveAttribute("aria-expanded", "true");
    await page.mouse.move(720, 120);
    await page.clock.runFor(STAY - 300);
    await expect(box(page), "뗀 뒤 3초가 되기 전에는 아직 떠 있음").toHaveCount(1);
    await page.clock.runFor(300 + FADE + 100);
    await expect(box(page), "뗀 뒤 3초 + 사라지는 시간 뒤에는 없음").toHaveCount(0);
  });

  test("여행지를 바꾸면 떠 있던 상자는 그대로 두고 3초를 다시 셈", async ({ page }) => {
    await openHome(page);
    await pass(page).click();
    await expect(box(page)).toHaveCount(1);
    await page.clock.runFor(2000);
    await page.evaluate(([name, detail]) => window.dispatchEvent(new CustomEvent(name, { detail })), [PICK_EVENT, { v: 1, country: "JPN", city: "도쿄", budget: 500000 }] as const);
    await expect(pass(page)).toContainText("도쿄");
    await expect(box(page), "상자 내용이 새 여행지(예산 500,000원)로 바뀜").toContainText("500,000원");
    await page.clock.runFor(STAY - 300); // 처음 눌렀을 때부터 4.7초 — 다시 세지 않았다면 이미 없을 때
    await expect(box(page), "바꾼 뒤 3초가 되기 전에는 아직 떠 있음").toHaveCount(1);
    await page.clock.runFor(300 + FADE + 100);
    await expect(box(page), "바꾼 뒤 3초 + 사라지는 시간 뒤에는 없음").toHaveCount(0);
  });
});

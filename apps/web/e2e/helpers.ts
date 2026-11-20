// e2e 공용 도움 — 작업 0168
import { type Locator, type Page, expect } from "@playwright/test";

/**
 * React 가 이 요소를 이어받을 때까지 기다림(하이드레이션 끝) — 서버가 그린 그림 그대로인 동안에는 상태 · 크기 · 글이 나중에 바뀜 (작업 0242)
 * 느린 기기(CI)에서는 하이드레이션이 늦어 "끝남" 같은 서버 첫 그림의 값을 읽고 지나가는 흔들림이 났음 · 마지막에 두 프레임을 더 기다려 이어받은 직후의 첫 갱신까지 지나가게 함
 */
export async function hydrated(loc: Locator): Promise<void> {
  await expect.poll(() => loc.first().evaluate((el) => Object.keys(el).some((k) => k.startsWith("__reactFiber$"))), { message: "하이드레이션이 끝나기를 기다림" }).toBe(true);
  await loc.first().evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
}

/**
 * 휴대폰(메뉴 버튼이 보일 때)은 메뉴가 접혀 있음 — 버튼(aria-expanded)을 눌러 펼친 뒤에야 링크를 찾을 수 있음
 * 넓은 화면은 버튼이 안 보이므로 아무것도 안 함 · 하이드레이션 전 눌림이 무시될 수 있어 열릴 때까지 다시 누름
 */
export async function openMenuIfCollapsed(page: Page): Promise<void> {
  const button = page.getByRole("banner").getByRole("button", { name: /메뉴/ });
  if (!(await button.isVisible())) return;
  await expect(async () => {
    if ((await button.getAttribute("aria-expanded")) !== "true") await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true", { timeout: 1000 });
  }).toPass({ timeout: 10_000 });
}

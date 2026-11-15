// e2e 공용 도움 — 작업 0168
import { type Page, expect } from "@playwright/test";

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

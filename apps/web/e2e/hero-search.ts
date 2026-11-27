// 작업 0394 — hero 입력창에 처음 쓰는 검사가 하이드레이션(React 가 붙기) 전에 입력하면 입력이 사라져 제안 목록이 영영 안 뜸
//   (느린 CI 에서 country-pick · home-guide · home-pick 이 30초 시간 초과로 실패 — 로컬 CPU 6배 느리게 하면 같은 모양으로 재현됨)
//   입력창에 React 표지(__reactProps)가 붙을 때까지 기다리고 · 그래도 목록이 안 뜨면 비우고 다시 채움 (붙은 뒤에는 한 번에 됨)
import { type Locator, type Page, expect } from "@playwright/test";

export async function waitHeroHydrated(page: Page): Promise<void> {
  await page.waitForFunction(
    () => {
      const e = document.querySelector('[data-testid="hero-search"]');
      return !!e && Object.keys(e).some((k) => k.startsWith("__reactProps"));
    },
    null,
    { timeout: 60_000 },
  );
}

/** hero 입력창에 글을 넣고 `ready`(기본: 제안 목록)가 뜰 때까지 — 하이드레이션 전 입력이 사라져도 다시 넣음 */
export async function typeHero(page: Page, text: string, ready?: Locator): Promise<void> {
  await waitHeroHydrated(page);
  const input = page.getByTestId("hero-search");
  const target = ready ?? page.getByRole("listbox");
  await expect(async () => {
    await input.fill("");
    await input.fill(text);
    await expect(target.first()).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 40_000 });
}

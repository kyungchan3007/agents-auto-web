// e2e 공용 도움 — 작업 0168 · 0312 에 어드민 앱이 쓰는 것만 (운영 apps/web/e2e/helpers.ts 와 같은 함수)
import { type Locator, expect } from "@playwright/test";

/** React 가 이 요소를 이어받을 때까지 기다림(하이드레이션 끝) — 마지막에 두 프레임을 더 기다려 이어받은 직후의 첫 갱신까지 지나가게 함 (작업 0242) */
export async function hydrated(loc: Locator): Promise<void> {
  await expect.poll(() => loc.first().evaluate((el) => Object.keys(el).some((k) => k.startsWith("__reactFiber$"))), { message: "하이드레이션이 끝나기를 기다림" }).toBe(true);
  await loc.first().evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
}

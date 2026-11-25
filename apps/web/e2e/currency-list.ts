// 작업 0365 — 통화 상세에서 둘러보기 표가 사라져, 통화 목록은 "다른 나라 통화 보기" 사이드바 목록(서버 첫 그림 HTML 에 미리 그려져 있음)에서 읽음
//   data-testid: currency-more(버튼) · currency-sidebar(사이드바) · currency-side-list(목록 ul) · currency-side-row(줄 = 줄 전체 a[href="/currencies/코드"])
import { type Page, expect } from "@playwright/test";

export const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
export const codeOf = (href: string | null) => (href ?? "").replace(/\/+$/, "").split("/").pop() ?? "";
/** 닫혀 있어도 HTML 에 있는 사이드바 목록 링크 */
export const sideLinks = (page: Page) => tid(page, "currency-side-list").locator("a[href^='/currencies/']");
export const listCodes = async (page: Page) => (await sideLinks(page).evaluateAll((as) => as.map((a) => a.getAttribute("href")))).map(codeOf);
export const listLink = (page: Page, code: string) => tid(page, "currency-side-list").locator(`a[href^="/currencies/${code}"]`);

/** 사이드바 열기: 하이드레이션 전 클릭이 사라질 수 있어 보일 때까지 다시 누름 · DOM 클릭이라 스크롤을 건드리지 않음 */
export async function openSide(page: Page) {
  const more = tid(page, "currency-more");
  await expect(more).toBeVisible();
  await expect(async () => {
    if ((await more.getAttribute("aria-expanded")) !== "true") await more.evaluate((el) => (el as HTMLElement).click());
    await expect(tid(page, "currency-sidebar")).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 10_000 });
}
/** 사이드바를 열고 그 통화 줄을 누름 */
export async function pickFromList(page: Page, code: string) {
  await openSide(page);
  await listLink(page, code).click();
}

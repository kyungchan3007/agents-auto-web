// 작업 0290(56번) — 여행 타이밍 선 그래프(국제항공료 · 해외단체여행비 지수와 환율) 왼쪽 눈금: 휴대폰(그래프 폭 560 미만)에서는 원 눈금(1,310원 ~ 1,530원)을 그리지 않고 지수(100 ~ 160)만 둠 · 왼쪽 여백 60 → 48
//   넓은 화면은 지금 그대로(지수 + 원 눈금 일곱 개 · 왼쪽 여백 62) (사용자: "56번은 휴대폰만 수정") · 선 끝 이름표 · 범례는 그대로
//   두 프로젝트에서 돌며 폭은 테스트 안에서 정함
import { type Page, expect, test } from "@playwright/test";

async function axis(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/flights");
  await page.waitForLoadState("networkidle");
  const svg = page.locator('svg[data-testid="line-chart"]').first();
  test.skip((await svg.count()) === 0, "지수 자료 없음");
  await svg.scrollIntoViewIfNeeded();
  await expect(svg, "그래프가 끝까지 그려짐").toHaveAttribute("data-state", "done", { timeout: 15000 });
  return svg.evaluate((root) => ({
    ticks: Array.from(root.querySelectorAll('[data-testid="chart-axis"] text')).map((t) => (t.textContent ?? "").trim()),
    gridLeft: Math.min(...Array.from(root.querySelectorAll('[data-testid="chart-grid"] line')).map((l) => Number(l.getAttribute("x1")))),
    width: root.getBoundingClientRect().width,
    label: root.parentElement?.innerText ?? "",
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));
}
const isWon = (t: string) => /원$/.test(t);
const isIndex = (t: string) => /^\d{2,3}$/.test(t);

test.describe("선 그래프 눈금 — 휴대폰만 지수만 (작업 0290)", () => {
  test("휴대폰 390 — 왼쪽 눈금은 지수만(원 눈금 없음) · 왼쪽 여백 48 · 가로 넘침 0", async ({ page }) => {
    const a = await axis(page, 390);
    expect(a.ticks.filter(isWon), "휴대폰의 원 눈금").toEqual([]);
    expect(a.ticks.filter(isIndex).length, "지수 눈금 수").toBeGreaterThanOrEqual(5);
    expect(a.gridLeft, "왼쪽 여백").toBe(48);
    expect(a.overflow, "가로 넘침").toBeLessThanOrEqual(0);
  });

  test("휴대폰 폭이 560 바로 아래(559)여도 지수만 · 560 이상은 원 눈금도 있음(경계)", async ({ page }) => {
    const small = await axis(page, 559);
    expect(small.width, "그래프 폭").toBeLessThan(560);
    expect(small.ticks.filter(isWon), "그래프 폭 560 미만의 원 눈금").toEqual([]);
    const big = await axis(page, 700);
    expect(big.width, "그래프 폭").toBeGreaterThanOrEqual(560);
    expect(big.ticks.filter(isWon).length, "그래프 폭 560 이상의 원 눈금").toBeGreaterThanOrEqual(5);
  });

  test("넓은 화면 1280 — 지금 그대로: 지수 + 원 눈금 일곱 개 · 왼쪽 여백 62", async ({ page }) => {
    const a = await axis(page, 1280);
    expect(a.ticks.filter(isIndex).length, "지수 눈금 수").toBeGreaterThanOrEqual(5);
    expect(a.ticks.filter(isWon).length, "원 눈금 수").toBe(7);
    expect(a.gridLeft, "왼쪽 여백").toBe(62);
  });
});

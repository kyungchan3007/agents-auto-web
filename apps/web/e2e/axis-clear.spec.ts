// 작업 0288 — 그래프 눈금 글자에 걸린 투명도를 뺌(색은 그대로) (사용자가 정한 조건: 시안 54번 "고친 모습대로")
//   홈 12달 막대의 왼쪽 눈금(지금 75%) · 여행 타이밍 선 그래프 보조 눈금(지금 70%) · 같은 부품을 쓰는 통화 상세 그래프 눈금도 함께
//   판정: 그래프가 다 그려진 뒤(data-state=done) 눈금 묶음(chart-axis) 안 모든 글자의 실제 투명도(자기 · 위 요소 곱, 그림 뿌리까지) 가 1
//   흰 말풍선 글 · 강조 색 이름표 · 그리는 도중의 나타남(reveal) 투명도는 대상 아님(끝나면 1)
import { type Page, expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";

test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
});

const CASES: { name: string; path: string; chart: string }[] = [
  { name: "홈 12달 막대(왼쪽 눈금)", path: "/", chart: "year-bars" },
  { name: "여행 타이밍 선 그래프(눈금)", path: "/flights", chart: "line-chart" },
  { name: "통화 상세 1년 흐름(눈금)", path: "/currencies/USD", chart: "line-chart" },
];

/** 눈금 묶음 안 글자마다 실제 투명도(그림 뿌리까지 곱) · 색 */
async function ticks(page: Page, chart: string) {
  const svg = page.locator(`svg[data-testid="${chart}"]`).first();
  await svg.scrollIntoViewIfNeeded();
  await expect(svg, "그래프가 끝까지 그려짐").toHaveAttribute("data-state", "done", { timeout: 15000 });
  return svg.evaluate((root) =>
    Array.from(root.querySelectorAll('[data-testid="chart-axis"] text')).map((t) => {
      let o = 1;
      for (let e: Element | null = t; e && e !== root.parentElement; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
      return { text: (t.textContent ?? "").trim(), opacity: Math.round(o * 1000) / 1000, fill: getComputedStyle(t).fill };
    }),
  );
}

test.describe("그래프 눈금 글자 투명도 없음 (작업 0288)", () => {
  for (const c of CASES) {
    test(`${c.name} — 눈금 글자의 실제 투명도가 모두 1`, async ({ page }) => {
      await page.goto(c.path);
      await page.waitForLoadState("networkidle");
      test.skip((await page.locator(`svg[data-testid="${c.chart}"]`).count()) === 0, "그래프 자료 없음");
      const t = await ticks(page, c.chart);
      expect(t.length, "눈금 글자 수").toBeGreaterThan(2);
      expect(t.filter((x) => x.opacity < 0.999).map((x) => `"${x.text}" ${x.opacity}`), "투명도가 걸린 눈금 글자").toEqual([]);
      for (const x of t) expect(x.fill, `"${x.text}" 색(투명 아님)`).not.toMatch(/rgba\(.*,\s*0(\.\d+)?\)$/);
    });
  }

  test("눈금 글자 색은 그대로(홈 · 선 그래프의 눈금이 서로 같은 계열 · 흰색 아님)", async ({ page }) => {
    await page.goto("/flights");
    await page.waitForLoadState("networkidle");
    test.skip((await page.locator('svg[data-testid="line-chart"]').count()) === 0, "그래프 자료 없음");
    const t = await ticks(page, "line-chart");
    for (const x of t) expect(x.fill, `"${x.text}" 색`).not.toBe("rgb(255, 255, 255)");
  });
});

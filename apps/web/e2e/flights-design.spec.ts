// 작업 0211 (#250) — /flights: 싼 달이 같으면 한 번만 · 3D 비행기가 서는 자리를 이름표가 피함
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);

test.describe("/flights 디자인 (작업 0211)", () => {
  test("큰 문장 · 카드 — 싼 달이 같으면 한 번만 · 다르면 둘 다 (지금 자료에 따라)", async ({ page }) => {
    await page.goto("/flights");
    const h1 = ((await page.getByRole("heading", { level: 1 }).innerText()) ?? "").replace(/\s+/g, " ");
    // 작업 0218: 가장 싼 달 카드는 작은 글자판 — 화면 읽기 이름 "가장 싼 달 11월" 에서 읽음
    const cardLabel = (await tid(page, "cheap-board").getByTestId("flap-board").getAttribute("aria-label")) ?? "";
    const value = cardLabel.replace(/^가장 싼 달 /, "").trim();
    const same = h1.match(/^항공료 · 단체여행 모두 (\d+)월이 싼 편$/);
    if (same) {
      expect(value).toBe(`${same[1]}월`);
    } else {
      const two = h1.match(/^항공료는 (\d+)월, 단체여행은 (\d+)월이 싼 편$/);
      expect(two, `문장 모양: ${h1}`).not.toBeNull();
      expect(two?.[1]).not.toBe(two?.[2]); // 같은데 둘로 쓰지 않음
      expect(value).toBe(`${two?.[1]}월 · ${two?.[2]}월`);
    }
  });

  test("'최저' 꼬리표가 노란 점 · 끝 말풍선 · 최고 꼬리표를 가리지 않고 그래프 안에 있음 (작업 0218 그래프 2D)", async ({ page }) => {
    await page.goto("/flights");
    await page.waitForTimeout(600);
    const chart = page.locator('[data-testid="travel-graph"] [data-testid="line-chart"]');
    await chart.scrollIntoViewIfNeeded();
    await page.waitForTimeout(5500);
    const min = chart.locator('[data-testid="chart-mark"][data-kind="min"]');
    await expect(min).toBeVisible();
    const mb = await min.boundingBox();
    const svg = await chart.boundingBox();
    if (!mb || !svg) throw new Error("화면에 없음");
    expect(mb.x).toBeGreaterThanOrEqual(svg.x - 1);
    expect(mb.x + mb.width).toBeLessThanOrEqual(svg.x + svg.width + 1);
    expect(mb.y + mb.height).toBeLessThanOrEqual(svg.y + svg.height + 1);
    const others = chart.locator('[data-testid="chart-end-bubble"], [data-testid="chart-mark"][data-kind="max"]');
    for (let i = 0; i < (await others.count()); i++) {
      const o = await others.nth(i).boundingBox();
      if (!o) continue;
      const hit = mb.x < o.x + o.width && o.x < mb.x + mb.width && mb.y < o.y + o.height && o.y < mb.y + mb.height;
      expect(hit, `최저 꼬리표가 ${i + 1}번째 말풍선 · 꼬리표와 겹침`).toBe(false);
    }
  });
});

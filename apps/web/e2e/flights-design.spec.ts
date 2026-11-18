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

  test("'최저' 이름표가 비행기가 서는 자리(가장 싼 달 점 왼쪽)를 가리지 않음", async ({ page }) => {
    await page.goto("/flights");
    await page.waitForTimeout(600);
    const label = tid(page, "extreme-min");
    await expect(label).toBeVisible();
    const lb = await label.boundingBox();
    const dot = await page.locator("[data-testid=travel-graph] svg circle[fill='var(--hav-sun)']").boundingBox();
    const svg = await page.locator("[data-testid=travel-graph] svg").first().boundingBox();
    if (!lb || !dot || !svg) throw new Error("화면에 없음");
    const s = svg.width / 1000;
    const cx = dot.x + dot.width / 2;
    const cy = dot.y + dot.height / 2;
    // 비행기 칸 — flights-graph-view 의 planeAvoidBox 와 같은 비율 (점 왼쪽)
    const plane = { left: cx - 150 * s, right: cx - 20 * s, top: cy - 40 * s, bottom: cy + 30 * s };
    const overlap = lb.x < plane.right && plane.left < lb.x + lb.width && lb.y < plane.bottom && plane.top < lb.y + lb.height;
    expect(overlap, "이름표와 비행기 칸이 겹침").toBe(false);
    // 노란 점도 가리지 않음
    const hitDot = lb.x < dot.x + dot.width && dot.x < lb.x + lb.width && lb.y < dot.y + dot.height && dot.y < lb.y + lb.height;
    expect(hitDot, "이름표가 노란 점을 가림").toBe(false);
  });
});

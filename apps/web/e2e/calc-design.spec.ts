// 작업 0208 (#247) — 직구 계산 디자인 검사 지적: 휴대폰 결과 요약 줄 · 결과 카드 아래 빈칸 없음 · 한도 안/밖 줄 위치 같음 · 과세환율 칸 짧게 · 수입물가 그래프 높이
import { type Locator, type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const box = async (loc: Locator) => {
  const b = await loc.boundingBox();
  if (!b) throw new Error("화면에 없음");
  return b;
};
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const setPrice = async (page: Page, v: string) => {
  await page.locator("#price").fill(v);
  await expect(page.locator("#price")).toHaveValue(v);
};

test.describe("직구 계산 디자인 (작업 0208)", () => {
  test("휴대폰 — 폼 위 결과 요약 한 줄이 첫 화면 안에 있고 · 값을 바꿔도 높이가 같음 · 넓은 화면에는 없음", async ({ page }) => {
    await page.goto("/calc");
    const line = tid(page, "calc-summary");
    if (!isPhone(page)) {
      await expect(line).toBeHidden();
      return;
    }
    await expect(line).toBeVisible();
    await expect(line).toContainText("면세 한도 안");
    const a = await box(line);
    expect(a.y + a.height).toBeLessThanOrEqual(page.viewportSize()?.height ?? 0);
    const form = await box(tid(page, "calc-input"));
    expect(a.y + a.height).toBeLessThanOrEqual(form.y + 1); // 폼 위
    await setPrice(page, "201");
    await expect(line).toContainText("관세율을 넣으면 합계"); // 작업 0296: 한도 넘음 · 관세율 없음 = '물건 값 N원 · 관세율을 넣으면 합계'
    const b = await box(line);
    expect(Math.abs(b.height - a.height)).toBeLessThan(1);
    expect(Math.abs(b.y - a.y)).toBeLessThan(1);
    await setPrice(page, "abc");
    expect(Math.abs((await box(line)).height - a.height)).toBeLessThan(1);
  });

  test("결과 카드 안 줄 위치 — 200 → 201 로 바꿔도 같은 자리 · 아래 칸 위치도 같음", async ({ page }) => {
    await page.goto("/calc");
    const card = tid(page, "calc-result");
    const rows = card.locator("dl > div");
    const spots = async () => {
      const top = (await box(card)).y;
      const n = await rows.count();
      const ys: number[] = [];
      for (let i = 0; i < n; i++) ys.push(Math.round((await box(rows.nth(i))).y - top));
      return { n, ys, below: Math.round((await box(tid(page, "import-price-section"))).y - top) };
    };
    await setPrice(page, "200");
    await expect(card).toContainText("면세 한도");
    const inside = await spots();
    await setPrice(page, "201");
    await expect(card).toContainText("세금 붙음");
    const outside = await spots();
    expect(inside.n).toBe(6);
    expect(outside.n).toBe(inside.n);
    expect(outside.ys).toEqual(inside.ys);
    expect(Math.abs(outside.below - inside.below)).toBeLessThanOrEqual(1);
  });

  test("휴대폰 — 결과 카드 아래에 빈칸이 남지 않음 (마지막 글 아래 여백은 카드 안쪽 여백 정도) @design", async ({ page }) => {
    test.skip(!isPhone(page), "휴대폰 전용");
    await page.goto("/calc");
    const card = await box(tid(page, "calc-result"));
    const note = await box(tid(page, "calc-result").getByText("예상 금액입니다. 실제 세금은 통관 때 정해집니다."));
    expect(card.y + card.height - (note.y + note.height)).toBeLessThanOrEqual(72); // 카드 최소 높이가 글보다 클 수 있어 안쪽 여백(24px) + 여분 한 줄(48px)까지 — 크기 안정(0208)으로 최소 높이는 '적용 환율' 글이 두 줄인 때 기준이라 실제 자료(한 줄)에서는 64px (운영 /calc 412폭 실측 64.2 · 작업 0226 gate 실패 확인)
  });

  test("넓은 화면 — 과세환율 칸은 기록이 2주 미만이면 짧음 · 수입물가 그래프 높이(시안 F: 넓은 화면 380px · 휴대폰 300px — 약간의 여유를 둠) @design", async ({ page }) => {
    await page.goto("/calc");
    const chart = await box(tid(page, "import-chart"));
    if (isPhone(page)) {
      expect(chart.height).toBeGreaterThanOrEqual(260);
      expect(chart.height).toBeLessThan(340);
    } else {
      expect(chart.height).toBeGreaterThanOrEqual(360);
      expect(chart.height).toBeLessThanOrEqual(460);
    }
    const customs = tid(page, "customs-section");
    const hasGraph = (await customs.getByRole("img").count()) > 0;
    if (!hasGraph) {
      // 작업 0282: 기록이 2주 미만이면 "기록이 2주 미만이라 …" 안내 줄을 두지 않음(주별 그래프만 없음) · 지운 자리에 빈 틈이 남지 않음
      await expect(tid(page, "customs-short-note")).toHaveCount(0);
      expect((await box(customs)).height).toBeLessThanOrEqual(isPhone(page) ? 240 : 180);
    }
  });
});

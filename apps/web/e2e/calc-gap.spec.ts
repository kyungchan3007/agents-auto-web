// 작업 0208 추가 (#255) — 직구 입력 칸 "안내 문구 아래 빈칸" 줄이기: 안내 · 오류 자리를 두 줄(2.75rem)에서 한 줄 높이로 · 오류가 떠도 입력 칸 높이는 같음(0200) · 결과 카드 최소 높이 408px 그대로
import { type Locator, type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const box = async (loc: Locator) => {
  const b = await loc.boundingBox();
  if (!b) throw new Error("화면에 없음");
  return b;
};
const fill = async (page: Page, id: string, v: string) => {
  await page.locator(`#${id}`).fill(v);
  await expect(page.locator(`#${id}`)).toHaveValue(v);
};

test.describe("직구 입력 안내 아래 빈칸 (작업 0208 추가)", () => {
  // 작업 0250 — 안내 아래 ~ 보내는 곳 간격의 정확한 값(20px 이하 · 0245 · 2번이 입력 카드를 늘리며 달라짐)은 걷어 냄 · 남긴 것: 안내 자리는 한 줄 높이(오류가 떠도 밀리지 않는 조건) · 보내는 곳이 안내 아래에 놓이고 겹치지 않음
  test("물건 값 안내 문구는 한 줄 높이 자리 · 보내는 곳 이름표는 그 아래에 겹치지 않고 놓임", async ({ page }) => {
    await page.goto("/calc");
    const hint = page.locator('form[data-testid="calc-input"] label[for="price"]').locator("xpath=../..").locator("p").last();
    const hb = await box(hint);
    expect(hb.height, "안내 자리 높이").toBeLessThanOrEqual(24);
    const routeLabel = await box(page.locator("#route-label")); // 작업 0221: 보내는 곳이 두 줄 선택지(라디오 그룹)가 되어 이름표는 #route-label
    expect(routeLabel.y - (hb.y + hb.height), "안내 아래 ~ 보내는 곳(겹치지 않음)").toBeGreaterThanOrEqual(0);
  });

  for (const width of [390, 700, 1000, 1280]) {
    test(`오류가 떠도 입력 칸 높이가 같음 · 결과 카드는 최소 높이 이상 (폭 ${width})`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/calc");
      await page.waitForTimeout(300);
      // 입력 칸(form) 높이는 오류가 떠도 같아야 함(작업 0200 규칙) · 결과 카드는 글만큼 자라는 최소 높이 408px 칸이라 상태마다 조금 다를 수 있음(한도 안 409 · 중간 폭 414 등 — 작업 0208 lead 결정) → 408 이상만 확인
      const heights = async () => ({ form: Math.round((await box(tid(page, "calc-input"))).height), result: Math.round((await box(tid(page, "calc-result"))).height) });
      const same = (a: { form: number; result: number }, b: { form: number; result: number }) => a.form === b.form && a.result >= 407.5 && b.result >= 407.5;
      const base = await heights();
      await fill(page, "price", "abc");
      expect(same(await heights(), base), "물건 값 오류").toBe(true);
      await fill(page, "price", "180");
      await fill(page, "shipping", "xyz");
      expect(same(await heights(), base), "배송비 오류").toBe(true);
      await fill(page, "shipping", "");
      await fill(page, "duty", "200");
      expect(same(await heights(), base), "관세율 오류").toBe(true);
    });
  }

  test("결과 카드 최소 높이 그대로 (첫 화면 · 오류가 있어도) — 세관 꼬리표 크기 (작업 0221 · 예전 408px) @design", async ({ page }) => {
    await page.goto("/calc");
    await page.waitForTimeout(300);
    const wide = (page.viewportSize()?.width ?? 0) >= 1024;
    // 꼬리표(남색 결론 + 영수증 내역)가 나온 상태 높이 — 값이 바뀌어도 이 높이 아래로 줄지 않음 · 좁은 폭(427px 이하)은 내역 줄이 줄바꿈돼 폭 구간별 실측 높이(작업 0221 사용자 지적)
    const w = page.viewportSize()?.width ?? 0;
    const min = wide ? 580.8 : w <= 427 ? (w >= 400 ? 596 : w >= 361 ? 616 : w >= 330 ? 660 : 680) : 576;
    const h = (await box(tid(page, "calc-result"))).height;
    expect(h).toBeGreaterThanOrEqual(min - 0.5);
    expect(h).toBeLessThanOrEqual(min + 8);
    await fill(page, "price", "abc");
    expect((await box(tid(page, "calc-result"))).height).toBeGreaterThanOrEqual(min - 0.5);
  });
});

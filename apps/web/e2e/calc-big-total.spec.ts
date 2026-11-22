// 작업 0291 — 직구 결과 카드 큰 숫자 = "모두 합쳐 예상"(합계) · 오른쪽 위 흰 점 삭제 (사용자가 정한 조건: 시안 58번 "다 수정")
//   한도 안: 합계 = 물건 값이라 지금과 똑같음 · 한도 초과 + 관세율: 큰 숫자 = 합계(예: 400달러 · 관세율 8% → 532,320원 → 632,396원)
//   한도 초과 + 관세율 없음(합계를 못 구함): 지금 동작 그대로 물건 값(사용자 결정 대기 · 지어낸 합계가 아님) — 결정이 나면 이 한 검사를 바꿈
//   휴대폰 긴 금액 줄이기(12자 넘으면 28px)는 합계 기준 · 값이 바뀌어도 아래 칸이 밀리지 않음(작업 0208) · 가로 넘침 0
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const slot = (page: Page, s: string) => page.locator(`[data-testid="calc-result"] [data-testid="rolling-number"][data-slot="${s}"]`);

async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/calc");
  test.skip((await tid(page, "calc-limit-fill").count()) === 0, "환율 자료 없음");
}
async function set(page: Page, price: string, duty: string) {
  await page.locator("#currency").selectOption("USD");
  await page.locator("#price").fill(price);
  await page.locator("#duty").fill(duty);
  // 굴러가는 숫자가 멈출 때까지(모든 숫자 부품이 idle)
  await expect.poll(async () => page.locator('[data-testid="calc-result"] [data-testid="rolling-number"][data-state="rolling"]').count(), { timeout: 8000 }).toBe(0);
}
const val = async (page: Page, s: string) => {
  const e = slot(page, s);
  return (await e.count()) ? Number(await e.first().getAttribute("data-value")) : null;
};

for (const width of [1280, 390]) {
  test.describe(`직구 큰 숫자 = 합계 (작업 0291 · ${width})`, () => {
    test("한도 안 — 큰 숫자 = 물건 값 = 합계(지금과 같음)", async ({ page }) => {
      await open(page, width);
      await set(page, "100", "");
      const big = await val(page, "big");
      expect(big).not.toBeNull();
      expect(big, "큰 숫자 = 물건 값").toBe(await val(page, "price"));
      expect(big, "큰 숫자 = 합계").toBe(await val(page, "total"));
      await expect(tid(page, "calc-tag-top")).toContainText("면세 한도 안");
    });

    test("한도 초과 + 관세율 8% — 큰 숫자 = 합계(물건 값이 아님) · 합계 = 과세 가격 + 관세 + 부가세", async ({ page }) => {
      await open(page, width);
      await set(page, "400", "8");
      const [big, total, price, taxable, duty, vat] = await Promise.all(["big", "total", "price", "taxable", "duty", "vat"].map((s) => val(page, s)));
      expect(big, "큰 숫자 = 합계").toBe(total);
      expect(big, "물건 값이 아님").not.toBe(price);
      expect(big!, "합계가 물건 값보다 큼").toBeGreaterThan(price!);
      expect(Math.abs(total! - (taxable! + duty! + vat!)), "합계 = 과세 가격 + 관세 + 부가세").toBeLessThanOrEqual(3);
      expect(await slot(page, "big").first().getAttribute("data-final"), "보이는 글").toBe(`${big!.toLocaleString("en-US")}원`);
    });

    test("한도 초과 + 관세율 없음(합계를 못 구함) — 지금처럼 물건 값 · 숫자를 지어내지 않음(결정 대기)", async ({ page }) => {
      await open(page, width);
      await set(page, "400", "");
      expect(await val(page, "total"), "합계 칸 없음").toBeNull();
      expect(await val(page, "big"), "큰 숫자 = 물건 값(지금 동작)").toBe(await val(page, "price"));
    });

    test("카드 오른쪽 위 흰 점 없음 — 결론 카드 안에 12px 동그라미(절대 위치)가 없음", async ({ page }) => {
      await open(page, width);
      await set(page, "400", "8");
      const dots = await tid(page, "calc-tag-top").evaluate((root) => Array.from(root.querySelectorAll("*")).filter((e) => {
        const cs = getComputedStyle(e), r = e.getBoundingClientRect();
        return cs.position === "absolute" && r.width > 0 && Math.abs(r.width - 12) < 1 && Math.abs(r.height - 12) < 1 && parseFloat(cs.borderTopLeftRadius) >= 6;
      }).length);
      expect(dots, "흰 점").toBe(0);
    });

    test("값이 바뀌어도 아래 칸이 밀리지 않음 — 한도 안 · 합계 · 합계 못 구함 · 아주 긴 금액에서 결론 카드 높이 · 아래 칸 거리가 같음 · 가로 넘침 0", async ({ page }) => {
      await open(page, width);
      const rows: { top: number; below: number; overflow: number }[] = [];
      for (const [p, d] of [["100", ""], ["400", "8"], ["400", ""], ["999999", "8"]] as const) {
        await set(page, p, d);
        rows.push(await page.evaluate(() => {
          const top = document.querySelector('[data-testid="calc-tag-top"]') as HTMLElement, bot = document.querySelector('[data-testid="calc-tag-bottom"]') as HTMLElement;
          const tb = top.getBoundingClientRect(), bb = bot.getBoundingClientRect();
          return { top: Math.round(tb.height * 10) / 10, below: Math.round((bb.top - tb.top) * 10) / 10, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        }));
      }
      for (const r of rows) {
        expect(Math.abs(r.top - rows[0].top), `결론 카드 높이 ${r.top} (처음 ${rows[0].top})`).toBeLessThanOrEqual(1);
        expect(Math.abs(r.below - rows[0].below), `아래 칸 거리 ${r.below} (처음 ${rows[0].below})`).toBeLessThanOrEqual(1);
        expect(r.overflow, "가로 넘침").toBeLessThanOrEqual(0);
      }
    });
  });
}

test("휴대폰 긴 금액 줄이기는 합계 기준 — 물건 값은 12자 이하여도 합계가 13자면 28px", async ({ page }) => {
  await open(page, 390);
  await set(page, "700000", "8"); // 물건 값 약 9.3억(12자) · 합계 약 11억(13자) — 환율에 따라 달라지므로 아래에서 조건을 확인
  const price = await slot(page, "price").first().getAttribute("data-final");
  const big = await slot(page, "big").first().getAttribute("data-final");
  test.skip(!price || !big || price.length > 12 || big.length <= 12, `물건 값 ${price} · 합계 ${big} — 이 환율에서는 두 글자 수가 12 를 가르지 않음`);
  const fs = await slot(page, "big").first().evaluate((e) => getComputedStyle(e).fontSize);
  expect(fs, "합계(13자)에 맞춰 28px").toBe("28px");
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "가로 넘침").toBeLessThanOrEqual(0);
});

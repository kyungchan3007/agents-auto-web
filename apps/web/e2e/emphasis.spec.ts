// 제목 속 숫자 · 금액 강조 — 작업 0175 세 번째 묶음 · 실행은 lead 가 PR 직전에
// 하늘 종이 위: 글자색 그대로 + 해 노랑(#F7C548) 형광펜 띠 · 비쌈 뜻은 주홍(#C13A22) 글자 · 바다 띠 · 울트라마린 막 위는 해 노랑 글자
//   표시: data-testid="emph" · data-tone · data-bg — packages/ui text/emph.tsx
import { type Page, expect, test } from "@playwright/test";

const SUN = "rgb(247, 197, 72)"; // #F7C548
const VERMILION = "rgb(193, 58, 34)"; // #C13A22
const css = (el: import("@playwright/test").Locator) => el.first().evaluate((e) => ({ color: getComputedStyle(e).color, image: getComputedStyle(e).backgroundImage }));

async function fillCalc(page: Page, price: string, duty?: string) {
  const input = page.locator('[data-testid="calc-input"]');
  await input.getByLabel(/물건 값/).fill(price);
  if (duty) await input.getByLabel(/관세율/).fill(duty);
}

test("여행 물가 — 큰 문장의 퍼센트(63% 같은)에 노란 형광펜 띠 · 글자색은 그대로", async ({ page }) => {
  await page.goto("/prices");
  const emph = page.getByRole("heading", { level: 1 }).locator('[data-testid="emph"]');
  if ((await emph.count()) === 0) test.skip(true, "물가 자료가 없어 큰 문장에 숫자가 없음");
  await expect(emph.first()).toHaveText(/\d+%/);
  await expect(emph.first()).toHaveAttribute("data-bg", "light");
  const s = await css(emph);
  expect(s.image).toContain("linear-gradient");
  expect(s.image).toContain(SUN);
  expect(s.color).not.toBe(SUN); // 노란 글자는 하늘 종이 위 대비 부족 — 글자색은 그대로
});

// 직구 맨 위는 사진 위 울트라마린 막(흰 글자) — 어두운 바탕이라 숫자는 노란 띠가 아니라 해 노랑 글자 (작업 0175 · lead 결정)
//   비쌈 뜻(세금이 붙음)도 같은 노란 글자 — 주홍(#C13A22)은 울트라마린(#2438A8) 위 대비가 3 미만이라 읽히지 않음 (contrast.test.ts)
test("직구 — 울트라마린 막 위 '$180' 은 해 노랑 글자(띠 아님) · 세금이 붙어도 금액은 노란 글자", async ({ page }) => {
  await page.goto("/calc");
  await fillCalc(page, "180");
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toContainText("세금 없이 받습니다");
  const first = h1.locator('[data-testid="emph"]').first();
  await expect(first).toHaveText(/180/);
  const a = await css(first);
  expect(a.color).toBe(SUN);
  expect(a.image).not.toContain("linear-gradient");
  await fillCalc(page, "250", "8");
  await expect(h1).toContainText(/관세 · 부가세 약 [\d,]+원이 붙습니다/);
  const money = h1.locator('[data-testid="emph"]').first();
  await expect(money).toHaveAttribute("data-tone", "expensive");
  const b = await css(money);
  expect(b.color).toBe(SUN); // 주홍이 아니라 노란 글자 — 울트라마린 위에서 읽히게
  expect(b.color).not.toBe(VERMILION);
  expect(b.image).not.toContain("linear-gradient");
});

test("홈 여행 타이밍 · /flights — 제목 속 달 숫자(4월 같은)가 강조", async ({ page }) => {
  for (const path of ["/", "/flights"]) {
    await page.goto(path);
    const emph = page.getByRole("heading", { level: 1 }).locator('[data-testid="emph"]');
    if ((await emph.count()) === 0) continue; // 지수가 없으면 숫자 없는 문장 — 강조할 것이 없음
    await expect(emph.first()).toHaveText(/\d+월/);
    expect((await css(emph)).image).toContain(SUN);
  }
});

test("홈 바다 띠 — 문장 속 숫자는 해 노랑 글자(띠 위 · 형광펜 아님)", async ({ page }) => {
  await page.goto("/");
  const emph = page.locator("#today").locator('[data-testid="emph"]');
  const n = await emph.count();
  for (let i = 0; i < n; i++) {
    await expect(emph.nth(i)).toHaveAttribute("data-bg", "sea");
    const s = await css(emph.nth(i));
    expect(s.color).toBe(SUN);
    expect(s.image).not.toContain("linear-gradient");
  }
});

test("작업실 · 통화 · GEO 같은 화면의 큰 제목은 숫자가 없으면 강조 부품이 없음 (없는 숫자를 칠하지 않음)", async ({ page }) => {
  await page.goto("/log");
  await expect(page.getByRole("heading", { level: 1 }).locator('[data-testid="emph"]')).toHaveCount(0);
});

// 작업 0221 사용자 지적 — 직구 계산 제목을 짧게 한 줄 · 넓은 화면 제목 자리 한 줄 (사용자: "여기 여백이 너무큰데? 시안은 여백이 적당한데" → "짧게 한 줄") · 테스트 먼저
//   넓은 화면(1024 · 1280)에서 모든 제목 문장이 한 줄 · 제목 아래 여백 약 46px · 640~1023 · 휴대폰은 필요한 줄 수 · 0208 크기 고정(카드 · 아래 구간 ±1px)은 모든 폭에서 유지
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`).first();
const absY = (page: Page, id: string) => page.evaluate((i) => (document.querySelector(`[data-testid="${i}"]`) as HTMLElement).getBoundingClientRect().top + scrollY, id);
const lines = (page: Page) =>
  page.getByRole("heading", { level: 1 }).evaluate((h) => {
    const r = document.createRange();
    r.selectNodeContents(h);
    return new Set([...r.getClientRects()].filter((x) => x.width > 2).map((x) => Math.round(x.top / 8))).size;
  });
const fill = async (page: Page, price: string, duty = "", route: "미국" | "그 밖" = "미국", currency = "USD") => {
  await page.locator("#currency").selectOption(currency);
  await page.getByRole("radiogroup", { name: "보내는 곳" }).getByRole("radio").nth(route === "미국" ? 0 : 1).check();
  await page.locator("#price").fill(price);
  await page.locator("#duty").fill(duty);
  await page.waitForTimeout(250);
};
// 제목 문장이 나오는 상태들 — 짧은 것부터 가장 긴 것(큰 금액 세금)까지
const STATES: [string, (p: Page) => Promise<void>, RegExp][] = [
  ["세금 없음", (p) => fill(p, "180"), /세금 없이 받습니다/],
  ["큰 단위 통화(엔) 면세 안", (p) => fill(p, "29000", "", "미국", "JPY"), /세금 없이 받습니다/],
  ["한도 초과 · 관세율 없음", (p) => fill(p, "350"), /한도 초과 · 관세율을 넣어 보세요/],
  ["세금이 붙음", (p) => fill(p, "350", "8"), /관세 · 부가세 약 [\d,]+원이 붙습니다/],
  ["아주 큰 금액 세금", (p) => fill(p, "99999999", "20"), /관세 · 부가세 약 [\d,]+원이 붙습니다/],
  ["빈 입력", (p) => fill(p, ""), /물건 값을 넣어 보세요/],
  ["숫자가 아닌 입력", (p) => fill(p, "abc"), /물건 값은 0 이상의 숫자만 됩니다/],
  ["관세율 오류", (p) => fill(p, "350", "500"), /관세율은 0 ~ 100 사이 숫자/],
];

for (const w of [1280, 1024]) {
  test(`넓은 화면 ${w}px — 모든 제목 문장이 한 줄`, async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 640, "넓은 화면 프로젝트에서만");
    await page.setViewportSize({ width: w, height: 800 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/calc");
    for (const [name, set, text] of STATES) {
      await set(page);
      await expect(page.getByRole("heading", { level: 1 }), name).toContainText(text);
      expect(await lines(page), `${name} · ${await page.getByRole("heading", { level: 1 }).textContent()}`).toBe(1);
    }
  });
}

for (const w of [1280, 1024, 768, 640, 428, 412, 390, 360, 320]) {
  test(`${w}px — 어떤 문장이어도 카드 · 아래 구간 위치 고정(640 이상 ±1px · 0208 크기 고정 · 639 이하는 줄 수만큼 내려감 · 작업 0245) · 제목 줄 수는 가장 긴 문장 기준으로 자리 잡힘`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/calc");
    await page.waitForTimeout(300);
    const y0 = await absY(page, "calc-input");
    const below0 = await absY(page, "import-price-section");
    let max = 0;
    const rows: { name: string; n: number; lh: number; card: number; below: number }[] = [];
    for (const [name, set, text] of STATES) {
      await set(page);
      await expect(page.getByRole("heading", { level: 1 }), name).toContainText(text);
      const n = await lines(page);
      max = Math.max(max, n);
      if (w >= 640) {
        expect(Math.abs((await absY(page, "calc-input")) - y0), `${name} · 카드 위치`).toBeLessThanOrEqual(1);
        expect(Math.abs((await absY(page, "import-price-section")) - below0), `${name} · 아래 구간 위치`).toBeLessThanOrEqual(1);
      } else {
        // 작업 0245 — 휴대폰(639 이하)은 자리를 미리 잡지 않음: 제목 줄 수에 따라 카드 · 아래 구간이 내려가고(줄 수 × 줄 높이), 카드 ~ 아래 구간 간격은 그대로
        const lh = await page.getByRole("heading", { level: 1 }).evaluate((el) => (el.getBoundingClientRect().height) / Math.max(1, Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight))));
        rows.push({ name, n, lh, card: await absY(page, "calc-input"), below: await absY(page, "import-price-section") });
      }
    }
    if (w < 640) {
      const ref = rows[0];
      for (const r of rows) {
        expect(Math.abs(r.card - ref.card - (r.n - ref.n) * r.lh), `${r.name} · 카드가 줄 수 차이(${r.n - ref.n}줄)만큼 이동`).toBeLessThanOrEqual(3);
        expect(Math.abs(r.below - r.card - (ref.below - ref.card)), `${r.name} · 카드 ~ 아래 구간 간격 그대로`).toBeLessThanOrEqual(1);
      }
      expect(Math.max(...rows.map((r) => r.n)), "줄 수가 다른 문장이 있어야 아래가 내려가는 것을 확인함").toBeGreaterThan(Math.min(...rows.map((r) => r.n)));
    }
    // 자리는 가장 긴 문장(max 줄)보다 넉넉하지 않음 — 설명 아래 빈칸이 한 줄(약 1.34 × 글자)보다 크지 않음
    const fs = await page.getByRole("heading", { level: 1 }).evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    await fill(page, "180");
    const h1 = await page.getByRole("heading", { level: 1 }).boundingBox();
    const desc = await page.getByText("물건 값을 넣으면 면세 한도 안인지").boundingBox();
    const card = await tid(page, "calc-input").boundingBox();
    expect(max, "가장 긴 문장 줄 수").toBeGreaterThanOrEqual(1);
    if (w >= 768) expect(max, `${w}px 가장 긴 문장 줄 수`).toBe(1);
    if (w >= 640) expect(max).toBeLessThanOrEqual(2);
    // 제목(한 줄 문장) 아래 빈칸 = 제목이 쓰는 줄 수와 자리 줄 수의 차이 — 한 줄 문장일 때 (max − 1) 줄보다 크지 않음
    const extra = (desc?.y ?? 0) - ((h1?.y ?? 0) + (h1?.height ?? 0));
    expect(extra, `제목 ~ 설명 사이 ${Math.round(extra)}px`).toBeLessThanOrEqual(16 + (max - 1) * fs * 1.4 + 2);
    expect(card?.y ?? 0).toBeGreaterThan((desc?.y ?? 0));
  });
}

test("넓은 화면 — 설명 아래 ~ 카드 위 끝 여백이 약 46px(시안 C/calc-blue · A/calc 의 적당한 여백)", async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 640, "넓은 화면 프로젝트에서만");
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/calc");
  await page.waitForTimeout(300);
  const desc = await page.getByText("물건 값을 넣으면 면세 한도 안인지").boundingBox();
  const card = await tid(page, "calc-input").boundingBox();
  const gap = (card?.y ?? 0) - ((desc?.y ?? 0) + (desc?.height ?? 0));
  expect(Math.abs(gap - 46), `설명 ~ 카드 ${Math.round(gap)}px`).toBeLessThanOrEqual(14);
});

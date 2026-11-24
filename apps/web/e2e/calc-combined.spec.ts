// 작업 0350 — 직구 합산과세 e2e (시안 7 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   요구: 물건 값 아래 "같은 판매자에게 같은 날 산 물건" 칸 · "+ 물건 더하기" · 지우기 · 합계로 한도 판단 · 막대 아래 문장 · 안내 문장(원문 그대로)
//   처음 들어온 /calc 는 예시 값(달러 · 180 · 미국 목록통관 한도 200 — 작업 0200)이라 합계 계산은 그 값 위에서 봄(달러는 환율에 상관없이 1 달러 = 1 달러)
//   builder 가 다는 표시(data-testid) — /calc 입력 카드 안
//     combined-items     "같은 판매자에게 같은 날 산 물건" 구역 (물건 값 아래 · 보내는 곳 위) — 글 칸 이름 · combined-note(안내 문장) · combined-add("+ 물건 더하기" 버튼)
//     combined-item      더한 물건 한 줄(칸 + 지우기) — 처음에 몇 줄 있어도 됨(0 줄 또는 1 줄) · 칸은 role textbox · 안에 오류 글
//     combined-remove    줄의 지우기 버튼 (눌러 지우기 · aria-label "물건 지우기")
//   결과 카드 안(막대 calc-limit-bar 아래): combined-sentence — "물건 두 개 합계 $180 + $60 = $240 · 하나씩은 한도 안이지만 합치면 넘습니다" (합치면 넘을 때만)
//   단위 테스트: calculator/combined.test.ts (경계 · 문장) · 출처 기록: checks/combined-source.test.ts
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const rows = (page: Page) => tid(page, "combined-item");
const SENTENCE = "물건 두 개 합계 $180 + $60 = $240 · 하나씩은 한도 안이지만 합치면 넘습니다";
const NOTE = "같은 해외 판매자에게 같은 날 산 물건을 나눠 받거나, 한 운송장으로 함께 오는 물건은 합쳐서 면세 한도를 봅니다(합산과세). 판매자가 다르거나 산 날이 다르면 따로 봅니다.";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("flapfx:intro-off", "1"));
});

/** 더한 물건 한 줄을 더하고 그 줄의 칸에 값을 넣음 */
async function addItem(page: Page, value: string) {
  const before = await rows(page).count();
  await tid(page, "combined-add").click();
  await expect(rows(page)).toHaveCount(before + 1);
  await rows(page).last().getByRole("textbox").fill(value);
}

test.describe("칸 이름 · 안내 문장 (작업 0350)", () => {
  test("물건 값 아래 · 보내는 곳 위 — 칸 이름 · 안내 문장 원문 그대로 · 더하기 단추", async ({ page }) => {
    await page.goto("/calc");
    const section = tid(page, "combined-items");
    await expect(section).toBeVisible();
    await expect(section).toContainText("같은 판매자에게 같은 날 산 물건");
    await expect(tid(page, "combined-note")).toHaveText(NOTE);
    await expect(tid(page, "combined-add")).toHaveText("+ 물건 더하기");
    await expect(section).not.toContainText("함께 들어오는"); // 삭제된 입항일 기준 문구 아님
    const [price, box, route] = await Promise.all([page.locator("#price").boundingBox(), section.boundingBox(), page.getByRole("radiogroup", { name: "보내는 곳" }).boundingBox()]);
    expect(box!.y, "물건 값 칸 아래").toBeGreaterThanOrEqual(price!.y + price!.height - 1);
    expect(box!.y + box!.height, "보내는 곳 위").toBeLessThanOrEqual(route!.y + 1);
  });

  test("서버 첫 그림(자바스크립트 없이 받은 HTML)에도 칸 이름 · 안내 문장이 들어 있음", async ({ page }) => {
    const h = await (await page.request.get("/calc")).text();
    expect(h).toContain("같은 판매자에게 같은 날 산 물건");
    expect(h).toContain("합쳐서 면세 한도를 봅니다(합산과세)");
  });

  test("국제 배송비 칸 · 관세율 칸은 그대로", async ({ page }) => {
    await page.goto("/calc");
    await expect(page.getByLabel("국제 배송비")).toBeVisible();
    await expect(page.getByLabel("관세율 (%)")).toBeVisible();
  });
});

test.describe("물건 더하기 · 지우기 · 합계 문장 (작업 0350 · 시안 7-new)", () => {
  test("$180 예시 + $60 더하기 → 합계 $240 · 한도 $200 넘음 · 막대 아래 문장 시안 그대로", async ({ page }) => {
    await page.goto("/calc");
    await expect(page.locator("#price")).toHaveValue("180");
    await expect(tid(page, "combined-sentence"), "한 개일 때는 문장 없음").toHaveCount(0);
    await expect(tid(page, "calc-limit-bar")).toHaveAttribute("data-ratio", "0.9");
    await addItem(page, "60");
    await expect(tid(page, "combined-sentence")).toHaveText(SENTENCE);
    await expect(tid(page, "calc-limit-bar")).toHaveAttribute("data-ratio", "1.2");
    await expect(tid(page, "calc-result")).toContainText("넘");
    // 문장은 결과 카드 안 · 한도 막대 아래
    const [bar, sentence] = await Promise.all([tid(page, "calc-limit-bar").boundingBox(), tid(page, "combined-sentence").boundingBox()]);
    expect(sentence!.y, "막대 아래").toBeGreaterThanOrEqual(bar!.y + bar!.height - 1);
    expect(await tid(page, "calc-result").locator('[data-testid="combined-sentence"]').count()).toBe(1);
  });

  test("합쳐도 한도 안이면 문장 없음 — $180 + $10 = $190", async ({ page }) => {
    await page.goto("/calc");
    await addItem(page, "10");
    await expect(tid(page, "calc-limit-bar")).toHaveAttribute("data-ratio", "0.95");
    await expect(tid(page, "combined-sentence")).toHaveCount(0);
  });

  test("한도 경계 — 합계 $200 정확히는 한도 안 · $200.01 은 넘음 (이하 면세)", async ({ page }) => {
    await page.goto("/calc");
    await page.locator("#price").fill("100");
    await addItem(page, "100");
    await expect(tid(page, "calc-limit-bar")).toHaveAttribute("data-ratio", "1");
    await expect(tid(page, "combined-sentence")).toHaveCount(0);
    await rows(page).last().getByRole("textbox").fill("100.01");
    await expect(tid(page, "combined-sentence")).toHaveText("물건 두 개 합계 $100 + $100.01 = $200.01 · 하나씩은 한도 안이지만 합치면 넘습니다");
  });

  test("지우면 문장이 사라지고 합계가 원래대로", async ({ page }) => {
    await page.goto("/calc");
    const n0 = await rows(page).count();
    await addItem(page, "60");
    await expect(tid(page, "combined-sentence")).toBeVisible();
    await rows(page).last().locator('[data-testid="combined-remove"]').click();
    await expect(rows(page)).toHaveCount(n0);
    await expect(tid(page, "combined-sentence")).toHaveCount(0);
    await expect(tid(page, "calc-limit-bar")).toHaveAttribute("data-ratio", "0.9");
  });

  test("물건 셋 · 다섯 — 문장의 개수 말 · 더하기는 다섯 개까지(더한 물건 4개) 뒤에는 더 못 더함", async ({ page }) => {
    await page.goto("/calc");
    await page.locator("#price").fill("50");
    for (const v of ["50", "50", "50"]) await addItem(page, v); // 합계 200 = 한도 안
    await expect(tid(page, "combined-sentence")).toHaveCount(0);
    await addItem(page, "50"); // 다섯 개 합계 $250
    await expect(tid(page, "combined-sentence")).toHaveText("물건 다섯 개 합계 $50 + $50 + $50 + $50 + $50 = $250 · 하나씩은 한도 안이지만 합치면 넘습니다");
    expect(await rows(page).count()).toBeLessThanOrEqual(4);
    const add = tid(page, "combined-add");
    // 가득 차면 더하기를 막음 — 숨기거나 비활성
    if (await add.count()) {
      if (await add.isVisible()) await expect(add).toBeDisabled();
    }
    await expect(rows(page)).toHaveCount(4);
  });

  test("더한 물건 칸에 글자를 넣으면 그 줄에 이유 · 지어낸 합계 없음", async ({ page }) => {
    await page.goto("/calc");
    await addItem(page, "abc");
    await expect(rows(page).last()).toContainText("물건 값은 0 이상의 숫자만 됩니다");
    await expect(tid(page, "combined-sentence")).toHaveCount(0);
  });

  test("가로 넘침 없음 · 단추는 손가락 크기(44px 이상) — 물건 넷을 더한 상태", async ({ page }) => {
    await page.goto("/calc");
    for (const v of ["20", "20", "20", "20"]) await addItem(page, v);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    const rm = await rows(page).first().locator('[data-testid="combined-remove"]').boundingBox();
    expect(rm!.width).toBeGreaterThanOrEqual(44);
    expect(rm!.height).toBeGreaterThanOrEqual(44);
    await rows(page).last().locator('[data-testid="combined-remove"]').click();
    const add = await tid(page, "combined-add").boundingBox();
    expect(add!.height).toBeGreaterThanOrEqual(44);
  });
});

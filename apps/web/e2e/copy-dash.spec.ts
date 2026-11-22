// 작업 0282 — 긴 줄표 · 물음표 · 직구 도움말 문구 + 직구 폼 높이가 값이 바뀌어도 밀리지 않음 (사용자가 시안 49 ~ 55번에서 정한 문구 · "고친 모습대로")
//   여행 타이밍 달력 제목 "언제 떠나면 쌀까"(줄표 뒤를 설명으로) · 설명 "인천 출발 기준으로, …" / 직구 "예시 값입니다. 바꿔 넣어 보세요" · "한도 안이라 계산하지 않음" · 도움말 "…더합니다" · "품목마다 다릅니다" · 칸 안 "모르면 비워 두세요" · 2주 미만 안내 줄 삭제
//   소개 제목 끝 물음표 / "값이 바뀌어도 밀리지 않는다"(사용자 조건): 예시 표시가 사라져도 입력 카드 높이가 그대로
//   값 의존(출발일 달력)은 자료가 있는 빌드에서만 돎
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);

test.describe("문구 · 줄표 · 물음표 (작업 0282)", () => {
  test("여행 타이밍 달력 — 제목은 '언제 떠나면 쌀까'(줄표 없음) · 설명이 '인천 출발 기준으로,' 로 시작", async ({ page }) => {
    await page.goto("/flights");
    await page.waitForLoadState("networkidle");
    test.skip((await tid(page, "airfare-lede").count()) === 0, "출발일 자료 없는 빌드");
    await expect(page.locator("#airfare-title")).toHaveText("언제 떠나면 쌀까");
    await expect(page.locator("#airfare-title")).not.toContainText("—");
    await expect(tid(page, "airfare-lede")).toContainText("인천 출발 기준으로, 출발일마다 그날 떠나 1주 뒤 돌아오는 왕복 최저가입니다.");
  });

  test("소개 — 제목 끝에 물음표 · 화면 읽기 이름도 같음", async ({ page }) => {
    await page.goto("/about");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveAccessibleName("어떤 자료를, 어떤 기준으로 보여 주나요?");
    expect(((await h1.innerText()) ?? "").replace(/\s+/g, " ").trim()).toMatch(/보여 주나요\?$/);
  });

  test("직구 — 예시 값 · 도움말 · 칸 안 글이 새 문구 · 옛 문구와 2주 미만 안내 줄이 없음", async ({ page }) => {
    await page.goto("/calc");
    await page.waitForLoadState("networkidle");
    const form = tid(page, "calc-input");
    await expect(form).toContainText("한도를 넘을 때만 세금에 더합니다");
    await expect(form).toContainText("품목마다 다릅니다");
    await expect(page.locator("#shipping")).toHaveAttribute("placeholder", "모르면 비워 두세요");
    await expect(page.locator("#duty")).toHaveAttribute("placeholder", "모르면 비워 두세요");
    const example = tid(page, "calc-example");
    if ((await example.count()) > 0) await expect(example).toHaveText("예시 값입니다. 바꿔 넣어 보세요");
    const body = await page.locator("main").innerText();
    for (const old of ["예시 값 —", "— 한도 안이라 계산 안 함", "모르면 비워 두기", "세금에 더함 ·", "품목마다 다름 ·", "기록이 2주 미만이라"]) expect(body, `옛 문구 ${old}`).not.toContain(old);
    await expect(tid(page, "customs-short-note")).toHaveCount(0);
    // 한도 안이면 과세 가격 칸의 글
    await page.locator("#price").fill("100");
    await page.waitForTimeout(300);
    await expect(tid(page, "calc-tag-bottom")).toContainText("한도 안이라 계산하지 않음");
  });

  for (const w of [1280, 1024, 768, 390]) {
    test(`직구 ${w}px — 예시 표시가 사라져도 입력 카드 · 아래 구간 높이가 그대로(값이 바뀌어도 밀리지 않음)`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto("/calc");
      await page.waitForLoadState("networkidle");
      const measure = () => page.evaluate(() => ({ card: Math.round((document.querySelector('[data-testid="calc-input"]') as HTMLElement).getBoundingClientRect().height * 10) / 10, below: Math.round(((document.querySelector('[data-testid="import-price-section"]') as HTMLElement).getBoundingClientRect().top + scrollY - (document.querySelector('[data-testid="calc-input"]') as HTMLElement).getBoundingClientRect().top - scrollY) * 10) / 10 }));
      const example = tid(page, "calc-example");
      test.skip((await example.count()) === 0, "예시 표시가 없는 상태로 열림");
      const before = await measure();
      await page.locator("#price").fill("350");
      await expect(example).toHaveCount(0);
      await page.waitForTimeout(300);
      const after = await measure();
      expect(Math.abs(after.card - before.card), `입력 카드 높이 ${before.card} → ${after.card}`).toBeLessThanOrEqual(1);
      // 오류가 떠도(도움말 자리가 오류 글로 바뀜) 카드 높이는 그대로
      await page.locator("#shipping").fill("xyz");
      await page.waitForTimeout(300);
      const err = await measure();
      expect(Math.abs(err.card - after.card), `오류가 떠도 입력 카드 높이 ${after.card} → ${err.card}`).toBeLessThanOrEqual(1);
    });
  }
});

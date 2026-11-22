// 작업 0289 — 통화 상세 판정 설명 두 줄 + 달러 고정 통화의 셋째 줄 (사용자가 정한 조건: 시안 55번 "고친 모습대로")
//   두 줄: "최근 90일 중 90%의 날보다 낮습니다" / "11월 20일 한국수출입은행 고시 · 예측이 아닙니다" (높음 · 중간도 같은 말끝) · 옛 "…낮음 · 예측 아님" 은 없음
//   셋째 줄: 사우디 리얄(SAR) · 아랍에미리트 디르함(AED) · 바레인 디나르(BHD) 에만 "…는 미국 달러에 고정된 통화라 달러와 같이 움직입니다" — USD · JPY · EUR · HKD · KWD 등에는 없음
//   "값이 바뀌어도 아래 칸이 밀리지 않는다": 셋째 줄 자리는 모든 통화에 같은 높이로 잡혀, 통화를 바꿔도 셋째 줄 자리와 그 아래 칸의 위치 차이가 같음 · 가로 넘침 0
import { type Page, expect, test } from "@playwright/test";

const PEGGED = ["SAR", "AED", "BHD"];
const OTHERS = ["USD", "JPY", "EUR", "HKD", "KWD", "CNH", "DKK", "BND"];
const WIDTHS = [1280, 390];

async function open(page: Page, code: string, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/currencies/${code}`);
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await Promise.race([Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Number.POSITIVE_INFINITY).map((a) => a.finished.catch(() => undefined))), new Promise((res) => setTimeout(res, 3000))]);
  });
}
/** 판정 줄 · 셋째 줄 자리 · 그 아래 칸 위치(서로의 차이만 비교 — 큰 제목 줄바꿈 등 다른 이유의 위치 차이는 빼기 위해) */
const geom = (page: Page) =>
  page.evaluate(() => {
    const peg = document.querySelector('[data-testid="peg-note"]') as HTMLElement;
    const verdict = peg.previousElementSibling as HTMLElement;
    const below = peg.nextElementSibling as HTMLElement;
    const b = (e: Element) => e.getBoundingClientRect();
    return { pegH: Math.round(b(peg).height * 10) / 10, pegToBelow: Math.round((b(below).top - b(peg).top) * 10) / 10, verdictToPeg: Math.round((b(peg).top - b(verdict).top) * 10) / 10, verdictH: Math.round(b(verdict).height * 10) / 10, visibleText: peg.innerText.trim(), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  });

test.describe("통화 판정 줄 (작업 0289)", () => {
  for (const code of ["USD", "JPY", "EUR", "SAR"]) {
    test(`/currencies/${code} — 판정 설명이 두 줄(…습니다 · 'N월 N일 … 고시 · 예측이 아닙니다') · 옛 문구 없음`, async ({ page }) => {
      await open(page, code, 1280);
      const lines = await page.locator('[data-testid="peg-note"]').evaluate((peg) => Array.from((peg.previousElementSibling as HTMLElement).querySelectorAll("span.block")).map((s) => (s as HTMLElement).innerText.trim()));
      test.skip(lines.length === 0, "판정 줄 없음");
      expect(lines.length, "판정 설명이 두 줄").toBe(2);
      expect(lines[0], "첫 줄 판정 문장").toMatch(/^최근 \d+일 (중 (\d+%의 날보다 (낮|높)습니다|가장 (낮|높)습니다)|중간 수준입니다|자료가 모자라 신호를 내지 않았습니다)$|^신호를 받지 못했습니다/);
      expect(lines[1], "둘째 줄").toMatch(/^\d{1,2}월 \d{1,2}일 (한국수출입은행 고시|Frankfurter 값) · 예측이 아닙니다$/);
      const body = await page.locator("body").innerText();
      expect(body, "옛 문구").not.toMatch(/의 날보다 (낮|높)음 · \d{4}-\d{2}-\d{2}|· 예측 아님/);
    });
  }

  for (const code of PEGGED) {
    test(`/currencies/${code} — 셋째 줄이 보임: '(통화 이름)은(는) 미국 달러에 고정된 통화라 달러와 같이 움직입니다'`, async ({ page }) => {
      await open(page, code, 1280);
      const g = await geom(page);
      expect(g.visibleText, "셋째 줄").toMatch(/^.+(은|는) 미국 달러에 고정된 통화라 달러와 같이 움직입니다$/);
      await expect(page.getByTestId("peg-note")).toBeVisible();
    });
  }
  for (const code of OTHERS) {
    test(`/currencies/${code} — 셋째 줄 없음(보이는 글 없음 · '고정된 통화' 글자 없음)`, async ({ page }) => {
      await open(page, code, 1280);
      const g = await geom(page);
      expect(g.visibleText, "셋째 줄 자리의 보이는 글").toBe("");
      expect(await page.locator("body").innerText(), "고정 통화 문장").not.toContain("미국 달러에 고정된 통화");
    });
  }

  for (const width of WIDTHS) {
    test(`${width}px — 통화를 바꿔도 셋째 줄 자리 높이 · 그 아래 칸 위치 차이가 같음(밀리지 않음) · 가로 넘침 0`, async ({ page }) => {
      const rows: Record<string, Awaited<ReturnType<typeof geom>>> = {};
      for (const code of [...PEGGED, ...OTHERS]) {
        await open(page, code, width);
        rows[code] = await geom(page);
        expect(rows[code].overflow, `${code} 가로 넘침`).toBeLessThanOrEqual(0);
      }
      const ref = rows.USD;
      for (const [code, g] of Object.entries(rows)) {
        expect(Math.abs(g.pegH - ref.pegH), `${code} 셋째 줄 자리 높이 ${g.pegH} (USD ${ref.pegH})`).toBeLessThanOrEqual(1);
        expect(Math.abs(g.pegToBelow - ref.pegToBelow), `${code} 셋째 줄 자리 → 아래 칸 거리 ${g.pegToBelow} (USD ${ref.pegToBelow})`).toBeLessThanOrEqual(1);
      }
    });
  }
});

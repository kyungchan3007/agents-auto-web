// 작업 0287(사용자 정정 08:34Z) — 통화 상세 환율: 1,000원 이상은 소수 첫째 자리까지(1,459.62 → 1,459.6) · 1,000원 미만은 둘째 자리(833.73) · 끝자리 0 은 쓰지 않음(1,330.80 → 1,330.8 · 1,331.0 → 1,331) · 한 화면 한 형식 · 홈은 그대로
//   통화 상세: 큰 숫자 · 1년 최저 · 최고 · 평균 카드 · 그래프(읽기용 글 · 최고 · 최저 · 평균 꼬리표 · 끝 말풍선) · 환산 · 설명 문장 · 둘러보기 표
//   큰 숫자가 한 자리 길어져도 390 등 좁은 폭에서 줄바꿈 · 가로 넘침 없음 · 글자판 칸이 밀리지 않음
import { type Page, expect, test } from "@playwright/test";

const CODES = ["USD", "JPY", "EUR"];
/** 규칙에 어긋난 환율 글: ① 끝자리 0(1,330.80원 · 7.30원) ② 1,000원 이상인데 소수 둘째 자리 이상(1,459.62원) ③ 1,000원 미만인데 소수 셋째 자리 이상 */
const BAD = /(\d[\d,]*\.\d*0|\d{1,3}(?:,\d{3})+\.\d{2,}|\d{4,}\.\d{2,}|\b\d{1,3}\.\d{3,})(?!\d)\s*원/g;
const ONE_DECIMAL = BAD;

async function open(page: Page, path: string, width = 1280) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  // 그래프는 화면에 들어올 때 그려지므로 가져와 끝(data-state=done)나길 기다림
  const chart = page.locator('[data-testid="line-chart"]').first();
  if (await chart.count()) {
    await chart.scrollIntoViewIfNeeded();
    await expect(chart, "그래프가 끝까지 그려짐").toHaveAttribute("data-state", "done", { timeout: 15000 });
  }
  await page.evaluate(async () => {
    await Promise.race([Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Number.POSITIVE_INFINITY).map((a) => a.finished.catch(() => undefined))), new Promise((res) => setTimeout(res, 4000))]);
  });
}
/** 큰 숫자 칸(제목: 이름 줄 + 값 줄)의 값 글자 — 소수점이 든 맨 끝 글자 요소(엔은 단위 '원 / 100' 이 따로 있어도 숫자 쪽) */
const bigValue = (page: Page) => page.getByTestId("big-rate").first().locator("xpath=.//*[not(*) and contains(., '.')]").last();
/** 화면 글 + 그래프 읽기용 글(aria-label) + 그래프 안 SVG 글 + data-final 을 한데 모음 */
const allText = (page: Page) =>
  page.evaluate(() => {
    const out: string[] = [document.body.innerText];
    document.querySelectorAll("[aria-label]").forEach((e) => out.push(e.getAttribute("aria-label") ?? ""));
    document.querySelectorAll("[data-final]").forEach((e) => out.push(e.getAttribute("data-final") ?? ""));
    document.querySelectorAll("svg text").forEach((e) => { if (e.getAttribute("data-reveal") !== "0") out.push(e.textContent ?? ""); });
    return out.join("\n");
  });

test.describe("환율 소수 둘째 자리 (작업 0287)", () => {
  for (const code of CODES) {
    test(`/currencies/${code} — 환율 글은 모두 새 규칙(끝자리 0 없음 · 1,000원 이상 소수 첫째 자리 · 미만 둘째 자리) · 큰 숫자 = 말풍선`, async ({ page }) => {
      await open(page, `/currencies/${code}`);
      const text = await allText(page);
      const bad = [...new Set(text.match(ONE_DECIMAL) ?? [])];
      expect(bad, "규칙에 어긋난 환율 글").toEqual([]);
      const rates = text.match(/\d[\d,]*(?:\.\d+)?\s*원/g) ?? [];
      expect(rates.length, "환율 글이 보임").toBeGreaterThan(5);
      // 큰 숫자 · 그래프 끝 말풍선은 같은 날 값이라 같은 글
      const bv = bigValue(page);
      const big = (((await bv.getAttribute("data-final")) ?? (await bv.innerText())) || "").replace(/\s+/g, "");
      const end = page.locator('[data-testid="chart-end-value"]').first();
      // 큰 숫자와 끝 말풍선은 같은 날 값이라 숫자 글이 같아야 함(같은 규칙)
      if (await end.count()) expect(((await end.getAttribute("data-final")) ?? "").replace(/원.*$/, ""), "끝 말풍선 = 큰 숫자 글").toBe(big.replace(/원.*$/, ""));
    });
  }

  test("1개월 · 3개월 · 1년으로 바꿔도 한 화면 한 형식 · 카드 · 꼬리표 · 말풍선", async ({ page }) => {
    await open(page, "/currencies/USD");
    const buttons = page.locator('[data-testid="year-flow"] button[aria-pressed]');
    const n = await buttons.count();
    expect(n).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < n; i++) {
      await buttons.nth(i).click();
      await expect(page.locator('[data-testid="line-chart"]').first()).toHaveAttribute("data-state", "done", { timeout: 15000 });
      const bad = [...new Set(((await allText(page)).match(ONE_DECIMAL)) ?? [])];
      expect(bad, `${i + 1}번째 기간의 규칙에 어긋난 환율 글`).toEqual([]);
    }
  });

  test("값은 같고 표기만 — 큰 숫자의 값 = 그래프 끝 말풍선의 값(반올림 자리 안에서 같음)", async ({ page }) => {
    await open(page, "/currencies/USD");
    const num = (s: string) => Number(s.replace(/[^\d.]/g, ""));
    const bv = bigValue(page);
    const big = num((await bv.getAttribute("data-final")) ?? (await bv.innerText()));
    const end = page.locator('[data-testid="chart-end-value"]').first();
    test.skip(!(await end.count()), "그래프 자료 없음");
    expect(num((await end.getAttribute("data-final")) ?? ""), "큰 숫자 = 말풍선 값").toBeCloseTo(big, 1);
  });

  test("홈은 그대로 — 안내판 · 도착지 줄 환율은 정수(100원 이상) · 둘째 자리 없음", async ({ page }) => {
    await open(page, "/");
    const finals = await page.locator('[data-testid="dest-rate"]').evaluateAll((els) => els.map((e) => e.getAttribute("data-final") ?? ""));
    test.skip(finals.length === 0, "도착지 줄 없음");
    for (const f of finals) {
      const v = Number(f.replace(/[^\d.]/g, ""));
      if (v >= 100) expect(f, `홈 환율 ${f}`).not.toMatch(/\.\d/);
    }
  });

  for (const width of [390, 360, 320]) {
    test(`${width}px — 큰 숫자가 한 자리 길어져도 한 줄 · 가로 넘침 0 · 오른쪽이 화면 밖으로 안 나감`, async ({ page }) => {
      await open(page, "/currencies/USD", width);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "문서 가로 넘침").toBeLessThanOrEqual(0);
      const r = await bigValue(page).evaluate((el) => {
        const b = el.getBoundingClientRect();
        // 값 글자가 몇 줄에 걸쳐 그려지는지(글자 상자들의 세로 위치)
        const range = document.createRange();
        range.selectNodeContents(el);
        const tops = new Set(Array.from(range.getClientRects()).filter((x) => x.width > 0).map((x) => Math.round(x.top / 4)));
        return { right: b.right, left: b.left, lines: tops.size, vw: window.innerWidth };
      });
      expect(r.right, "큰 숫자 오른쪽이 화면 안").toBeLessThanOrEqual(r.vw + 0.5);
      expect(r.left, "큰 숫자 왼쪽이 화면 안").toBeGreaterThanOrEqual(-0.5);
      expect(r.lines, "큰 숫자가 한 줄").toBe(1);
    });
  }
});

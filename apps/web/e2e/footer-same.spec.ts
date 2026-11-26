// 작업 0286 — 바닥 띠 끝 "소개 · 판단 기준" 링크를 모든 페이지에 같은 모양 · 같은 주소로 (사용자 결정: 시안 52번 "고친 모습대로")
//   여행 타이밍 · 여행 물가 · 직구 계산 바닥 띠에도 링크를 더함(홈 · 통화 상세 · 없는 주소는 이미 있음) · 링크는 /about · 모양(색 · 밑줄 · 굵기)이 같음
//   여행 물가 바닥 띠의 지표 코드(PA.NUS.PRVT.PP ÷ PA.NUS.FCRF)와 통화 바닥 띠의 "(예비: Frankfurter)"는 바닥 띠에서 빠지고 소개 항목에 적힘
//   작업 0299: 환율 출처는 공용 상수 '한국수출입은행 · Frankfurter(수출입은행 값을 받지 못한 날)' 로 다섯 페이지 바닥 띠가 같음(옛 '(예비: Frankfurter)' 괄호와 다름)
//   각 페이지의 출처 문장 자체는 그대로 · 소개의 바닥 띠("모든 숫자의 출처는 각 화면 아래에 적습니다")도 그대로
import { type Page, expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";

test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
});

const PAGES: [string, string][] = [
  ["홈", "/"],
  ["통화 상세", "/currencies/USD"],
  ["여행 타이밍", "/flights"],
  ["여행 물가", "/prices"],
  ["직구 계산", "/calc"],
  ["없는 주소", "/no-such-page-0286"],
];
const NAME = "소개 · 판단 기준";
// 작업 0299: 환율을 쓰는 다섯 페이지 바닥 띠의 환율 출처 문구(공용 상수 RATE_SOURCE_LABEL) — 수출입은행 값을 받지 못한 날은 Frankfurter 값을 씀
const RATE_LABEL = "한국수출입은행 · Frankfurter(수출입은행 값을 받지 못한 날)";
const RATE_PAGES: [string, string][] = [["홈", "/"], ["통화 상세", "/currencies/USD"], ["직구 계산", "/calc"], ["여행 물가", "/prices"], ["여행 타이밍", "/flights"]];

/** 페이지 맨 아래 쪽에 있는 "소개 · 판단 기준" 링크(메뉴의 '소개' 와 구분) — 주소 · 모양 · 위치 */
async function footerLink(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  const links = page.getByRole("link", { name: NAME, exact: true });
  const n = await links.count();
  if (n === 0) return null;
  const link = links.last();
  return link.evaluate((el) => {
    const cs = getComputedStyle(el), r = el.getBoundingClientRect();
    const doc = document.documentElement.scrollHeight;
    return { href: el.getAttribute("href"), text: (el.textContent ?? "").trim(), color: cs.color, deco: `${cs.textDecorationLine}|${cs.borderBottomWidth}|${cs.borderBottomStyle}`, weight: cs.fontWeight, atBottom: r.top + window.scrollY > doc * 0.6, size: cs.fontSize };
  });
}

test.describe("바닥 띠 같은 형식 (작업 0286)", () => {
  test("여섯 곳(홈 · 통화 상세 · 여행 타이밍 · 여행 물가 · 직구 계산 · 없는 주소) 바닥 띠 끝에 같은 링크 — 주소 /about · 같은 모양 · 맨 아래 쪽", async ({ page }) => {
    const found: Record<string, NonNullable<Awaited<ReturnType<typeof footerLink>>>> = {};
    for (const [label, path] of PAGES) {
      const f = await footerLink(page, path);
      if (!f) { test.info().annotations.push({ type: "링크 없음", description: label }); expect(f, `${label} 바닥 띠 끝에 '${NAME}' 링크`).not.toBeNull(); continue; }
      expect(f.href, `${label} 링크 주소`).toBe("/about");
      expect(f.text).toBe(NAME);
      expect(f.atBottom, `${label}: 링크가 페이지 맨 아래 쪽(바닥 띠)에 있음`).toBe(true);
      found[label] = f;
    }
    const base = found["홈"];
    for (const [label, f] of Object.entries(found)) {
      expect(f.color, `${label} 링크 색이 홈과 같음`).toBe(base.color);
      expect(f.deco, `${label} 링크 밑줄 · 테두리가 홈과 같음`).toBe(base.deco);
      expect(f.weight, `${label} 링크 굵기가 홈과 같음`).toBe(base.weight);
    }
  });

  test("여행 물가 바닥 띠에 지표 코드 없음 · 출처 '세계은행 물가 수준 · 한국수출입은행' / 통화 바닥 띠 '환율: 한국수출입은행 · Frankfurter(수출입은행 값을 받지 못한 날)'(작업 0299 · 옛 '(예비: Frankfurter)' 괄호는 없음)", async ({ page }) => {
    await page.goto("/prices");
    await page.waitForLoadState("networkidle");
    const prices = await page.locator("body").innerText();
    expect(prices).not.toContain("PA.NUS");
    expect(prices).not.toContain("÷");
    expect(prices).toContain(`자료: 세계은행 물가 수준 · ${RATE_LABEL}`);
    await page.goto("/currencies/USD");
    await page.waitForLoadState("networkidle");
    const cur = await page.locator("body").innerText();
    expect(cur).not.toContain("(예비: Frankfurter)");
    expect(cur).toContain(`환율: ${RATE_LABEL}`);
  });

  test("소개 — 환율 항목에 예비 출처 · 여행 물가 항목에 지표 코드 · 바닥 띠 문장 그대로", async ({ page }) => {
    await page.goto("/about");
    await page.waitForLoadState("networkidle");
    const cards = page.getByTestId("criteria-card");
    await expect(cards.filter({ hasText: "환율" }).first()).toContainText("예비 출처(Frankfurter)");
    const price = cards.filter({ hasText: "여행 물가" }).first();
    await expect(price).toContainText("PA.NUS.PRVT.PP");
    await expect(price).toContainText("PA.NUS.FCRF");
    await expect(page.locator("body")).toContainText("모든 숫자의 출처는 각 화면 아래에 적습니다");
  });

  test("각 페이지의 출처 문장 자체는 그대로(여행 타이밍 · 직구 계산)", async ({ page }) => {
    await page.goto("/flights");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(`자료: 통계청 KOSIS 소비자물가지수(국제항공료 · 해외단체여행비, 매달 최근 24개월) · ${RATE_LABEL}`);
    await page.goto("/calc");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText(`자료: 관세청 과세환율 · 한국은행 ECOS 수입물가지수 · ${RATE_LABEL} · 면세 한도 관세법 기준`);
  });

  test("환율을 쓰는 다섯 페이지(홈 · 통화 상세 · 직구 · 여행 물가 · 여행 타이밍) 바닥 띠에 같은 환율 출처 문구 · 소개 · 없는 주소 바닥 띠는 그대로(예비 출처 글 없음)", async ({ page }) => {
    for (const [label, path] of RATE_PAGES) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const footer = await page.getByRole("contentinfo").last().innerText();
      expect(footer, `${label} 바닥 띠에 환율 출처 문구`).toContain(RATE_LABEL);
      expect((footer.match(/Frankfurter/g) ?? []).length, `${label} 바닥 띠에 Frankfurter 는 한 번`).toBe(1);
    }
    for (const [label, path] of [["소개", "/about"], ["없는 주소", "/no-such-page-0299"]] as const) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const footer = await page.getByRole("contentinfo").last().innerText();
      expect(footer, `${label} 바닥 띠는 그대로(환율 출처 문구 없음)`).not.toContain("Frankfurter");
    }
  });

  test("환율 출처 문구가 길어져도 바닥 띠가 가로로 넘치지 않음 · 줄바꿈으로 다 보임(1280 · 390 · 360 · 다섯 페이지)", async ({ page }) => {
    for (const width of [1280, 390, 360]) {
      await page.setViewportSize({ width, height: 900 });
      for (const [label, path] of RATE_PAGES) {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        const r = await page.getByRole("contentinfo").last().evaluate((f) => {
          const b = f.getBoundingClientRect();
          return { right: b.right, vw: window.innerWidth, scrollW: (f as HTMLElement).scrollWidth - (f as HTMLElement).clientWidth, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        });
        expect(r.overflow, `${width}px ${label} 가로 넘침`).toBeLessThanOrEqual(0);
        expect(r.scrollW, `${width}px ${label} 바닥 띠 안에서 잘림`).toBeLessThanOrEqual(0);
        expect(r.right, `${width}px ${label} 바닥 띠 오른쪽이 화면 안`).toBeLessThanOrEqual(r.vw + 0.5);
      }
    }
  });

  test("바닥 띠가 길어져도 가로로 넘치지 않음(휴대폰 390 · 여섯 곳)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [label, path] of PAGES) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${label} 가로 넘침`).toBeLessThanOrEqual(0);
    }
  });
});

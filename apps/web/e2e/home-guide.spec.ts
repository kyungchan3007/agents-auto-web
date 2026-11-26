// 작업 0347 — 홈 첫 화면 안내 9-C e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   요구: 설명 문장 아래 안내 문장 + "가입 없이 무료" 작은 줄 · 카드 검색 칸 노란 테두리 + 칩 줄과 함께 90일 신호 줄 위 · 자리표시 글 · 나라 고르면 카드 여행지 바뀜 + 그 나라 페이지 링크(없는 나라는 링크 없음) · 노트북 높이마다 첫 화면
//   builder 가 다는 표시(data-testid) — 홈 안
//     hero-guide   안내 문장 (home-hero 안 p · 설명 문장 아래)
//     hero-free    작은 줄 "가입 없이 무료 · ↓" (home-hero 안 마지막 p · 카드 위)
//     picked-country-link   카드 안 나라 페이지 링크 (고른 나라가 있고 그 나라 페이지가 있을 때만)
//   기존 표시 그대로: home-hero · hero-month · ticket · ticket-evidence · trip-switcher · pick-chip · combobox "여행지 검색" · option
//   기존 home-fix-0217.spec.ts 는 이 작업에서 고침: 설명 문장 ↔ 카드 간격(시안 B 50px · 40px)은 안내 줄이 끼어 마지막 p(작은 줄) ↔ 카드로 8 ~ 54px
import { type Page, expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhoneProject = (page: Page) => page.context().browser() !== null && (page.viewportSize()?.width ?? 0) < 640 && test.info().project.name === "휴대폰";
const search = (page: Page) => page.getByRole("combobox", { name: "여행지 검색" });
const box = async (loc: ReturnType<Page["locator"]>, name: string) => {
  const b = await loc.first().boundingBox();
  if (!b) throw new Error(`${name} 가 화면에 없음`);
  return b;
};
// 큰 화면 높이 구간(hero-section.tsx 주석: 880 이하 · 881~1000 · 1001~1180 · 1181 이상) — 기존 home-fix-0217 의 노트북 높이들
const SCREENS = [
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1920, 950],
  [2560, 1440],
  // 구간 경계(880 | 881 · 1000 | 1001 · 1180 | 1181) — 구간마다 여백을 줄인 값이 경계에서도 맞는지 (작업 0347)
  [1280, 880],
  [1280, 881],
  [1280, 1000],
  [1280, 1001],
  [1280, 1180],
  [1280, 1181],
] as const;

test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
  await page.addInitScript(() => localStorage.setItem("flapfx:intro-off", "1"));
});

test.describe("홈 안내 문구 (작업 0347 · 시안 9-C)", () => {
  test("안내 문장 · 작은 줄 — 사용자가 정한 글 그대로", async ({ page }) => {
    await page.goto("/");
    await expect(tid(page, "hero-guide")).toHaveText("어디로 가세요? 아래 칸에 도시나 나라를 넣으면 환율 · 물가 · 떠나기 좋은 때를 한 번에 보여 드립니다");
    await expect(tid(page, "hero-free")).toHaveText("가입 없이 무료 · ↓");
    await expect(tid(page, "hero-guide")).not.toContainText("항공권");
  });

  test("서버 첫 그림(자바스크립트 없이 받은 HTML)에도 안내 문장이 들어 있음", async ({ page }) => {
    const h = await (await page.request.get("/")).text();
    expect(h).toContain("어디로 가세요? 아래 칸에 도시나 나라를 넣으면 환율");
    expect(h).toContain("가입 없이 무료");
  });

  test("차례 — 큰 제목 · 설명 문장 · 안내 문장 · 작은 줄 · 탑승권 카드(위에서 아래로)", async ({ page }) => {
    await page.goto("/");
    const lede = await box(tid(page, "home-hero").locator("p").filter({ hasText: /국제항공료 지수/ }), "설명 문장");
    const guide = await box(tid(page, "hero-guide"), "안내 문장");
    const free = await box(tid(page, "hero-free"), "작은 줄");
    const card = await box(tid(page, "ticket"), "카드");
    const h1 = await box(page.getByRole("heading", { level: 1 }), "큰 제목");
    expect(h1.y + h1.height, "큰 제목 아래 설명").toBeLessThanOrEqual(lede.y + 2);
    expect(guide.y, "안내 문장이 설명 문장 아래").toBeGreaterThanOrEqual(lede.y + lede.height - 1);
    expect(free.y, "작은 줄이 안내 문장 아래").toBeGreaterThanOrEqual(guide.y + guide.height - 1);
    expect(card.y, "카드가 작은 줄 아래").toBeGreaterThanOrEqual(free.y + free.height - 1);
    expect(guide.x + guide.width, "안내 문장이 화면 안").toBeLessThanOrEqual((page.viewportSize()?.width ?? 0) + 1);
  });
});

test.describe("카드 검색 칸 (작업 0347 · 시안 9-C)", () => {
  test("자리표시 글", async ({ page }) => {
    await page.goto("/");
    await expect(search(page)).toHaveAttribute("placeholder", "어디로 가세요? 도시 · 나라 (예: 도쿄, 베트남)");
  });

  test("노란 테두리 — 큰 제목의 월(노랑)과 같은 색", async ({ page }) => {
    await page.goto("/");
    const [border, sun] = await Promise.all([
      search(page).evaluate((el) => getComputedStyle(el).borderTopColor),
      tid(page, "hero-month").evaluate((el) => getComputedStyle(el).color),
    ]);
    expect(border).toBe(sun);
    expect(await search(page).evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth)), "강조라 테두리가 눈에 띄는 굵기").toBeGreaterThanOrEqual(2);
  });

  test("칩 줄과 검색 칸이 90일 신호 줄 · 안내판 아래가 아니라 위 — 칩 → 검색 칸 → 신호 줄 차례", async ({ page }) => {
    await page.goto("/");
    const sw = await box(tid(page, "trip-switcher"), "여행지 고르기");
    const evidence = await box(tid(page, "ticket-evidence"), "90일 신호 줄");
    const board = await box(tid(page, "ticket").getByTestId("flap-board"), "안내판");
    const firstChip = await box(tid(page, "trip-switcher").getByTestId("pick-chip"), "첫 칩");
    const lastChip = await box(tid(page, "trip-switcher").getByTestId("pick-chip").last(), "마지막 칩");
    const input = await box(search(page), "검색 칸");
    expect(sw.y, "고르기 영역이 안내판 아래").toBeGreaterThanOrEqual(board.y + board.height - 1);
    expect(sw.y + sw.height, "고르기 영역이 신호 줄 위").toBeLessThanOrEqual(evidence.y + 1);
    expect(firstChip.y, "칩이 검색 칸 위").toBeLessThan(input.y);
    expect(lastChip.y + lastChip.height, "칩 줄이 검색 칸 위").toBeLessThanOrEqual(input.y + 1);
    expect(input.y + input.height, "검색 칸이 신호 줄 위").toBeLessThanOrEqual(evidence.y + 1);
  });
});

test.describe("나라 고르기 → 카드 여행지 · 나라 페이지 링크 (작업 0347)", () => {
  const choose = async (page: Page, query: string) => {
    await search(page).fill(query);
    await page.getByRole("option").first().click();
  };

  test("처음에는 나라 페이지 링크가 없음", async ({ page }) => {
    await page.goto("/");
    await expect(tid(page, "picked-country-link")).toHaveCount(0);
  });

  test("나라를 고르면 카드 여행지가 바뀌고 그 나라 페이지(/prices/VNM) 링크가 나옴", async ({ page }) => {
    await page.goto("/");
    const board = tid(page, "ticket").getByTestId("flap-board");
    const before = await board.getAttribute("aria-label");
    await choose(page, "베트남");
    await expect(board, "카드 여행지가 바뀜").not.toHaveAttribute("aria-label", before ?? "");
    await expect(board).toHaveAttribute("aria-label", /내가 고른 여행지는/);
    const link = tid(page, "picked-country-link");
    await expect(link).toHaveAttribute("href", "/prices/VNM");
    await expect(link).toContainText("베트남");
    await link.click();
    await expect(page).toHaveURL(/\/prices\/VNM\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("물가");
  });

  test("나라 페이지가 없는 나라는 링크를 내지 않음 (물가 자료 없는 대만 — 페이지가 있으면 그 주소로)", async ({ page }) => {
    const exists = (await page.request.get("/prices/TWN")).status() === 200;
    await page.goto("/");
    await choose(page, "대만");
    await expect(tid(page, "ticket").getByTestId("flap-board")).toHaveAttribute("aria-label", /내가 고른 여행지는/);
    if (exists) await expect(tid(page, "picked-country-link")).toHaveAttribute("href", "/prices/TWN");
    else await expect(tid(page, "picked-country-link")).toHaveCount(0);
  });
});

test.describe("노트북 높이마다 첫 화면 — 안내 · 탑승권 카드 · 검색 칸 (작업 0347 · 구간마다 여백 다시 맞춤)", () => {
  for (const [width, height] of SCREENS) {
    test(`${width}×${height} — 안내 문장 · 작은 줄 · 칩 · 검색 칸 · 90일 신호 줄 · 카드 위쪽이 첫 화면 안 · 가로 넘침 0`, async ({ page }) => {
      test.skip(isPhoneProject(page), "뷰포트를 직접 정하므로 넓은 화면 프로젝트에서만");
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => window.scrollY), "스크롤 전 첫 화면").toBe(0);
      const bottom = async (loc: ReturnType<Page["locator"]>, name: string) => {
        const b = await box(loc, name);
        return b.y + b.height;
      };
      expect(await bottom(tid(page, "hero-guide"), "안내 문장"), "안내 문장 아래 끝").toBeLessThanOrEqual(height);
      expect(await bottom(tid(page, "hero-free"), "작은 줄"), "작은 줄 아래 끝").toBeLessThanOrEqual(height);
      expect(await bottom(tid(page, "trip-switcher").getByTestId("pick-chip").last(), "마지막 칩"), "마지막 칩 아래 끝").toBeLessThanOrEqual(height);
      expect(await bottom(search(page), "검색 칸"), "검색 칸 아래 끝").toBeLessThanOrEqual(height);
      expect(await bottom(tid(page, "ticket-evidence"), "90일 신호 줄"), "90일 신호 줄 아래 끝").toBeLessThanOrEqual(height);
      expect(await bottom(tid(page, "ticket").getByTestId("flap-board"), "안내판"), "안내판 아래 끝").toBeLessThanOrEqual(height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "가로 넘침").toBeLessThanOrEqual(0);
      // 제목 위 라벨('여행 타이밍')도 그대로 보임 — 사용자 결정 '제목 위 라벨 유지' (작업 0351)
      await expect(page.locator('*:text-is("여행 타이밍"):not(header *)').first(), "제목 위 라벨").toBeVisible();
      // 큰 제목은 줄이되 없애지 않음
      expect(await page.getByRole("heading", { level: 1 }).evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), "큰 제목 글자 크기").toBeGreaterThanOrEqual(40);
      // 작은 줄과 카드가 겹치지 않고 너무 떨어지지도 않음
      const free = await box(tid(page, "hero-free"), "작은 줄");
      const card = await box(tid(page, "ticket"), "카드");
      expect(card.y - (free.y + free.height), "작은 줄과 카드 사이").toBeGreaterThanOrEqual(8);
      expect(card.y - (free.y + free.height), "작은 줄과 카드 사이가 시안보다 넓어지지 않음").toBeLessThanOrEqual(54);
    });
  }

  test("휴대폰 390 — 안내 문장 · 작은 줄이 보이고 카드 아래로 밀리지 않음 · 가로 넘침 0", async ({ page }) => {
    test.skip(isPhoneProject(page), "뷰포트를 직접 정하므로 넓은 화면 프로젝트에서만");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForTimeout(400);
    const guide = await box(tid(page, "hero-guide"), "안내 문장");
    const free = await box(tid(page, "hero-free"), "작은 줄");
    const card = await box(tid(page, "ticket"), "카드");
    expect(guide.x).toBeGreaterThanOrEqual(0);
    expect(guide.x + guide.width).toBeLessThanOrEqual(390);
    expect(free.y + free.height).toBeLessThanOrEqual(card.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
});

// 작업 0233 (패치 · 버그) — 메뉴 "오늘 환율"(/#today)이 "도착지별 환전 타이밍" 구역으로 가야 함 · 테스트 먼저
//   요청 원문: .agents/specs/0233-today-anchor/request.md · 계획: plan.md
//   DOM 계약: 구역 id="today"(라벨 "오늘 환율" · 제목 #destinations-title "도착지별 환전 타이밍") · 탑승권 카드는 id="board" · 고정 메뉴 높이만큼 스크롤 여백
//   도착한 뒤: 제목이 화면 안 · 고정 메뉴(banner) 아래 · 메뉴 바로 아래(구도: 사용자 그림 2) · 카드가 접힌 알약이 아니라 펼친 상태 · 도착 위치가 밀리지 않음
//   세 경로(다른 페이지에서 메뉴 · 홈에서 메뉴 · 주소로 바로) × 1280 · 390 — 화면 크기는 여기서 정함(기기 프로젝트는 하나만 돌려 중복 실행을 피함)
import { type Page, expect, test } from "@playwright/test";
import { openMenuIfCollapsed } from "./helpers";

const SIZES = [
  { name: "1280", viewport: { width: 1280, height: 800 } },
  { name: "390", viewport: { width: 390, height: 844 } },
];
const menuLink = (page: Page) => page.getByRole("banner").getByRole("navigation").getByRole("link", { name: "오늘 환율", exact: true });

async function clickMenu(page: Page) {
  await openMenuIfCollapsed(page);
  await menuLink(page).click();
}

const ROUTES: { name: string; go: (page: Page) => Promise<void> }[] = [
  { name: "다른 페이지에서 메뉴", go: async (page) => { await page.goto("/currencies"); await clickMenu(page); } },
  { name: "홈에서 메뉴", go: async (page) => { await page.goto("/"); await page.waitForLoadState("load"); await page.waitForTimeout(500); await clickMenu(page); } },
  { name: "주소로 바로 (/#today)", go: async (page) => { await page.goto("/#today"); } },
];

const titleTop = (page: Page) => page.locator("#destinations-title").evaluate((el) => el.getBoundingClientRect().top);

for (const size of SIZES) {
  test.describe(`오늘 환율 도착 위치 · ${size.name}`, () => {
    test.use({ viewport: size.viewport });
    test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== "넓은 화면", "화면 크기는 파일 안에서 정함 — 한 번만 실행"));

    for (const route of ROUTES) {
      test(route.name, async ({ page }) => {
        await route.go(page);
        await expect(page).toHaveURL(/\/#today$/);
        await page.waitForTimeout(300);
        const early = await titleTop(page);
        await page.waitForTimeout(1700);

        const nav = await page.getByRole("banner").boundingBox();
        const t = await page.locator("#destinations-title").boundingBox();
        expect(nav && t, "메뉴 · 제목 위치").toBeTruthy();
        const navBottom = (nav?.y ?? 0) + (nav?.height ?? 0);

        // 제목이 화면 안 · 고정 메뉴 아래 (메뉴 뒤에 숨지 않음)
        expect(t!.y, "제목 위 끝이 메뉴 아래").toBeGreaterThanOrEqual(navBottom - 1);
        expect(t!.y + t!.height, "제목이 화면 안").toBeLessThanOrEqual(size.viewport.height);
        // 메뉴 바로 아래(라벨 · 제목이 첫 화면 위쪽) — 탑승권 중간이 아니라 구역 맨 위로 도착
        expect(t!.y - navBottom, "메뉴와 제목 사이").toBeLessThan(220);
        // 탑승권 카드가 아니라 이 구역이 도착 자리 — 구역 맨 위가 메뉴 뒤로 들어가지 않음
        const sec = await page.locator("#today").boundingBox();
        expect(sec!.y, "#today 구역 맨 위가 메뉴 아래").toBeGreaterThanOrEqual(navBottom - 1);
        await expect(page.locator("#today").getByRole("heading", { name: "도착지별 환전 타이밍" })).toBeInViewport();
        await expect(page.locator("#board")).not.toBeInViewport({ ratio: 0.5 });

        // 알약으로 접힌 채 남지 않음 — 펼친 상태(final) · 보이는 알약 없음
        const list = page.locator('[data-testid="dest-list"]');
        await expect.poll(async () => (await list.getAttribute("data-state")) ?? "final", { timeout: 5000 }).toBe("final");
        const pill = page.locator('[data-testid="dest-pill"]');
        expect(await pill.count() === 0 || !(await pill.first().isVisible()) || ((await pill.first().boundingBox())?.height ?? 0) === 0, "보이는 알약 없음").toBe(true);
        await expect(page.locator('[data-testid="dest-row"]').first()).toBeVisible();

        // 펼치면서 도착 위치가 밀리지 않음 — 0.3초 뒤와 2초 뒤 제목 위치 차이가 작음
        const late = await titleTop(page);
        expect(Math.abs(late - early), `제목 위치 변화 ${early} → ${late}`).toBeLessThanOrEqual(8);
      });
    }

    test("같은 홈에서 메뉴를 다시 눌러도(hash 만 바뀜) 접힌 알약이면 바로 펼침", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("load");
      await page.waitForTimeout(500);
      await clickMenu(page);
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, 0)); // 위로 올라가면 카드는 다시 아래에 있음
      await page.waitForTimeout(500);
      await clickMenu(page);
      await page.waitForTimeout(1500);
      const list = page.locator('[data-testid="dest-list"]');
      await expect.poll(async () => (await list.getAttribute("data-state")) ?? "final", { timeout: 5000 }).toBe("final");
      await expect(page.locator("#destinations-title")).toBeInViewport();
    });
  });
}

test("옛 주소 /#today 와 메뉴 링크 주소는 그대로 /#today · 탑승권은 #board", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "넓은 화면", "한 번만 실행");
  await page.goto("/");
  await expect(page.locator("#board")).toHaveCount(1);
  await expect(page.locator("#board")).toContainText("이번 주 가장 싸게 갈 수 있는 곳");
  await expect(page.locator("#today")).toHaveCount(1);
  await expect(page.locator("#destinations")).toHaveCount(0);
  await expect(menuLink(page)).toHaveAttribute("href", "/#today");
});

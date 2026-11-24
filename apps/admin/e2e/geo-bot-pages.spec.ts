// 작업 0226 — /geo '봇별 읽은 페이지' 카드 e2e · 테스트 먼저
//   기준 화면: 지금 운영 /geo 의 'AI 봇이 읽은 페이지' 카드(.tmp/screen-1119/geo-ref/읽은페이지-1280.png · 390.png — BarList: 경로 · 막대 · 횟수)와 같은 문법
//   DOM: data-testid="geo-bot-pages"(카드) 안에 "bot-pages-bot"[data-bot=이름](봇마다 · 제목 h3 + 글 '이름 · 총 N회 · M곳') · "bar-row"[data-value=횟수](경로 막대) · "bot-pages-rest"('그 밖 N곳 · M회')
//   빈 상태 글 '아직 기록이 없습니다.' · 브라우저가 받는 /bff/geo 를 가짜 응답으로 바꿔 숫자를 정함 (rename-compare.spec.ts 와 같은 방식)
import { type Page, expect, test } from "@playwright/test";
import { quietSession } from "./helpers";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;

const BASE = { since: "2026-10-19", firstDay: "2026-11-05", bots: [{ name: "GPTBot", kind: "training", hits: 14, lastDay: "2026-11-18" }], referrals: [], pages: [], verifiedDay: null, search: null, answers: null, daily: [], answerDays: [] };
const path = (i: number, hits: number) => ({ path: `/p${i}`, hits });
const WITH_PAGES = {
  ...BASE,
  botPages: [
    // GPTBot 경로 7개 → 상위 5개 막대 + '그 밖 2곳 · 90회'
    { name: "GPTBot", kind: "training", hits: 1234, paths: [path(1, 100), path(2, 90), path(3, 80), path(4, 70), path(5, 60), path(6, 50), path(7, 40)] },
    // 검색 엔진 봇도 포함 · 경로가 정확히 2개 → '그 밖' 없음
    { name: "Googlebot", kind: "engine", hits: 10, paths: [{ path: "/", hits: 9 }, { path: "/robots.txt", hits: 1 }] },
    // 경로가 없는 봇은 카드에 안 나옴
    { name: "ClaudeBot", kind: "training", hits: 0, paths: [] },
  ],
};

async function open(page: Page, body: object) {
  await quietSession(page); // 작업 0352: 안내 창 확인용 /session 이 정적 서버에서 404 → 콘솔 'Failed to load resource' 오류(작업 0326 뒤) — 알 수 없는 모양 200 으로 조용히
  await page.route("**/bff/geo*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }));
  await page.goto("/geo");
}

test.describe("/geo 봇별 읽은 페이지 카드 (작업 0226)", () => {
  test("카드 제목 · 봇마다 한 묶음(경로 없는 봇은 없음) · 봇은 받은 순서(합계 많은 순)", async ({ page }) => {
    await open(page, WITH_PAGES);
    const card = tid(page, "geo-bot-pages");
    await expect(card).toBeVisible();
    await expect(card.getByRole("heading", { name: "봇별 읽은 페이지" })).toBeVisible();
    const bots = card.locator('[data-testid="bot-pages-bot"]');
    await expect(bots).toHaveCount(2);
    expect(await bots.evaluateAll((els) => els.map((e) => e.getAttribute("data-bot")))).toEqual(["GPTBot", "Googlebot"]);
    await expect(card.locator('[data-testid="bot-pages-bot"][data-bot="ClaudeBot"]')).toHaveCount(0);
  });

  test("봇 제목 글 '이름 · 총 N회 · M곳'(쉼표) · 막대는 상위 5개 · 숫자 = 응답 · 같은 숫자가 글로도", async ({ page }) => {
    await open(page, WITH_PAGES);
    const gpt = tid(page, "geo-bot-pages").locator('[data-testid="bot-pages-bot"][data-bot="GPTBot"]');
    await expect(gpt).toContainText("GPTBot · 총 1,234회 · 7곳");
    const rows = gpt.locator('[data-testid="bar-row"]');
    await expect(rows).toHaveCount(5);
    expect(await rows.evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-value"))))).toEqual([100, 90, 80, 70, 60]);
    for (let i = 0; i < 5; i++) {
      await expect(rows.nth(i)).toContainText(`/p${i + 1}`);
      await expect(rows.nth(i)).toContainText(String(100 - i * 10));
    }
    await expect(gpt.locator('[data-testid="bot-pages-rest"]')).toHaveText("그 밖 2곳 · 90회");
  });

  test("검색 엔진 봇(Googlebot)도 나오고 · 경로가 5개 이하면 '그 밖' 없음 · 큰 막대 100% 비례", async ({ page }) => {
    await open(page, WITH_PAGES);
    const g = tid(page, "geo-bot-pages").locator('[data-testid="bot-pages-bot"][data-bot="Googlebot"]');
    await expect(g).toContainText("Googlebot · 총 10회 · 2곳");
    await expect(g.locator('[data-testid="bar-row"]')).toHaveCount(2);
    await expect(g.locator('[data-testid="bot-pages-rest"]')).toHaveCount(0);
    // 막대 길이 비례 — 첫 줄(9)이 둘째 줄(1)보다 훨씬 김
    // 작업 0305: 어드민 막대는 화면에 들어올 때 채워지는 움직임이 있어(작업 0303) 그려진 폭 대신 정한 폭(style width %)으로 비교
    const widths = await g.locator('[data-testid="bar-row"]').evaluateAll((rows) => rows.map((r) => Number.parseFloat((r.querySelector("[style*='width']") as HTMLElement | null)?.style.width ?? "0")));
    expect(widths[0]).toBeGreaterThan(widths[1] * 3);
  });

  test("필드가 없는 옛 응답 · 빈 배열 · 경로 없는 봇뿐 — 빈 상태 글 '아직 기록이 없습니다.' · 숫자를 만들지 않음", async ({ page }) => {
    for (const body of [BASE, { ...BASE, botPages: [] }, { ...BASE, botPages: [{ name: "ClaudeBot", kind: "training", hits: 0, paths: [] }] }]) {
      await page.unrouteAll({ behavior: "ignoreErrors" });
      await open(page, body);
      const card = tid(page, "geo-bot-pages");
      await expect(card).toBeVisible();
      await expect(card).toContainText("아직 기록이 없습니다"); // 작업 0305: 어드민 빈 상태 글은 마침표 없음(작업 0303)
      await expect(card.locator('[data-testid="bot-pages-bot"]')).toHaveCount(0);
      await expect(card.locator('[data-testid="bar-row"]')).toHaveCount(0);
    }
  });

  test("다른 카드와 같은 격자 안(넓은 화면 2열 · 휴대폰 1열) · 가로 넘침 0 · 막대 줄이 카드 안", async ({ page }) => {
    await open(page, WITH_PAGES);
    const card = tid(page, "geo-bot-pages");
    await expect(card).toBeVisible();
    const grid = (await tid(page, "geo-grid").boundingBox())!;
    const c = (await card.boundingBox())!;
    expect(c.x).toBeGreaterThanOrEqual(grid.x - 1);
    expect(c.x + c.width).toBeLessThanOrEqual(grid.x + grid.width + 1);
    const other = (await tid(page, "geo-pages").boundingBox())!; // 기존 '읽은 페이지' 카드
    // 폭: 휴대폰은 같은 1열 · 넓은 화면은 기존 네 장의 짝을 깨지 않게 아래 한 줄 전체 폭(= 격자 폭 · 작업 0226 gate 실패 뒤 정함)
    if (isPhone(page)) expect(Math.abs(c.width - other.width)).toBeLessThan(1);
    else expect(Math.abs(c.width - grid.width)).toBeLessThan(2);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, "가로 넘침").toBeLessThanOrEqual(1);
    const bad = await card.locator('[data-testid="bar-row"]').evaluateAll((rows, box) => rows.filter((r) => { const b = r.getBoundingClientRect(); return b.left < box.x - 1 || b.right > box.x + box.w + 1; }).length, { x: c.x, w: c.width });
    expect(bad, "카드 밖으로 나간 줄").toBe(0);
  });

  test("긴 경로 · 봇이 많아도 글이 서로 겹치지 않음(줄 상자 위아래 겹침 0)", async ({ page }) => {
    const longPath = "/currencies/USD?from=session&utm_source=very-long-campaign-name";
    await open(page, { ...BASE, botPages: [{ name: "OAI-SearchBot", kind: "search", hits: 120000, paths: [{ path: longPath, hits: 90000 }, { path: "/a", hits: 30000 }] }, ...WITH_PAGES.botPages] });
    // 작업 0305: 봇 카드가 격자로 나란히 놓여(작업 0303) 겹침은 카드 안 줄끼리 봄
    for (const bot of await tid(page, "geo-bot-pages").locator('[data-testid="bot-pages-bot"]').all()) {
      const boxes = await bot.locator('[data-testid="bar-row"]').evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { t: r.top, b: r.bottom }; }));
      for (let i = 1; i < boxes.length; i++) expect(boxes[i].t, `줄 ${i + 1} 이 앞줄과 겹침`).toBeGreaterThanOrEqual(boxes[i - 1].b - 1);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
    await expect(tid(page, "geo-bot-pages")).toContainText("OAI-SearchBot · 총 120,000회 · 2곳");
  });

  test("콘솔 오류 없음", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await open(page, WITH_PAGES);
    await expect(tid(page, "geo-bot-pages")).toBeVisible();
    expect(errors).toEqual([]);
  });
});

// 작업 0324 — 어드민 "유입" 화면(/traffic · GA4) (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   브라우저가 받는 /bff/ga4 를 가짜 응답으로 바꿔 숫자를 정함 (ig-insights.spec.ts · geo-bot-pages.spec.ts 와 같은 방식) · 응답 모양은 apps/api/src/features/ga4/summary.test.ts 의 Ga4Report
//   화면 약속(builder 가 이 이름으로 만듦) — /traffic 화면 안에서:
//     data-testid="traffic-daily"     날짜별 표 — 줄 "traffic-daily-row"[data-day] · 칸 data-col="day"(YYYY-MM-DD) · "users" · "sessions" · "pageViews"(쉼표 숫자)
//     data-testid="traffic-sources"   유입 경로 표 — 줄 "traffic-source-row" · 칸 data-col="source" · "medium" · "campaign"(받은 그대로 · 빈 글은 빈 칸) · "sessions" · "users"
//     data-testid="traffic-pages"     많이 본 페이지 표 — 줄 "traffic-page-row" · 칸 data-col="path" · "views"
//     data-testid="traffic-empty"     날짜별 · 유입 경로 · 페이지가 모두 없을 때 — '아직 받은 유입 값이 없습니다'
//     data-testid="traffic-error"     /bff/ga4 가 실패했을 때 — '유입 값을 받지 못했습니다' · 화면의 나머지(제목 · 어드민 메뉴)는 그대로
//   작업 0374 — 사람 판별 · 인스타 유입 (응답 모양은 apps/api/src/features/ga4/human.test.ts · instagram.test.ts 의 Ga4Report human · instagram):
//     날짜별 표 칸 추가 — data-col="engagedSessions"(참여 세션 쉼표) · "engagedRate"(소수 한 자리 %) · "secondsPerUser"(사용자당 참여 시간 초) · 자료가 없거나 받지 못한 값은 칸이 있고 글이 빈 칸(0 도 '-' 도 아님)
//     data-testid="traffic-instagram"  인스타 유입 표 — 줄 "traffic-instagram-row"[data-kind=link|utm] · 칸 data-col="label"("인스타(링크)" · "인스타(utm)") · "sessions" · "users" · 응답의 instagram 이 null 이면 이 표가 없음
//   어드민 메뉴: "유입"(/traffic · 단축키 5) — 메뉴가 일곱이 되는 것은 인스타 유입(/instagram · 6)와 함께(ig-insights.spec.ts) · 기존 메뉴 개수 검사(admin.spec.ts)는 구현 뒤 맞춤
import { type Page, expect, test } from "@playwright/test";
import { hydrated } from "./helpers";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 820;

const REPORT = {
  daily: [
    { day: "2026-11-23", users: 1234, sessions: 1500, pageViews: 5678 },
    { day: "2026-11-22", users: 0, sessions: 0, pageViews: 0 },
  ],
  sources: [
    { source: "instagram", medium: "social", campaign: "daily-20261123", sessions: 3210, users: 3000 },
    { source: "facebook", medium: "paid_social", campaign: "profile", sessions: 120, users: 110 },
    { source: "(direct)", medium: "(none)", campaign: "(not set)", sessions: 50, users: 40 },
    { source: "google", medium: "organic", campaign: "", sessions: 7, users: 6 },
  ],
  pages: [
    { path: "/", views: 4000 },
    { path: "/calc", views: 900 },
    { path: "/currencies/USD", views: 50 },
  ],
};

async function open(page: Page, body: object, status = 200) {
  await page.route("**/bff/ga4*", (route) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }));
  await page.goto("/traffic");
}
const cell = (page: Page, table: string, rowId: string, nth: number, col: string) => tid(page, table).locator(`[data-testid="${rowId}"]`).nth(nth).locator(`[data-col="${col}"]`);
const text = async (page: Page, table: string, rowId: string, nth: number, col: string) => ((await cell(page, table, rowId, nth, col).innerText()) ?? "").replace(/\s+/g, " ").trim();

const HUMAN = {
  from: "2026-11-03",
  to: "2026-11-30",
  days: [
    { day: "2026-11-23", users: 1234, sessions: 1500, engagedSessions: 900, engagementSeconds: 12340 },
    { day: "2026-11-22", users: 0, sessions: 0, engagedSessions: null, engagementSeconds: null },
  ],
  devices: [{ name: "mobile", users: 1000, sessions: 1200, engagedSessions: 700 }],
  countries: [{ name: "South Korea", users: 1100, sessions: 1400, engagedSessions: 850 }],
};
const INSTAGRAM = { link: { sessions: 3210, users: 3000 }, utm: { sessions: 12, users: 10 } };

test.describe("어드민 유입 화면 — GA4 (작업 0324)", () => {
  test("메뉴에 '유입'(/traffic) — 지금 화면 표시 · h1 하나 · 섹션 제목(h2)", async ({ page }) => {
    await open(page, REPORT);
    const nav = page.getByRole("navigation", { name: "어드민 메뉴" }).filter({ visible: true });
    await expect(nav.getByRole("link", { name: /^유입/ })).toHaveAttribute("href", "/traffic");
    await expect(nav.locator('a[aria-current="page"]')).toContainText("유입");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    // 작업 0353: 표 제목(h2)은 브라우저가 /bff/ga4 를 받은 뒤에 생김(빌드 때는 열쇠가 없어 401 · 작업 0326) — goto 직후엔 '받는 중' 판 하나뿐이라 자료가 그려진 뒤에 셈
    await expect(tid(page, "traffic-daily")).toBeVisible();
    expect(await page.getByRole("heading", { level: 2 }).count(), "섹션 제목").toBeGreaterThanOrEqual(3);
  });

  test("숫자 단축키 5 로 /traffic 에 감 (넓은 화면)", async ({ page }) => {
    test.skip(isPhone(page), "글쇠 단축키는 넓은 화면");
    await page.route("**/bff/ga4*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(REPORT) }));
    await page.goto("/log");
    await hydrated(page.locator(".adm-find"));
    await page.keyboard.press("5");
    await expect(page).toHaveURL(/\/traffic\/?$/);
  });

  test("날짜별 표 — 응답 순서(최근 날부터) · 날짜 · 사용자 · 세션 · 페이지뷰(쉼표) · 받은 0 은 0", async ({ page }) => {
    await open(page, REPORT);
    const rows = tid(page, "traffic-daily").locator('[data-testid="traffic-daily-row"]');
    await expect(rows).toHaveCount(2);
    expect(await rows.evaluateAll((els) => els.map((e) => e.getAttribute("data-day")))).toEqual(["2026-11-23", "2026-11-22"]);
    await expect(cell(page, "traffic-daily", "traffic-daily-row", 0, "day")).toContainText("2026-11-23");
    await expect(cell(page, "traffic-daily", "traffic-daily-row", 0, "users")).toContainText("1,234");
    await expect(cell(page, "traffic-daily", "traffic-daily-row", 0, "sessions")).toContainText("1,500");
    await expect(cell(page, "traffic-daily", "traffic-daily-row", 0, "pageViews")).toContainText("5,678");
    for (const col of ["users", "sessions", "pageViews"]) expect(await text(page, "traffic-daily", "traffic-daily-row", 1, col), `0 인 날 ${col}`).toBe("0");
  });

  test("유입 경로 표 — utm 값이 받은 그대로(instagram / social / daily-20261123 · facebook / paid_social) · 세션 · 사용자(쉼표)", async ({ page }) => {
    await open(page, REPORT);
    const rows = tid(page, "traffic-sources").locator('[data-testid="traffic-source-row"]');
    await expect(rows).toHaveCount(4);
    expect(await text(page, "traffic-sources", "traffic-source-row", 0, "source")).toBe("instagram");
    expect(await text(page, "traffic-sources", "traffic-source-row", 0, "medium")).toBe("social");
    expect(await text(page, "traffic-sources", "traffic-source-row", 0, "campaign")).toBe("daily-20261123");
    expect(await text(page, "traffic-sources", "traffic-source-row", 0, "sessions")).toBe("3,210");
    expect(await text(page, "traffic-sources", "traffic-source-row", 0, "users")).toBe("3,000");
    expect(await text(page, "traffic-sources", "traffic-source-row", 1, "medium")).toBe("paid_social");
    expect(await text(page, "traffic-sources", "traffic-source-row", 1, "campaign")).toBe("profile");
  });

  test("GA4 자리 글((direct) · (none) · (not set))은 그대로 · 빈 캠페인은 빈 칸 — 지어낸 글 · 대시 없음", async ({ page }) => {
    await open(page, REPORT);
    expect(await text(page, "traffic-sources", "traffic-source-row", 2, "source")).toBe("(direct)");
    expect(await text(page, "traffic-sources", "traffic-source-row", 2, "medium")).toBe("(none)");
    expect(await text(page, "traffic-sources", "traffic-source-row", 2, "campaign")).toBe("(not set)");
    await expect(cell(page, "traffic-sources", "traffic-source-row", 3, "campaign")).toHaveCount(1);
    expect(await text(page, "traffic-sources", "traffic-source-row", 3, "campaign"), "빈 캠페인").toBe("");
  });

  test("많이 본 페이지 표 — 경로 · 페이지뷰(쉼표) · 응답 순서", async ({ page }) => {
    await open(page, REPORT);
    const rows = tid(page, "traffic-pages").locator('[data-testid="traffic-page-row"]');
    await expect(rows).toHaveCount(3);
    expect(await text(page, "traffic-pages", "traffic-page-row", 0, "path")).toBe("/");
    expect(await text(page, "traffic-pages", "traffic-page-row", 0, "views")).toBe("4,000");
    expect(await text(page, "traffic-pages", "traffic-page-row", 2, "path")).toBe("/currencies/USD");
    expect(await text(page, "traffic-pages", "traffic-page-row", 2, "views")).toBe("50");
  });

  test("빈 응답 — 빈 목록 글만 · 표에 지어낸 숫자 없음", async ({ page }) => {
    await open(page, { daily: [], sources: [], pages: [] });
    await expect(tid(page, "traffic-empty")).toContainText("아직 받은 유입 값이 없습니다");
    for (const row of ["traffic-daily-row", "traffic-source-row", "traffic-page-row"]) await expect(tid(page, row)).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("API 가 실패(500)해도 화면이 깨지지 않음 — 알림 글 · 제목 · 어드민 메뉴 그대로 · 표 없음 · 가로 넘침 0", async ({ page }) => {
    await open(page, { error: "boom" }, 500);
    await expect(tid(page, "traffic-error")).toContainText("유입 값을 받지 못했습니다");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("navigation", { name: "어드민 메뉴" }).filter({ visible: true }).getByRole("link", { name: /^유입/ })).toHaveAttribute("aria-current", "page");
    for (const row of ["traffic-daily-row", "traffic-source-row", "traffic-page-row"]) await expect(tid(page, row)).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

  test("알 수 없는 모양의 응답(오류 본문 · 빈 객체)도 깨지지 않음 · 숫자를 지어내지 않음", async ({ page }) => {
    await open(page, { unexpected: true });
    await expect(page.getByRole("navigation", { name: "어드민 메뉴" }).filter({ visible: true }).getByRole("link", { name: /^유입/ })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    for (const row of ["traffic-daily-row", "traffic-source-row", "traffic-page-row"]) await expect(tid(page, row)).toHaveCount(0);
  });

  test("표가 많아도 화면 폭을 넘지 않음 — 날짜 28줄 · 유입 경로 20줄 · 긴 캠페인 · 긴 경로 · 큰 숫자", async ({ page }) => {
    const daily = Array.from({ length: 28 }, (_, i) => ({ day: `2026-11-${String(28 - i).padStart(2, "0")}`, users: 1_234_567 + i, sessions: 9_876_543, pageViews: 98_765_432 }));
    const sources = Array.from({ length: 20 }, (_, i) => ({ source: `source-${i}`, medium: "paid_social", campaign: `daily-${"x".repeat(60)}${i}`, sessions: 1_000_000 + i, users: 900_000 }));
    const pages = Array.from({ length: 20 }, (_, i) => ({ path: `/currencies/${"A".repeat(60)}${i}`, views: 12_345_678 }));
    await open(page, { daily, sources, pages });
    await expect(tid(page, "traffic-daily").locator('[data-testid="traffic-daily-row"]')).toHaveCount(28);
    await expect(tid(page, "traffic-sources").locator('[data-testid="traffic-source-row"]')).toHaveCount(20);
    await expect(tid(page, "traffic-pages").locator('[data-testid="traffic-page-row"]')).toHaveCount(20);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), "가로 넘침").toBeLessThanOrEqual(0);
  });
});

test.describe("어드민 유입 화면 — 사람 판별 · 인스타 유입 (작업 0374)", () => {
  test("날짜별 표에 참여 세션 · 참여율 · 사용자당 참여 시간 — 사용자 · 세션 칸은 그대로", async ({ page }) => {
    await open(page, { ...REPORT, human: HUMAN, instagram: INSTAGRAM });
    await expect(cell(page, "traffic-daily", "traffic-daily-row", 0, "users")).toContainText("1,234");
    await expect(cell(page, "traffic-daily", "traffic-daily-row", 0, "sessions")).toContainText("1,500");
    expect(await text(page, "traffic-daily", "traffic-daily-row", 0, "engagedSessions")).toBe("900");
    expect(await text(page, "traffic-daily", "traffic-daily-row", 0, "engagedRate")).toBe("60.0%");
    expect(await text(page, "traffic-daily", "traffic-daily-row", 0, "secondsPerUser")).toBe("10.0");
  });

  test("받지 못한 날(참여 값 null · 세션 0)은 칸은 있고 글이 빈 칸 — 0 · '-' · NaN 이 없음", async ({ page }) => {
    await open(page, { ...REPORT, human: HUMAN, instagram: INSTAGRAM });
    for (const col of ["engagedSessions", "engagedRate", "secondsPerUser"]) {
      await expect(cell(page, "traffic-daily", "traffic-daily-row", 1, col)).toHaveCount(1);
      expect(await text(page, "traffic-daily", "traffic-daily-row", 1, col), `받지 못한 날 ${col}`).toBe("");
    }
  });

  test("첫 수집 전(human 없음)에는 참여 칸이 모두 빈 칸 · 나머지 표는 그대로 · 인스타 표도 없음", async ({ page }) => {
    await open(page, REPORT);
    for (const col of ["engagedSessions", "engagedRate", "secondsPerUser"]) {
      await expect(cell(page, "traffic-daily", "traffic-daily-row", 0, col)).toHaveCount(1);
      expect(await text(page, "traffic-daily", "traffic-daily-row", 0, col)).toBe("");
    }
    await expect(cell(page, "traffic-daily", "traffic-daily-row", 0, "users")).toContainText("1,234");
    await expect(tid(page, "traffic-instagram")).toHaveCount(0);
  });

  test("인스타 유입 표 — 링크(리퍼러)와 utm 두 줄 · 세션 · 사용자(쉼표)", async ({ page }) => {
    await open(page, { ...REPORT, human: HUMAN, instagram: INSTAGRAM });
    const rows = tid(page, "traffic-instagram").locator('[data-testid="traffic-instagram-row"]');
    await expect(rows).toHaveCount(2);
    expect(await rows.evaluateAll((els) => els.map((e) => e.getAttribute("data-kind")))).toEqual(["link", "utm"]);
    expect(await text(page, "traffic-instagram", "traffic-instagram-row", 0, "label")).toBe("인스타(링크)");
    expect(await text(page, "traffic-instagram", "traffic-instagram-row", 0, "sessions")).toBe("3,210");
    expect(await text(page, "traffic-instagram", "traffic-instagram-row", 0, "users")).toBe("3,000");
    expect(await text(page, "traffic-instagram", "traffic-instagram-row", 1, "label")).toBe("인스타(utm)");
    expect(await text(page, "traffic-instagram", "traffic-instagram-row", 1, "sessions")).toBe("12");
  });

  test("인스타 유입 받은 0 은 0 으로 보임 · 가로 넘침 0", async ({ page }) => {
    await open(page, { ...REPORT, human: HUMAN, instagram: { link: { sessions: 0, users: 0 }, utm: { sessions: 0, users: 0 } } });
    for (const n of [0, 1]) for (const col of ["sessions", "users"]) expect(await text(page, "traffic-instagram", "traffic-instagram-row", n, col)).toBe("0");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});

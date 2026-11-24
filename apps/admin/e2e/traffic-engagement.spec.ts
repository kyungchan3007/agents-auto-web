// 작업 0349 — 어드민 /traffic "페이지별 머무름" 표 e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   브라우저가 받는 /bff/ga4 를 가짜 응답으로 바꿈 (traffic.spec.ts 와 같은 방식) · 응답 모양: packages/shared 의 Ga4Report(engagement · baseline 추가) — 계산은 engagement-view.test.ts
//   builder 가 다는 표시(data-testid) — /traffic 안
//     traffic-engagement            "페이지별 머무름" 표 판 (제목 h2 "페이지별 머무름" · 부제 "최근 28일")
//       traffic-engagement-row      줄(페이지마다) · 칸 data-col="path" · "views" · "engagementRate" · "bounceRate" · "perSession"
//         [data-testid="delta"]     칸 안의 오르내림 글(기준값이 있을 때만) · data-dir="up" | "down" | "same"
//       traffic-engagement-baseline 표 아래 한 줄 — baselineNote 글("기준값: … (시작 날 고정)" · "기준값 없음")
//     traffic-engagement-empty      오늘 값이 없을 때 "자료 없음" (표 없음) — 날짜별 · 유입 경로 · 많이 본 페이지 표는 그대로 보임
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);

const pg = (path: string, views: number, eng: number, vps: number) => ({ path, views, sessions: Math.round(views / vps), engagementRate: eng, bounceRate: Math.round((1 - eng) * 10000) / 10000, viewsPerSession: vps });
const BASE_REPORT = {
  daily: [{ day: "2026-11-25", users: 10, sessions: 12, pageViews: 30 }],
  sources: [{ source: "google", medium: "organic", campaign: "", sessions: 7, users: 6 }],
  pages: [{ path: "/", views: 4000 }],
};
const ENGAGEMENT = { from: "2026-10-29", to: "2026-11-25", pages: [pg("/prices/JPN", 1200, 0.6523, 1.8412), pg("/", 4000, 0.55, 1.2), pg("/new", 30, 0.4, 1)] };
const BASELINE = { from: "2026-10-28", to: "2026-11-24", pages: [pg("/", 3900, 0.5, 1.1), pg("/prices/JPN", 900, 0.6, 1.5)] };

async function open(page: Page, extra: object) {
  await page.route("**/bff/ga4*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...BASE_REPORT, ...extra }) }));
  await page.goto("/traffic");
}
const row = (page: Page, n: number) => tid(page, "traffic-engagement").locator('[data-testid="traffic-engagement-row"]').nth(n);
const col = async (page: Page, n: number, c: string) => ((await row(page, n).locator(`[data-col="${c}"]`).innerText()) ?? "").replace(/\s+/g, " ").trim();

test.describe("어드민 유입 — 페이지별 머무름 (작업 0349 · 시안 4)", () => {
  test("자료 있음 — 제목 · 페이지 · 페이지뷰(쉼표) · 참여율 · 이탈률 · 세션당 페이지뷰 · 받은 순서", async ({ page }) => {
    await open(page, { engagement: ENGAGEMENT, baseline: BASELINE });
    await expect(tid(page, "traffic-engagement").getByRole("heading", { name: "페이지별 머무름" })).toBeVisible();
    await expect(tid(page, "traffic-engagement")).toContainText("최근 28일");
    await expect(tid(page, "traffic-engagement").locator('[data-testid="traffic-engagement-row"]')).toHaveCount(3);
    expect(await col(page, 0, "path")).toBe("/prices/JPN");
    expect(await col(page, 0, "views")).toBe("1,200");
    expect(await col(page, 0, "engagementRate")).toContain("65.2%");
    expect(await col(page, 0, "bounceRate")).toContain("34.8%");
    expect(await col(page, 0, "perSession")).toContain("1.8쪽");
    expect(await col(page, 1, "path")).toBe("/");
  });

  test("기준값이 있으면 오르내림 — 오르면 + · 내리면 - · 새 페이지(기준값에 없음)는 비움", async ({ page }) => {
    await open(page, { engagement: ENGAGEMENT, baseline: BASELINE });
    const d = (n: number, c: string) => row(page, n).locator(`[data-col="${c}"] [data-testid="delta"]`);
    await expect(d(0, "engagementRate")).toHaveText("+5.2%p");
    await expect(d(0, "engagementRate")).toHaveAttribute("data-dir", "up");
    await expect(d(0, "bounceRate")).toHaveText("-5.2%p");
    await expect(d(0, "bounceRate")).toHaveAttribute("data-dir", "down");
    await expect(d(0, "perSession")).toHaveText("+0.3쪽");
    await expect(d(2, "engagementRate"), "기준값에 없는 새 페이지").toHaveCount(0);
    await expect(tid(page, "traffic-engagement-baseline")).toContainText("기준값: 2026-10-28 ~ 2026-11-24");
  });

  test("기준값이 없으면 오르내림 칸이 비어 있음 · 값은 그대로 · '기준값 없음' 안내", async ({ page }) => {
    await open(page, { engagement: ENGAGEMENT });
    await expect(tid(page, "traffic-engagement").locator('[data-testid="traffic-engagement-row"]')).toHaveCount(3);
    await expect(tid(page, "traffic-engagement").locator('[data-testid="delta"]')).toHaveCount(0);
    expect(await col(page, 0, "engagementRate")).toContain("65.2%");
    await expect(tid(page, "traffic-engagement-baseline")).toContainText("기준값 없음");
  });

  test("자료 없음 — 표 없이 '자료 없음' · 다른 표(날짜별 · 유입 경로 · 많이 본 페이지)는 그대로", async ({ page }) => {
    await open(page, {}); // 예전 응답: engagement · baseline 없음
    await expect(tid(page, "traffic-engagement-empty")).toContainText("자료 없음");
    await expect(tid(page, "traffic-engagement-row")).toHaveCount(0);
    await expect(tid(page, "traffic-daily-row")).toHaveCount(1);
    await expect(tid(page, "traffic-source-row")).toHaveCount(1);
    await expect(tid(page, "traffic-page-row")).toHaveCount(1);
  });

  test("기준값만 있고 오늘 값이 없어도 '자료 없음' (기준값으로 표를 만들지 않음)", async ({ page }) => {
    await open(page, { engagement: null, baseline: BASELINE });
    await expect(tid(page, "traffic-engagement-empty")).toContainText("자료 없음");
    await expect(tid(page, "traffic-engagement-row")).toHaveCount(0);
  });

  test("페이지 경로가 HTML 이어도 글자 그대로 (외부 데이터)", async ({ page }) => {
    await open(page, { engagement: { ...ENGAGEMENT, pages: [pg("/<img src=x onerror=alert(1)>", 5, 0.5, 1)] } });
    expect(await col(page, 0, "path")).toBe("/<img src=x onerror=alert(1)>");
    await expect(tid(page, "traffic-engagement").locator("img")).toHaveCount(0);
  });

  test("스무 줄 · 긴 경로에도 화면 폭을 넘지 않음", async ({ page }) => {
    const pages = Array.from({ length: 20 }, (_, i) => pg(`/prices/${"A".repeat(60)}${i}`, 12_345_678 - i, 0.5, 1.5));
    await open(page, { engagement: { ...ENGAGEMENT, pages }, baseline: { ...BASELINE, pages } });
    await expect(tid(page, "traffic-engagement").locator('[data-testid="traffic-engagement-row"]')).toHaveCount(20);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), "가로 넘침").toBeLessThanOrEqual(0);
  });
});

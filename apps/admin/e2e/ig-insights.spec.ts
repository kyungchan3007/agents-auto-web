// 작업 0323 — 어드민 알리기 탭의 인스타 성과 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   브라우저가 받는 /bff/ig 를 가짜 응답으로 바꿔 숫자를 정함 (geo-bot-pages.spec.ts 와 같은 방식) · 응답 모양은 apps/api/src/features/ig/summary.test.ts 의 IgReport
//   화면 약속(builder 가 이 이름으로 만듦) — 알리기 탭(/marketing) 안에서:
//     data-testid="ig-account"            계정 칸 — 가장 최근 날 값
//       "ig-account-day"                    받은 날짜 글(YYYY-MM-DD)
//       "ig-account-metric"[data-metric=reach|views|profileViews|websiteClicks|accountsEngaged]  지표마다 · 글 = 쉼표 숫자 · 받지 못한 값(null)은 글이 빈 칸(0 도 '-' 도 아님)
//     data-testid="ig-media"              게시물 표 — 줄 data-testid="ig-media-row"[data-media-id]
//       칸 data-col="postedAt"(게시 날짜 YYYY-MM-DD) · "link"(a[href=게시물 링크]) · "reach" · "likes" · "saved" · "shares" · "views"(쉼표 숫자 · null 은 빈 칸) · "day"(받은 날짜 · null 은 빈 칸)
//     data-testid="ig-empty"              계정 · 게시물 모두 없을 때 — '아직 받은 성과 값이 없습니다'
//     data-testid="ig-error"              /bff/ig 가 실패했을 때 — '성과 값을 받지 못했습니다' · 탭의 나머지(소재 초안 · 광고 운영)는 그대로
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);

const ACCOUNT_NEW = { day: "2026-11-23", reach: 1234, views: 5678, profileViews: 0, websiteClicks: null, accountsEngaged: 12 };
const ACCOUNT_OLD = { day: "2026-11-22", reach: 99, views: 100, profileViews: 7, websiteClicks: 3, accountsEngaged: 1 };
const M1 = { mediaId: "1790001", postedAt: "2026-11-22T03:31:00+0000", permalink: "https://www.instagram.com/p/DgEa3g3j97X/", kind: "CAROUSEL_ALBUM", day: "2026-11-23", reach: 2500, likes: 31, saved: 0, shares: null, views: 12000 };
const M2 = { mediaId: "1790002", postedAt: "2026-11-20T03:00:00+0000", permalink: "https://www.instagram.com/p/AAAA1111/", kind: "IMAGE", day: null, reach: null, likes: null, saved: null, shares: null, views: null };
const REPORT = { account: [ACCOUNT_NEW, ACCOUNT_OLD], media: [M1, M2] };

async function open(page: Page, body: object, status = 200) {
  await page.route("**/bff/ig*", (route) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }));
  await page.goto("/marketing");
}
const metric = (page: Page, m: string) => tid(page, "ig-account").locator(`[data-testid="ig-account-metric"][data-metric="${m}"]`);
const cell = (page: Page, mediaId: string, col: string) => tid(page, "ig-media").locator(`[data-testid="ig-media-row"][data-media-id="${mediaId}"] [data-col="${col}"]`);

test.describe("알리기 — 인스타 성과 (작업 0323)", () => {
  test("계정 칸 — 가장 최근 날 값(쉼표) · 받은 날짜 · 옛 날 값은 안 보임", async ({ page }) => {
    await open(page, REPORT);
    await expect(tid(page, "ig-account")).toBeVisible();
    await expect(tid(page, "ig-account-day")).toContainText("2026-11-23");
    await expect(metric(page, "reach")).toContainText("1,234");
    await expect(metric(page, "views")).toContainText("5,678");
    await expect(metric(page, "accountsEngaged")).toContainText("12");
    await expect(tid(page, "ig-account")).not.toContainText("2026-11-22");
    await expect(tid(page, "ig-account")).not.toContainText("99"); // 옛 날 도달
  });

  test("받은 0 은 0 으로 · 받지 못한 값(null)은 빈 칸 — 0 · '-' 로 채우지 않음", async ({ page }) => {
    await open(page, REPORT);
    await expect(metric(page, "profileViews")).toBeVisible();
    await expect(metric(page, "profileViews")).toHaveText(/(^|\D)0(\D|$)/); // 받은 0
    // 값이 없으면 칸 글이 비어 크기가 0 일 수 있음 — 보임이 아니라 칸이 있는지(한 개)를 봄
    await expect(metric(page, "websiteClicks")).toHaveCount(1);
    const clicks = ((await metric(page, "websiteClicks").innerText()) ?? "").replace(/\s+/g, "");
    expect(clicks, "받지 못한 값 칸에 숫자 · 대시가 없음").not.toMatch(/\d|[-–—]/);
  });

  test("게시물 표 — 게시물마다 한 줄 · 게시 날짜 · 게시물 링크 · 도달 · 좋아요 · 저장 · 공유 · 조회 · 받은 날짜 (응답 순서 = 게시 최근 순)", async ({ page }) => {
    await open(page, REPORT);
    const rows = tid(page, "ig-media").locator('[data-testid="ig-media-row"]');
    await expect(rows).toHaveCount(2);
    expect(await rows.evaluateAll((els) => els.map((e) => e.getAttribute("data-media-id")))).toEqual(["1790001", "1790002"]);
    await expect(cell(page, "1790001", "postedAt")).toContainText("2026-11-22");
    await expect(cell(page, "1790001", "link").locator("a")).toHaveAttribute("href", "https://www.instagram.com/p/DgEa3g3j97X/");
    await expect(cell(page, "1790001", "reach")).toContainText("2,500");
    await expect(cell(page, "1790001", "likes")).toContainText("31");
    await expect(cell(page, "1790001", "views")).toContainText("12,000");
    await expect(cell(page, "1790001", "day")).toContainText("2026-11-23");
    await expect(cell(page, "1790001", "saved")).toHaveText(/(^|\D)0(\D|$)/); // 받은 0
  });

  test("게시물 표에서도 받지 못한 값은 빈 칸 — 공유 null · 성과 행이 없는 게시물은 전부 빈 칸(받은 날짜도)", async ({ page }) => {
    await open(page, REPORT);
    const blank = async (id: string, col: string) => ((await cell(page, id, col).innerText()) ?? "").replace(/\s+/g, "");
    await expect(cell(page, "1790001", "shares")).toBeVisible();
    expect(await blank("1790001", "shares"), "공유 null").not.toMatch(/\d|[-–—]/);
    for (const col of ["reach", "likes", "saved", "shares", "views", "day"]) {
      await expect(cell(page, "1790002", col)).toBeVisible();
      expect(await blank("1790002", col), `성과 없는 게시물 ${col}`).not.toMatch(/\d|[-–—]/);
    }
    await expect(cell(page, "1790002", "link").locator("a")).toHaveAttribute("href", "https://www.instagram.com/p/AAAA1111/"); // 줄은 있음
  });

  test("빈 응답 — 빈 목록 글만 · 계정 칸 · 표에 지어낸 숫자 없음", async ({ page }) => {
    await open(page, { account: [], media: [] });
    await expect(tid(page, "ig-empty")).toContainText("아직 받은 성과 값이 없습니다");
    await expect(tid(page, "ig-media").locator('[data-testid="ig-media-row"]')).toHaveCount(0);
    await expect(tid(page, "ig-account-day")).toHaveCount(0);
  });

  test("API 가 실패(500)해도 탭이 깨지지 않음 — 알림 글 · 소재 초안 · 광고 운영 그대로 · 가로 넘침 0", async ({ page }) => {
    await open(page, { error: "boom" }, 500);
    await expect(tid(page, "ig-error")).toContainText("성과 값을 받지 못했습니다");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Meta 광고로 이 사이트를 알립니다");
    await expect(tid(page, "marketing-drafts")).toBeVisible();
    await expect(tid(page, "marketing-ads")).toContainText("아직 연결하지 않았습니다");
    await expect(tid(page, "ig-media").locator('[data-testid="ig-media-row"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

  test("알 수 없는 모양의 응답(오류 본문 · 빈 객체)도 깨지지 않음 · 숫자를 지어내지 않음", async ({ page }) => {
    await open(page, { unexpected: true });
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Meta 광고로 이 사이트를 알립니다");
    await expect(tid(page, "marketing-drafts")).toBeVisible();
    await expect(tid(page, "ig-media").locator('[data-testid="ig-media-row"]')).toHaveCount(0);
  });

  test("표가 많아도 화면 폭을 넘지 않음 — 게시물 10줄 · 긴 링크 · 큰 숫자", async ({ page }) => {
    const many = Array.from({ length: 10 }, (_, i) => ({ ...M1, mediaId: `17${i}`, permalink: `https://www.instagram.com/p/${"A".repeat(40)}${i}/`, reach: 1_234_567 + i, views: 98_765_432 }));
    await open(page, { account: [ACCOUNT_NEW], media: many });
    await expect(tid(page, "ig-media").locator('[data-testid="ig-media-row"]')).toHaveCount(10);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), "가로 넘침").toBeLessThanOrEqual(0);
  });
});

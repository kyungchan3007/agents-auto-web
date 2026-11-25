// 작업 0359 — 어드민 /traffic "버튼 클릭" 표 e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   브라우저가 받는 /bff/ga4 를 가짜 응답으로 바꿈 (traffic-engagement.spec.ts 와 같은 방식) · 응답 모양: packages/shared 의 Ga4Report(clicks 추가) — 계산은 click-view.test.ts
//   builder 가 다는 표시(data-testid) — /traffic 안, "페이지별 머무름" 표 아래
//     traffic-clicks           "버튼 클릭" 표 판 (제목 h2 "버튼 클릭" · 부제 "최근 28일")
//       traffic-clicks-since   표 위 한 줄 — sinceText 글("이벤트를 보내기 시작한 날: 2026-11-26")
//       traffic-clicks-row     줄(이벤트마다 열두 줄) · 칸 data-col="label"(버튼 이름 한국어) · "page"(있는 페이지) · "count"(클릭 수) · "users"(누른 사람 수) · "perDay"(하루 평균)
//     traffic-clicks-empty     자료가 없을 때 "자료 없음" (표 없음) — 날짜별 · 유입 경로 · 많이 본 페이지 · 페이지별 머무름은 그대로 보임
//   글: 버튼 이름 · 있는 페이지는 packages/shared 이벤트 표(CLICK_EVENTS)의 label · page 그대로
import { CLICK_EVENTS } from "@hav/shared/click-events";
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);

const BASE_REPORT = {
  daily: [{ day: "2026-11-30", users: 10, sessions: 12, pageViews: 30 }],
  sources: [{ source: "google", medium: "organic", campaign: "", sessions: 7, users: 6 }],
  pages: [{ path: "/", views: 4000 }],
};
const CLICKS = {
  from: "2026-11-03",
  to: "2026-11-30",
  since: "2026-11-26",
  events: [
    { name: "country_all_prices", count: 1250, users: 800 },
    { name: "fx_other_pick", count: 5, users: 3 },
    { name: "country_compare", count: 20, users: 9 },
  ],
};
const labelOf = (name: string) => CLICK_EVENTS.find((e) => e.name === name)!;

async function open(page: Page, extra: object) {
  await page.route("**/bff/ga4*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ...BASE_REPORT, ...extra }) }));
  await page.goto("/traffic");
}
const rows = (page: Page) => tid(page, "traffic-clicks").locator('[data-testid="traffic-clicks-row"]');
const col = async (page: Page, n: number, c: string) => ((await rows(page).nth(n).locator(`[data-col="${c}"]`).innerText()) ?? "").replace(/\s+/g, " ").trim();

test.describe("어드민 유입 — 버튼 클릭 (작업 0359)", () => {
  test("자료 있음 — 제목 · 보내기 시작한 날 · 열두 줄 · 많이 눌린 순 · 이름 · 페이지 · 쉼표 숫자 · 하루 평균", async ({ page }) => {
    await open(page, { clicks: CLICKS });
    await expect(tid(page, "traffic-clicks").getByRole("heading", { name: "버튼 클릭" })).toBeVisible();
    await expect(tid(page, "traffic-clicks")).toContainText("최근 28일");
    await expect(tid(page, "traffic-clicks-since")).toHaveText("이벤트를 보내기 시작한 날: 2026-11-26");
    await expect(rows(page)).toHaveCount(12);
    const a = labelOf("country_all_prices");
    expect(await col(page, 0, "label")).toBe(a.label);
    expect(await col(page, 0, "page")).toBe(a.page);
    expect(await col(page, 0, "count")).toBe("1,250");
    expect(await col(page, 0, "users")).toBe("800");
    expect(await col(page, 0, "perDay")).toBe("250.0"); // 11-26 ~ 11-30 = 5일
    expect(await col(page, 1, "label")).toBe(labelOf("country_compare").label);
    expect(await col(page, 2, "label")).toBe(labelOf("fx_other_pick").label);
    expect(await col(page, 2, "perDay")).toBe("1.0");
  });

  test("보고에 없는 버튼은 0 · 0 · 0.0 (시작 날 이후라 0 번 눌린 것)", async ({ page }) => {
    await open(page, { clicks: CLICKS });
    const last = rows(page).nth(11);
    expect(((await last.locator('[data-col="count"]').innerText()) ?? "").trim()).toBe("0");
    expect(((await last.locator('[data-col="users"]').innerText()) ?? "").trim()).toBe("0");
    expect(((await last.locator('[data-col="perDay"]').innerText()) ?? "").trim()).toBe("0.0");
  });

  test("보내기 시작한 날이 기간 끝보다 뒤면 숫자 세 칸이 모두 '기록 전' (0 으로 보이지 않음)", async ({ page }) => {
    await open(page, { clicks: { ...CLICKS, events: [], since: "2026-12-05" } });
    await expect(tid(page, "traffic-clicks-since")).toHaveText("이벤트를 보내기 시작한 날: 2026-12-05");
    await expect(rows(page)).toHaveCount(12);
    for (let i = 0; i < 12; i++) for (const c of ["count", "users", "perDay"]) expect(await col(page, i, c), `${i + 1}번째 줄 ${c}`).toBe("기록 전");
  });

  test("28일이 넘게 지났으면 하루 평균은 28일로 나눔", async ({ page }) => {
    await open(page, { clicks: { ...CLICKS, since: "2026-10-01", events: [{ name: "country_compare", count: 56, users: 30 }] } });
    expect(await col(page, 0, "perDay")).toBe("2.0");
  });

  test("자료 없음 — 표 없이 '자료 없음' · 다른 표는 그대로", async ({ page }) => {
    await open(page, {}); // 예전 응답: clicks 없음
    await expect(tid(page, "traffic-clicks-empty")).toContainText("자료 없음");
    await expect(rows(page)).toHaveCount(0);
    await expect(tid(page, "traffic-daily-row")).toHaveCount(1);
    await expect(tid(page, "traffic-source-row")).toHaveCount(1);
    await expect(tid(page, "traffic-page-row")).toHaveCount(1);
  });

  test("'페이지별 머무름' 아래에 있음 · 가로 넘침 없음", async ({ page }) => {
    await open(page, { clicks: CLICKS });
    const [e, c] = [await tid(page, "traffic-engagement-empty").or(tid(page, "traffic-engagement")).first().boundingBox(), await tid(page, "traffic-clicks").boundingBox()];
    expect(c!.y, "버튼 클릭 표는 페이지별 머무름 아래").toBeGreaterThan(e!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

  test("이름이 표에 없는 이벤트가 와도 줄을 만들지 않음 (열두 줄 그대로 · 외부 데이터)", async ({ page }) => {
    await open(page, { clicks: { ...CLICKS, events: [...CLICKS.events, { name: "<img src=x onerror=alert(1)>", count: 99, users: 9 }] } });
    await expect(rows(page)).toHaveCount(12);
    await expect(tid(page, "traffic-clicks").locator("img")).toHaveCount(0);
  });
});

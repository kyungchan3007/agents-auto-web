// 작업 0341 — 작업실(/log) "오늘 팀이 한 일 · 자동 검사" 칸 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   브라우저가 받는 /bff/tasks 를 가짜 응답으로 바꿔 자료 있음 · 없음 두 경우를 정함 (traffic.spec.ts 와 같은 방식)
//   builder 가 정할 화면 약속(data-testid) — 칸은 그대로 data-testid="record-card" · id "log-live"
//     today-headline  "6개 중 4개 끝남" 한 줄 · 안에 이슈 링크(#395)
//     today-item      항목마다 · data-done="true" | "false" · 굵은 머리 글만 · 보이는 표시 "끝남" | "남음"
//     today-empty     오늘 할 일 자료가 없을 때 "자료 없음"
//     gate-count      "최근 20번 · 통과 20 · 실패 0"
//     gate-time       "걸린 시간 가운데 값 1.9분 · 최근 1.6분"
//     gate-fail       실패 줄마다 링크 (PR 을 알면 PR 주소 · 아니면 실행 주소)
//     gate-empty      검사 자료가 없을 때 "자료 없음"
import { type Page, expect, test } from "@playwright/test";
import { hydrated } from "./helpers";

const U = "https://github.com/kyungchan3007/agents-auto-web";
const tid = (page: Page, id: string) => page.getByTestId(id);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 820;

const TODAY = {
  number: 395,
  title: "오늘 할 일 2026-11-24 (화)",
  url: `${U}/issues/395`,
  items: [
    { done: true, head: "오늘 환율 수집 확인" },
    { done: true, head: "새벽 예약 수집 확인" },
    { done: true, head: "GEO 측정" },
    { done: true, head: "검색 안 되는 이유 조사(#157)" },
    { done: false, head: "인스타 11-24 게시 확인" },
    { done: false, head: "하루 마무리" },
  ],
};
const GATE = {
  total: 30,
  pass: 29,
  fail: 1,
  medianSec: 113.5,
  latestSec: 98,
  failed: [{ branch: "task/0331-readme-refresh", runUrl: `${U}/actions/runs/9`, prNumber: 381, prUrl: `${U}/pull/381` }],
};
const DONE = [{ number: 398, task: "0340", name: "작업 0340: 만드는 방식 시행착오 칸 지우기", url: `${U}/pull/398`, mergedAt: "2026-11-24T03:06:29.000Z" }];

async function mockTasks(page: Page, extra: Record<string, unknown>) {
  const body = { names: {}, done: DONE, syncedAt: "2026-11-24T03:30:00.000Z", snags: {}, snagsSince: null, ...extra };
  await page.route("**/bff/tasks*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }));
}

test.describe("작업실 — 오늘 팀이 한 일 · 자동 검사 (작업 0341)", () => {
  test("자료 있음 — 제목 · 한 줄 · 항목 끝남/남음 · 이슈 링크 · 검사 숫자 · 실패 링크", async ({ page }) => {
    await mockTasks(page, { today: TODAY, gate: GATE });
    await page.goto("/log");
    const card = tid(page, "record-card");
    await hydrated(card);
    await expect(card.getByRole("heading", { name: /오늘 팀이 한 일 · 자동 검사/ })).toBeVisible();
    await expect(card.getByRole("heading", { name: /^실시간 기록/ })).toHaveCount(0);

    await expect(tid(page, "today-headline")).toContainText("6개 중 4개 끝남");
    await expect(tid(page, "today-headline").getByRole("link", { name: "#395" })).toHaveAttribute("href", `${U}/issues/395`);
    const items = tid(page, "today-item");
    await expect(items).toHaveCount(6);
    await expect(items.nth(0)).toContainText("오늘 환율 수집 확인");
    await expect(items.nth(0)).toHaveAttribute("data-done", "true");
    await expect(items.nth(0)).toContainText("끝남");
    await expect(items.nth(5)).toContainText("하루 마무리");
    await expect(items.nth(5)).toHaveAttribute("data-done", "false");
    await expect(items.nth(5)).toContainText("남음");

    await expect(tid(page, "gate-count")).toContainText("최근 30번 · 통과 29 · 실패 1");
    await expect(tid(page, "gate-time")).toContainText("걸린 시간 가운데 값 1.9분 · 최근 1.6분");
    const fail = tid(page, "gate-fail");
    await expect(fail).toHaveCount(1);
    await expect(fail.getByRole("link")).toHaveAttribute("href", `${U}/pull/381`);
    await expect(fail).toContainText("task/0331-readme-refresh");
  });

  test("기존 '작업 NNNN 머지 · 제목' 줄은 칸에서 사라짐", async ({ page }) => {
    await mockTasks(page, { today: TODAY, gate: GATE });
    await page.goto("/log");
    await hydrated(tid(page, "record-card"));
    await expect(tid(page, "record-card")).not.toContainText("머지 ·");
    await expect(tid(page, "record-card")).not.toContainText("작업 0340 머지");
  });

  test("자료 없음 — 오늘 할 일 · 검사 둘 다 '자료 없음' (숫자를 지어내지 않음)", async ({ page }) => {
    await mockTasks(page, { today: null, gate: null });
    await page.goto("/log");
    await hydrated(tid(page, "record-card"));
    await expect(tid(page, "today-empty")).toContainText("자료 없음");
    await expect(tid(page, "gate-empty")).toContainText("자료 없음");
    await expect(tid(page, "today-item")).toHaveCount(0);
    await expect(tid(page, "gate-count")).toHaveCount(0);
    await expect(tid(page, "record-card")).not.toContainText("머지 ·");
  });

  test("한쪽만 없어도 다른 쪽은 그대로 — 검사만 있음", async ({ page }) => {
    await mockTasks(page, { today: null, gate: { ...GATE, fail: 0, failed: [] } });
    await page.goto("/log");
    await hydrated(tid(page, "record-card"));
    await expect(tid(page, "today-empty")).toContainText("자료 없음");
    await expect(tid(page, "gate-count")).toBeVisible();
    await expect(tid(page, "gate-fail")).toHaveCount(0);
  });

  test("이슈 글이 HTML 이어도 글자 그대로 보임 (남이 쓸 수 있는 글)", async ({ page }) => {
    await mockTasks(page, { today: { ...TODAY, items: [{ done: false, head: "<img src=x onerror=alert(1)>" }] }, gate: null });
    await page.goto("/log");
    await hydrated(tid(page, "record-card"));
    await expect(tid(page, "today-item").first()).toContainText("<img src=x onerror=alert(1)>");
    await expect(tid(page, "record-card").locator("img")).toHaveCount(0);
  });

  test("넓은 화면 — 팀 칸과 같은 높이 그대로 · 가로 넘침 없음", async ({ page }) => {
    await mockTasks(page, { today: TODAY, gate: GATE });
    await page.goto("/log");
    await hydrated(tid(page, "record-card"));
    if (!isPhone(page)) {
      const [a, b] = await Promise.all([tid(page, "record-card").boundingBox(), page.locator("#log-team").boundingBox()]);
      expect(Math.abs((a?.height ?? 0) - (b?.height ?? 0)), "칸 · 팀 같은 높이").toBeLessThan(2);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});

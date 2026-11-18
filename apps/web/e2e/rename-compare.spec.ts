// 작업 0205 (#243) — /geo 맨 위 "이름 바꾼 날 전후 비교": 기준일 표시 · 하루 평균(달력 날짜 분모) · 새 필드가 없을 때 "아직 없음" · 두 폭에서 겹침 · 가로 넘침 없음
//   브라우저가 받는 /bff/geo 를 가짜 응답으로 바꿈 · 후 기간 끝은 화면의 "자료 기준일"(빌드 때 한국 날짜)이라 기대값을 그 날짜에서 계산
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);

const BASE = { since: "2026-10-19", firstDay: "2026-11-05", bots: [{ name: "GPTBot", kind: "training", hits: 14, lastDay: "2026-11-18" }], referrals: [], pages: [], verifiedDay: null, search: null, answers: null };
const WITH_DAILY = {
  ...BASE,
  daily: [
    { day: "2026-11-05", kind: "training", name: "GPTBot", hits: 4 },
    { day: "2026-11-16", kind: "training", name: "GPTBot", hits: 6 },
    { day: "2026-11-17", kind: "training", name: "GPTBot", hits: 3 },
    { day: "2026-11-18", kind: "training", name: "GPTBot", hits: 1 },
    { day: "2026-11-18", kind: "referral", name: "ChatGPT", hits: 1 },
  ],
  answerDays: [
    { day: "2026-11-16", edition: 1, engine: "claude", question: "해외직구 관세 계산기", group: "general", status: "ok", found: true, cited: false },
    { day: "2026-11-18", edition: 2, engine: "claude", question: "해외직구 관세 계산기", group: "general", status: "ok", found: true, cited: true },
    { day: "2026-11-18", edition: 3, engine: "claude", question: "Flapfx", group: "brand", status: "ok", found: true, cited: true },
  ],
};

async function open(page: Page, body: object) {
  // 브라우저 날짜는 쓰지 않음 — 끝 날짜는 빌드 때 한국 날짜(자료 기준일)라 시계를 고정해도 영향 없음 (작업 0205)
  await page.route("**/bff/geo*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }));
  await page.goto("/geo");
}

/** 화면의 "자료 기준일"(빌드 때 한국 날짜)에서 '바꾼 뒤 일수'(2026-11-17 포함)를 구함 — 오늘 날짜에 기대지 않음 (패치: 자정을 넘기면 11-19 칸이 생겨 고정 기대가 깨졌음) */
async function daysAfterRename(page: Page): Promise<number> {
  const text = (await tid(page, "rename-asof").innerText()).replace(/\s+/g, " ");
  const asOf = text.match(/자료 기준일 (\d{4}-\d{2}-\d{2})/)?.[1];
  expect(asOf, "자료 기준일").toBeTruthy();
  return Math.round((Date.parse(`${asOf}T00:00:00Z`) - Date.parse("2026-11-17T00:00:00Z")) / 86400_000) + 1;
}
const perDay = (hits: number, days: number) => String(Math.round((hits / days) * 10) / 10);

test.describe("이름 바꾼 날 전후 비교 (작업 0205)", () => {
  test("맨 위 구간 · 기준일 표시 · 수치 카드보다 위", async ({ page }) => {
    await open(page, WITH_DAILY);
    const sec = tid(page, "rename-compare");
    await expect(sec).toBeVisible();
    await expect(sec.getByRole("heading", { name: "이름 바꾼 날 전후 비교" })).toBeVisible();
    await expect(tid(page, "rename-day")).toContainText(/이름 바꾼 날 2026-11-17 \(.+ → Flapfx/);
    const a = await sec.boundingBox();
    const b = await tid(page, "geo-cards").boundingBox();
    expect(a && b && a.y + a.height <= b.y + 1).toBe(true);
  });

  test("하루 평균 — 달력 날짜 수로 나눔 · 끝 날짜는 화면의 자료 기준일(브라우저 날짜 아님) · 전 기간 날짜 표시", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2027-03-01T12:00:00+09:00")); // 브라우저 날짜가 한참 뒤여도 후 기간 분모가 늘지 않아야 함
    await open(page, WITH_DAILY);
    const text = (await tid(page, "rename-asof").innerText()).replace(/\s+/g, " ");
    const asOf = text.match(/자료 기준일 (\d{4}-\d{2}-\d{2})/)?.[1];
    expect(asOf).toBeTruthy();
    expect(asOf && asOf >= "2026-11-18" && asOf < "2027-03-01").toBe(true);
    expect(text).toContain("바꾸기 전 = 2026-11-05 ~ 2026-11-16");
    const days = Math.round((Date.parse(`${asOf}T00:00:00Z`) - Date.parse("2026-11-17T00:00:00Z")) / 86400_000) + 1;
    const per = Math.round((4 / days) * 10) / 10;
    await expect(tid(page, "rename-day")).toContainText(`바꾸기 전 12일 · 바꾼 뒤 ${days}일`);
    const row = tid(page, "rename-compare").getByRole("row", { name: /GPTBot/ });
    await expect(row).toContainText("하루 0.8회 (합계 10회)");
    await expect(row).toContainText(`하루 ${per}회 (합계 4회)`);
    await expect(tid(page, "rename-short")).toHaveCount(days < 7 ? 1 : 0);
    await expect(tid(page, "rename-before-short")).toHaveCount(0);
  });

  test("막대 — 같은 숫자를 글로도 · 기준일 표시", async ({ page }) => {
    await open(page, WITH_DAILY);
    const bars = tid(page, "rename-bars").first();
    // 11-18 뒤에 자료 기준일까지 날짜가 더 붙을 수 있음(예: 11-19 0회) — 끝 날짜에 기대지 않고 '11-18 1회' 뒤 · 이름 바꾼 날 표시 앞은 아무 날짜나
    await expect(bars).toHaveAttribute("aria-label", /GPTBot 날짜별 방문: 11-05 4회.*11-17 3회, 11-18 1회[^()]*\(2026-11-17 이름 바꾼 날\)/);
  });

  test("유입 · 답변 · 검색 노출", async ({ page }) => {
    await open(page, WITH_DAILY);
    const days = await daysAfterRename(page);
    await expect(tid(page, "rename-compare").getByRole("row", { name: /ChatGPT/ })).toContainText(`하루 0회 (합계 0회)하루 ${perDay(1, days)}회 (합계 1회)`);
    await expect(tid(page, "rename-compare").getByRole("row", { name: /해외직구 관세 계산기/ })).toContainText("찾음 1 · 인용 0 / 1회");
    await expect(tid(page, "rename-brand")).toContainText("Flapfx 시기(3판): 1일 측정");
    await expect(tid(page, "rename-search")).toContainText("새 속성(flapfx.com): 아직 없음 (Search Console 새 속성 등록 대기 #214)");
  });

  test("새 필드가 없는 응답(API 배포 전) — 봇 · 유입 · 답변은 아직 없음 · 숫자를 만들지 않음", async ({ page }) => {
    await open(page, BASE);
    const sec = tid(page, "rename-compare");
    await expect(sec).toBeVisible();
    await expect(sec.getByText("아직 없음", { exact: true })).toHaveCount(3);
    await expect(sec.getByRole("row", { name: /GPTBot/ })).toHaveCount(0);
  });

  test("겹침 · 가로 넘침 없음", async ({ page }) => {
    await open(page, WITH_DAILY);
    await expect(tid(page, "rename-bars").first()).toBeVisible();
    const wide = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(wide).toBeLessThanOrEqual(1);
    const boxes = await page.locator('[data-testid="rename-compare"] h3').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.top, r.bottom]));
    for (let i = 1; i < boxes.length; i++) expect(boxes[i][0]).toBeGreaterThanOrEqual(boxes[i - 1][1] - 1);
  });
});

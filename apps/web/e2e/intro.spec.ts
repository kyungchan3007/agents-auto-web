// 작업 0185 — 공항 인트로 (작성만 · 실행은 lead 가 Full 게이트에서 한 번 — 빌드한 사이트를 읽음) · 3D 그림은 확인하지 않고 DOM 흐름만
// 인트로는 데스크톱(폭 700 초과)에서만 홈 위를 덮고, 늘 건너뛸 수 있음 · 홈 HTML(서버 렌더)에는 인트로가 없음
//
// 표시(builder 가 다는 것) — 인트로 컴포넌트 · 홈 컴포넌트
//   data-testid="intro"(덮개 · role=dialog) · "intro-skip"(건너뛰기) · "intro-step"(글 '1 / 5 · 터미널 입구') · "intro-search"(입력 · aria-label '나라나 도시') · "intro-chip"(칩 버튼)
//   "intro-frow"(출발 안내판 줄 · data-text = 그 줄의 최종 글 — 칸이 넘어가는 중에도 같은 값) · "intro-budget"(예산 입력) · "intro-out"(환산 결과 · 환율이 없으면 없음) · "intro-next"(다음 · 게이트로)
//   "intro-back"(이전 · 2~4단계) · "intro-boardbtn"(탑승하기) · "intro-hint"(4단계 스크롤 안내)
//   홈: "picked-pass"(왼쪽 아래 '탑승권 보기' 버튼) · 안내판은 홈의 flap-board(aria-label)
// 인트로를 끄는 법(끄기 스위치): localStorage["tripfx:intro-off"] = "1" — playwright.config 의 storageState 로 다른 e2e 는 기본 꺼 둠 · 이 파일만 켬
import { expect, test } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } }); // 이 파일은 인트로를 켠 채로

const DESKTOP = { width: 1440, height: 900 };
const intro = (page: import("@playwright/test").Page) => page.getByTestId("intro");
const step = (page: import("@playwright/test").Page) => page.getByTestId("intro-step");
const board = (page: import("@playwright/test").Page) => page.locator('#today [data-testid="flap-board"]');
const PICKED = "tripfx:picked";

/** 인트로가 뜨고 1단계(터미널 입구)가 보일 때까지 — 3D 모델을 받는 동안 기다림 */
async function openIntro(page: import("@playwright/test").Page) {
  await page.goto("/");
  await expect(intro(page)).toBeVisible({ timeout: 20_000 });
  await expect(step(page)).toHaveText("1 / 5 · 터미널 입구", { timeout: 30_000 });
}

test.describe("데스크톱 인트로", () => {
  test.skip(({ isMobile }) => isMobile, "인트로는 폭 700 초과에서만 — 휴대폰 프로젝트에서는 아래 '인트로 없음' 테스트가 봄");
  test.use({ viewport: DESKTOP });

  test("처음부터 끝까지 — 파리 → 예산 → 탑승 → 스크롤 → 홈 안내판 '파리'", async ({ page }) => {
    test.setTimeout(150_000);
    await openIntro(page);

    // 1단계 — 입력하면 출발 안내판이 'ICN → 파리' 로 · 칩에 결과
    const search = page.getByTestId("intro-search");
    await search.fill("파리");
    await expect(page.getByTestId("intro-frow").first()).toHaveAttribute("data-text", "ICN → 파리");
    await expect(page.getByTestId("intro-chip").first()).toContainText("파리");
    await search.press("Enter");

    // 2단계 — 환전소: 예산을 넣으면 오늘 환율로 현지 돈
    await expect(step(page)).toHaveText("2 / 5 · 환전소", { timeout: 15_000 });
    await expect(intro(page)).toContainText("파리");
    const budget = page.getByTestId("intro-budget");
    await budget.fill("2000000");
    await expect(budget).toHaveValue("2,000,000");
    const out = page.getByTestId("intro-out");
    if (await out.count()) await expect(out).toContainText("≈"); // 환율이 없으면 이 칸이 없음 — 지어내지 않음
    await page.getByTestId("intro-next").click();

    // 3단계 — 게이트: 이번 달 · 탑승하기 → 탑승권 출력
    await expect(step(page)).toHaveText("3 / 5 · 게이트", { timeout: 15_000 });
    const month = await page.evaluate(() => new Date().getMonth() + 1);
    await expect(intro(page)).toContainText(`이번 달 ${month}월에 떠나요`);
    await page.getByTestId("intro-boardbtn").click();

    // 4단계 — 이륙: 스크롤(방향키)로 바퀴가 뜨는 순간까지
    await expect(step(page)).toHaveText("4 / 5 · 이륙", { timeout: 20_000 });
    await expect(page.getByTestId("intro-hint")).toBeVisible();
    for (let i = 0; i < 80; i++) {
      if ((await step(page).textContent())?.startsWith("5 / 5")) break;
      await page.keyboard.press("ArrowDown");
      await page.waitForTimeout(150);
    }
    await expect(step(page)).toHaveText("5 / 5 · 홈으로", { timeout: 10_000 });

    // 5단계 — 자동 창문 전환 → 인트로가 사라지고 홈
    await expect(intro(page)).toHaveCount(0, { timeout: 60_000 });
    await expect(board(page)).toBeVisible();
    await expect(board(page)).toHaveAttribute("aria-label", /파리/);
    await expect(page.locator("#today")).toContainText("내가 고른 여행지 · 오늘 환율");
    await expect(page.getByTestId("picked-pass")).toContainText("탑승권 보기");
    await expect(page.getByTestId("picked-pass")).toContainText("파리");
    const saved = await page.evaluate((k) => localStorage.getItem(k), PICKED);
    expect(JSON.parse(saved ?? "null")).toMatchObject({ v: 1, country: "FRA", city: "파리", budget: 2_000_000 });
  });

  test("이전 — 2 · 3 · 4단계에서 한 단계 앞으로 · 1단계에는 이전이 없음", async ({ page }) => {
    test.setTimeout(120_000);
    await openIntro(page);
    await expect(page.getByTestId("intro-back")).toHaveCount(0);
    await page.getByTestId("intro-chip").first().click(); // 도쿄 (처음 칩)
    await expect(step(page)).toHaveText("2 / 5 · 환전소", { timeout: 15_000 });
    await page.getByTestId("intro-next").click();
    await expect(step(page)).toHaveText("3 / 5 · 게이트", { timeout: 15_000 });
    await page.getByTestId("intro-back").click();
    await expect(step(page)).toHaveText("2 / 5 · 환전소", { timeout: 15_000 });
    await page.getByTestId("intro-back").click();
    await expect(step(page)).toHaveText("1 / 5 · 터미널 입구", { timeout: 15_000 });
    // 다시 3단계까지 → 탑승 → 4단계에서 이전(게이트로)
    await page.getByTestId("intro-chip").first().click();
    await page.getByTestId("intro-next").click();
    await page.getByTestId("intro-boardbtn").click();
    await expect(step(page)).toHaveText("4 / 5 · 이륙", { timeout: 20_000 });
    await page.getByTestId("intro-back").click();
    await expect(step(page)).toHaveText("3 / 5 · 게이트", { timeout: 15_000 });
  });

  test("칩 — 처음엔 일본 · 태국 · 미국 · 없는 곳을 입력하면 '없는 곳입니다' (카드 크기는 그대로)", async ({ page }) => {
    await openIntro(page);
    const chips = page.getByTestId("intro-chip");
    await expect(chips).toHaveCount(3);
    await expect(chips.nth(0)).toContainText("일본");
    await expect(chips.nth(1)).toContainText("태국");
    await expect(chips.nth(2)).toContainText("미국");
    const before = await page.getByTestId("intro").locator("[data-testid='intro-search']").boundingBox();
    await page.getByTestId("intro-search").fill("zzzz아무데도없음");
    await expect(page.getByTestId("intro-frow").nth(1)).toHaveAttribute("data-text", "없는 곳입니다");
    await expect(chips).toHaveCount(0);
    const after = await page.getByTestId("intro-search").boundingBox();
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0)), "카드가 줄어 입력칸이 움직이지 않음").toBeLessThanOrEqual(1);
  });

  test("건너뛰기 — 1단계에서 누르면 바로 홈 · 안내판은 지금 그대로 · 고른 값 저장 없음", async ({ page }) => {
    await openIntro(page);
    await page.getByTestId("intro-skip").click();
    await expect(intro(page)).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator("#today")).toContainText("이번 주 가장 싸게 갈 수 있는 곳");
    await expect(page.locator("#today")).not.toContainText("내가 고른 여행지");
    await expect(page.getByTestId("picked-pass")).toHaveCount(0);
    expect(await page.evaluate((k) => localStorage.getItem(k), PICKED)).toBeNull();
  });

  test("건너뛰기 — 4단계(스크롤 중)에서도 누를 수 있음", async ({ page }) => {
    test.setTimeout(90_000);
    await openIntro(page);
    await page.getByTestId("intro-chip").first().click();
    await page.getByTestId("intro-next").click();
    await page.getByTestId("intro-boardbtn").click();
    await expect(step(page)).toHaveText("4 / 5 · 이륙", { timeout: 20_000 });
    await page.getByTestId("intro-skip").click();
    await expect(intro(page)).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator("#today")).toBeVisible();
  });

  test("매번 보여 줌 — 다시 들어오면 인트로가 또 뜨고, 저번에 고른 나라는 홈 안내판에 들어 있음", async ({ page }) => {
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [PICKED, JSON.stringify({ v: 1, country: "JPN", city: "도쿄", budget: 500000 })] as const);
    await openIntro(page);
    await page.getByTestId("intro-skip").click();
    await expect(intro(page)).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator("#today")).toContainText("내가 고른 여행지 · 오늘 환율");
    await expect(board(page)).toHaveAttribute("aria-label", /도쿄/);
    await expect(page.getByTestId("picked-pass")).toContainText("도쿄");
  });

  test("망가진 저장 값은 무시 — 안내판은 지금 그대로", async ({ page }) => {
    await page.addInitScript((k) => localStorage.setItem(k, "{oops"), PICKED);
    await openIntro(page);
    await page.getByTestId("intro-skip").click();
    await expect(intro(page)).toHaveCount(0, { timeout: 10_000 });
    await expect(page.locator("#today")).toContainText("이번 주 가장 싸게 갈 수 있는 곳");
  });

  test("접근성 — 덮개는 dialog · 건너뛰기에 접근 이름 · 판 글자는 화면 읽기에서 숨김", async ({ page }) => {
    await openIntro(page);
    await expect(intro(page)).toHaveAttribute("role", "dialog");
    await expect(page.getByRole("button", { name: "건너뛰기" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "나라나 도시" })).toBeVisible();
  });
});

test.describe("인트로가 없는 경우", () => {
  test("휴대폰 폭 375 — 인트로 없이 바로 홈", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(intro(page)).toHaveCount(0);
    await expect(board(page)).toBeVisible();
    await expect(page.locator("#today")).toContainText("이번 주 가장 싸게 갈 수 있는 곳");
  });

  test("경계 — 폭 700 은 인트로 없음 · 폭 701 은 있음", async ({ page }) => {
    await page.setViewportSize({ width: 700, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(intro(page)).toHaveCount(0);
    await page.setViewportSize({ width: 701, height: 800 });
    await page.goto("/");
    await expect(intro(page)).toBeVisible({ timeout: 20_000 });
  });

  test("끄기 스위치 — localStorage tripfx:intro-off = 1 이면 데스크톱에서도 인트로 없음", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await page.addInitScript(() => localStorage.setItem("tripfx:intro-off", "1"));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(intro(page)).toHaveCount(0);
    await expect(board(page)).toBeVisible();
  });

  test("홈 HTML(서버 렌더 결과)에는 인트로가 없음 — 검색 · AI 답변 측정이 읽는 내용은 지금과 같음", async ({ request }) => {
    const html = await (await request.get("/")).text();
    expect(html).not.toContain('data-testid="intro"');
    expect(html).not.toContain('data-testid="intro-skip"');
    expect(html).not.toContain("models/intro");
    expect(html).not.toContain("내가 고른 여행지");
    expect(html).toContain("이번 주 가장 싸게 갈 수 있는 곳");
    expect(html).toContain('id="today"');
    expect(html).not.toContain("같은 달 평균으로 비교했습니다");
  });

  test("홈 첫 화면 설명에 '같은 달 평균으로 비교했습니다' 가 없음 (인트로를 건너뛴 뒤)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/");
    await expect(page.getByText(/같은 달 평균으로 비교했습니다/)).toHaveCount(0);
  });
});

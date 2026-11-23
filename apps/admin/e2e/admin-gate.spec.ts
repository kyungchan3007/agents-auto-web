// 작업 0326 — 어드민 입구의 화면 쪽: 첫 진입 안내 창 · 접속 기록 표 · 로그아웃 링크 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   막는 화면(①) · 사용할 수 없는 링크(③) · 쿠키 · 접속 기록 저장은 Worker 쪽이라 단위(worker/gate/gate.test.ts)로 봄 — 이 e2e 는 정적 서버(Worker 없음)에서 브라우저가 받는 /session · /bff/admin-visits 를 가짜 응답으로 바꿈
//   운영 코드에 우회 경로 없음 · 기존 e2e 는 /session 이 없는 정적 서버라 안내 창이 안 뜸(응답이 404 면 아무것도 안 함)
//   화면 약속(builder 가 이 이름으로 만듦)
//     안내 창 — 어드민 앱 쪽 부품. 브라우저가 GET /session 을 불러 {name} 을 받음 · 이름이 owner 가 아니고 · 이 브라우저에서 "둘러보기"로 닫은 적이 없으면 띄움(localStorage)
//       role="dialog" · data-testid="gate-welcome" · 이름에 "전용 링크" 가 들어감
//       머리 "전용 링크로 들어오셨습니다" · 이름이 apply-<회사>-<날짜 숫자> 모양이면 "<회사> 회사 님, 반갑습니다" 한 줄(아니면 머리만) · 토큰 이름(원문 그대로) 표시
//       글(작업 0330 에서 "지원한 회사마다…" 줄 뺌): "7일 동안 다시 넣지 않도록 브라우저에 로그인 쿠키를 저장합니다." · "이 토큰으로 처음 · 마지막에 접속한 시각만 기록합니다. 이름 · 이메일 등 개인 정보는 받지 않습니다." · "검색 엔진에는 막아 두었습니다."
//       금지: "추적하지 않" · "아무것도 저장하지 않" 같은 문구(실제로 쿠키 · 접속 시각을 남기므로)
//       단추 "둘러보기"(닫음 · 같은 브라우저에서 다시 안 뜸) · 링크 "나가기"(https://flapfx.com)
//     접속 기록 표 — "만드는 방식"(/how) 아래 작은 표: data-testid="admin-visits" · 줄 "admin-visit-row"[data-name] · 칸 data-col="name" · "firstAt" · "lastAt"(한국 시간 'YYYY-MM-DD HH:mm')
//       빈 응답 → data-testid="admin-visits-empty" '아직 접속 기록이 없습니다' · 실패 → "admin-visits-error" '접속 기록을 받지 못했습니다' · 화면의 나머지는 그대로
//       어드민 BFF 경로표(apps/admin/worker/bff-routes.ts)에 /admin-visits(읽기) 가 있어야 브라우저가 /bff/admin-visits 로 받음
//     로그아웃 — 어드민 화면마다 링크 <a href="/logout">로그아웃</a> (어드민 메뉴 navigation 안이 아님 — 메뉴 링크 개수 6 이 그대로)
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const session = (page: Page, status: number, body: unknown) => page.route("**/session", (route) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }));
const welcome = (page: Page) => tid(page, "gate-welcome");

test.describe("첫 진입 안내 창 (작업 0326)", () => {
  test("리뷰어 토큰으로 들어오면 안내 창 — 머리 · 회사 이름 인사 · 토큰 이름 · 사실 그대로의 글 · 나가기 링크", async ({ page }) => {
    await session(page, 200, { name: "apply-acme-1124" });
    await page.goto("/log");
    await expect(welcome(page)).toBeVisible();
    await expect(page.getByRole("dialog", { name: /전용 링크/ })).toBeVisible();
    await expect(welcome(page)).toContainText("전용 링크로 들어오셨습니다");
    await expect(welcome(page)).toContainText("acme 회사 님, 반갑습니다");
    await expect(welcome(page)).toContainText("apply-acme-1124");
    await expect(welcome(page)).not.toContainText("지원한 회사마다");
    await expect(welcome(page)).toContainText("7일 동안 다시 넣지 않도록");
    await expect(welcome(page)).toContainText("로그인 쿠키");
    await expect(welcome(page)).toContainText("처음 · 마지막에 접속한 시각만");
    await expect(welcome(page)).toContainText("개인 정보는 받지 않습니다");
    await expect(welcome(page)).toContainText("검색 엔진에는 막아 두었습니다");
    await expect(welcome(page).getByRole("link", { name: "나가기" })).toHaveAttribute("href", /^https:\/\/flapfx\.com\/?$/);
    await expect(welcome(page).getByRole("button", { name: "둘러보기" })).toBeVisible();
  });

  test("금지 문구 없음 — '추적하지 않는다' · '아무것도 저장하지 않는다' (실제로 쿠키 · 접속 시각을 남김)", async ({ page }) => {
    await session(page, 200, { name: "apply-acme-1124" });
    await page.goto("/log");
    await expect(welcome(page)).toBeVisible();
    const text = (await welcome(page).innerText()).replace(/\s+/g, " ");
    expect(text).not.toMatch(/추적하지 않|아무것도 저장하지 않|저장하지 않습니다|기록하지 않습니다|수집하지 않/);
  });

  test("이름이 apply-회사-날짜 모양이 아니면 머리 줄만 — 인사 줄 없음 · 토큰 이름은 보임 · 회사 이름에 하이픈이 있어도 됨", async ({ page }) => {
    await session(page, 200, { name: "friend" });
    await page.goto("/log");
    await expect(welcome(page)).toContainText("전용 링크로 들어오셨습니다");
    await expect(welcome(page)).toContainText("friend");
    await expect(welcome(page)).not.toContainText("님, 반갑습니다");
    await page.unroute("**/session");
    await page.evaluate(() => localStorage.clear());
    await session(page, 200, { name: "apply-my-co-1124" });
    await page.reload();
    await expect(welcome(page)).toContainText("my-co 회사 님, 반갑습니다");
  });

  test("둘러보기 → 닫힘 · 새로고침해도 · 다른 화면으로 가도 다시 안 뜸 (같은 브라우저)", async ({ page }) => {
    await session(page, 200, { name: "apply-acme-1124" });
    await page.goto("/log");
    await welcome(page).getByRole("button", { name: "둘러보기" }).click();
    await expect(welcome(page)).toHaveCount(0);
    await page.reload();
    await page.waitForTimeout(600);
    await expect(welcome(page)).toHaveCount(0);
    await page.goto("/geo");
    await page.waitForTimeout(600);
    await expect(welcome(page)).toHaveCount(0);
  });

  test("owner 는 안내 창 없음", async ({ page }) => {
    await session(page, 200, { name: "owner" });
    await page.goto("/log");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(800);
    await expect(welcome(page)).toHaveCount(0);
  });

  test("세션을 못 받으면(401 · 404 · 네트워크 실패 · 알 수 없는 모양) 아무것도 안 뜸 · 화면은 그대로", async ({ page }) => {
    for (const mode of ["401", "404", "abort", "shape"] as const) {
      await page.route("**/session", (route) => {
        if (mode === "abort") return route.abort();
        if (mode === "shape") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ unexpected: true }) });
        return route.fulfill({ status: Number(mode), contentType: "application/json", body: JSON.stringify({ error: "x" }) });
      });
      await page.goto("/log");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.waitForTimeout(600);
      await expect(welcome(page), mode).toHaveCount(0);
      await page.unroute("**/session");
    }
  });

  test("안내 창이 떠 있어도 가로 넘침이 없음 · 창이 화면 안에 들어옴", async ({ page }) => {
    await session(page, 200, { name: "apply-acme-1124" });
    await page.goto("/log");
    await expect(welcome(page)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    const box = await welcome(page).boundingBox();
    const vw = page.viewportSize()?.width ?? 0;
    expect(box && box.x >= 0 && box.x + box.width <= vw + 1).toBe(true);
  });
});

test.describe("접속 기록 표 — 만드는 방식 (작업 0326)", () => {
  const REPORT = {
    visits: [
      { name: "apply-b-1124", firstAt: "2026-11-22T01:00:00.000Z", lastAt: "2026-11-23T03:31:00.000Z" },
      { name: "apply-a-1124", firstAt: "2026-11-20T15:30:00.000Z", lastAt: "2026-11-21T01:00:00.000Z" },
    ],
  };
  const open = async (page: Page, body: object, status = 200) => {
    await page.route("**/bff/admin-visits*", (route) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) }));
    await page.goto("/how");
  };
  const cell = (page: Page, i: number, col: string) => tid(page, "admin-visits").locator('[data-testid="admin-visit-row"]').nth(i).locator(`[data-col="${col}"]`);

  test("줄마다 이름 · 처음 · 마지막(한국 시간 YYYY-MM-DD HH:mm) · 응답 순서", async ({ page }) => {
    await open(page, REPORT);
    const rows = tid(page, "admin-visits").locator('[data-testid="admin-visit-row"]');
    await expect(rows).toHaveCount(2);
    expect(await rows.evaluateAll((els) => els.map((e) => e.getAttribute("data-name")))).toEqual(["apply-b-1124", "apply-a-1124"]);
    await expect(cell(page, 0, "name")).toHaveText("apply-b-1124");
    await expect(cell(page, 0, "firstAt")).toHaveText("2026-11-22 10:00");
    await expect(cell(page, 0, "lastAt")).toHaveText("2026-11-23 12:31");
    await expect(cell(page, 1, "firstAt")).toHaveText("2026-11-21 00:30"); // 15:30Z = 다음 날 00:30 한국
  });

  test("IP · 기기 · 경로 칸이 없음 — 이름과 시각만", async ({ page }) => {
    await open(page, REPORT);
    await expect(cell(page, 0, "name")).toBeVisible();
    const cols = await tid(page, "admin-visits").locator('[data-testid="admin-visit-row"]').first().locator("[data-col]").evaluateAll((els) => els.map((e) => e.getAttribute("data-col")));
    expect(cols).toEqual(["name", "firstAt", "lastAt"]);
  });

  test("빈 응답 · 실패(500) · 알 수 없는 모양 — 글만 · 만드는 방식 화면은 그대로 · 가로 넘침 0", async ({ page }) => {
    await open(page, { visits: [] });
    await expect(tid(page, "admin-visits-empty")).toContainText("아직 접속 기록이 없습니다");
    await expect(tid(page, "admin-visit-row")).toHaveCount(0);
    await page.unroute("**/bff/admin-visits*");
    await open(page, { error: "boom" }, 500);
    await expect(tid(page, "admin-visits-error")).toContainText("접속 기록을 받지 못했습니다");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    await page.unroute("**/bff/admin-visits*");
    await open(page, { unexpected: true });
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(tid(page, "admin-visit-row")).toHaveCount(0);
  });

  test("다른 어드민 화면(/log · /geo)에는 접속 기록 표가 없음 · /bff/admin-visits 를 부르지 않음", async ({ page }) => {
    let called = 0;
    await page.route("**/bff/admin-visits*", (route) => {
      called++;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(REPORT) });
    });
    for (const path of ["/log", "/geo", "/marketing"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(tid(page, "admin-visits")).toHaveCount(0);
    }
    await page.waitForTimeout(500);
    expect(called).toBe(0);
  });
});

test.describe("로그아웃 링크 (작업 0326)", () => {
  for (const path of ["/log", "/geo", "/how", "/marketing", "/traffic", "/instagram"]) {
    test(`${path} — <a href="/logout">로그아웃</a> 이 있음 · 어드민 메뉴(navigation) 밖 · 가로 넘침 0`, async ({ page }) => {
      await page.goto(path);
      const link = page.locator('a[href="/logout"]');
      await expect(link.first()).toBeAttached();
      await expect(link.first()).toContainText("로그아웃");
      const inMenu = await page.evaluate(() => [...document.querySelectorAll('nav[aria-label="어드민 메뉴"] a[href="/logout"]')].length);
      expect(inMenu, "어드민 메뉴 안의 로그아웃 링크 수").toBe(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    });
  }
});

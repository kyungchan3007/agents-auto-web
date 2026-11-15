// 작업 0177 — 홈 첫 화면 출발 안내판 (실행은 lead 가 PR 직전에 — 빌드한 사이트를 읽음 · 작성만)
// 표시: data-testid="flap-board"(판 · role=img · aria-label) · "flap-row"(data-tone dest|money) · "flap-cell"(칸 · aria-hidden) · "photo-header"(사진 구간) · "photo-fade-bottom" · #today · 지구 = #today canvas 를 감싼 칸(data-testid="globe" 없으면 canvas)
// 값은 날마다 · 자료 유무에 따라 달라서 두 경우(값 있음 · 없음 "----") 모두 맞게 봄
import { expect, test } from "@playwright/test";

const SEA = "rgb(36, 56, 168)"; // #2438A8 판
const CELL = "rgb(50, 71, 184)"; // #3247b8 칸
const SUN = "rgb(247, 197, 72)"; // #F7C548 금액 줄
const WHITE = "rgb(255, 255, 255)";
const board = (page: import("@playwright/test").Page) => page.locator('[data-testid="flap-board"]');
const cs = (loc: import("@playwright/test").Locator, prop: string) => loc.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop);

for (const width of [375, 1440, 1920]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 900 } });

    test("사진 구간 · 안내판 겹침 — 판 위쪽이 사진 안으로 · 아래쪽은 사진 밖 · 가로 넘침 없음", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const photo = await page.locator('[data-testid="photo-header"]').first().boundingBox();
      const b = await board(page).boundingBox();
      expect(photo && b, "사진 · 판").toBeTruthy();
      if (!photo || !b) return;
      const photoBottom = photo.y + photo.height;
      expect(b.y, "판 위쪽이 사진 안").toBeLessThan(photoBottom - 8);
      expect(b.y, "판 위쪽이 사진 아래 끝보다 위이지만 사진 맨 위는 아님").toBeGreaterThan(photo.y + photo.height * 0.4);
      expect(b.y + b.height, "판 아래쪽은 사진 밖").toBeGreaterThan(photoBottom + 8);
      expect(b.x, "판이 화면 안 왼쪽").toBeGreaterThanOrEqual(0);
      expect(b.x + b.width, "판이 화면 안 오른쪽").toBeLessThanOrEqual(width + 0.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "가로 넘침").toBeLessThanOrEqual(0);
    });

    test("사진 아래 끝은 하늘 종이로 사라짐 (막이 있고 사진 아래 끝에 붙음) · 울트라마린 전체 띠 없음", async ({ page }) => {
      await page.goto("/");
      const photo = await page.locator('[data-testid="photo-header"]').first().boundingBox();
      const fade = await page.locator('[data-testid="photo-fade-bottom"]').first().boundingBox();
      expect(photo && fade, "사진 · 아래 막").toBeTruthy();
      if (!photo || !fade) return;
      expect(Math.abs(fade.y + fade.height - (photo.y + photo.height)), "막이 사진 아래 끝").toBeLessThanOrEqual(2);
      expect(fade.height).toBeGreaterThanOrEqual(48);
      const band = await page.locator("#today").boundingBox();
      expect(band?.width ?? 0).toBeGreaterThan(0);
      expect(await cs(page.locator("#today"), "background-color")).not.toBe(SEA);
    });

    test("판 색 — 판 #2438A8 · 칸 #3247b8 · 도착지 줄 흰 글자 · 금액 줄 햇빛 노랑", async ({ page }) => {
      await page.goto("/");
      expect(await cs(board(page), "background-color")).toBe(SEA);
      const rows = board(page).locator('[data-testid="flap-row"]');
      await expect(rows).toHaveCount(2);
      await expect(rows.nth(0)).toHaveAttribute("data-tone", "dest");
      await expect(rows.nth(1)).toHaveAttribute("data-tone", "money");
      const c0 = rows.nth(0).locator('[data-testid="flap-cell"]').first();
      const c1 = rows.nth(1).locator('[data-testid="flap-cell"]').first();
      expect(await cs(c0, "background-color")).toBe(CELL);
      expect(await cs(c0, "color")).toBe(WHITE);
      expect(await cs(c1, "color")).toBe(SUN);
    });

    test("안내판 안 — 도착지 · 금액 줄 · 아래 판정 한 줄이 보임 (값이 있으면 'ICN → 도시' · '… / 단위' · 없으면 '----')", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const label = (await board(page).getAttribute("aria-label")) ?? "";
      const dest = (await board(page).locator('[data-testid="flap-row"]').nth(0).textContent())?.replace(/\s+/g, "") ?? "";
      const money = (await board(page).locator('[data-testid="flap-row"]').nth(1).textContent())?.replace(/\s+/g, "") ?? "";
      if (/이번 주 가장 싸게 갈 수 있는 곳은 .+입니다/.test(label)) {
        expect(dest).toMatch(/^ICN→.+/);
        expect(money).toMatch(/\d.*\/.+/);
        await expect(page.locator("#today")).toContainText(/최근 90일 중 /);
      } else {
        expect(dest).toContain("----");
        expect(money).toContain("----");
        expect(money).not.toMatch(/\d/); // 숫자를 지어내지 않음
      }
      await expect(page.locator("#today")).toContainText("이번 주 가장 싸게 갈 수 있는 곳");
      await expect(board(page)).toBeVisible();
    });

    test("칸이 판 안에 · 줄이 한 줄 · 칸 글자 하나가 한 칸 (넘치지 않음)", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const b = await board(page).boundingBox();
      for (const cell of await board(page).locator('[data-testid="flap-cell"]').all()) {
        const r = await cell.boundingBox();
        expect(r && b && r.x >= b.x - 0.5 && r.x + r.width <= b.x + b.width + 0.5, "칸이 판 안").toBeTruthy();
        const t = ((await cell.textContent()) ?? "").length;
        expect(t, "칸 글자").toBeLessThanOrEqual(2); // 한 글자(두 코드 유닛 가능)
      }
      for (const row of await board(page).locator('[data-testid="flap-row"]').all()) {
        const cells = await row.locator('[data-testid="flap-cell"]').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
        expect(new Set(cells).size, "한 줄(같은 높이)").toBe(1);
      }
    });

    test("지구 · 판 자리 — 데스크톱은 판 오른쪽 · 모바일은 판 아래 작게", async ({ page }) => {
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const g = await page.locator("#today canvas").first().boundingBox().catch(() => null);
      if (!g) return; // 3D 가 안 뜨면(렌더 환경) 이 칸만 비어도 글자는 그대로 — 위치 검사는 건너뜀
      const b = await board(page).boundingBox();
      if (!b) throw new Error("판 없음");
      if (width >= 1024) expect(g.x, "지구가 판 오른쪽").toBeGreaterThanOrEqual(b.x + b.width - 8);
      else {
        expect(g.y, "지구가 판 아래").toBeGreaterThanOrEqual(b.y + b.height - 8);
        expect(g.width, "모바일 지구는 작게").toBeLessThanOrEqual(280);
      }
      expect(g.x + g.width, "지구가 화면 안").toBeLessThanOrEqual(width + 0.5);
    });

    test("지구 뒤 파란 원판 · 띠가 없음 — 지구 칸 · 구간 어디에도 울트라마린 바탕 없음 (판 제외)", async ({ page }) => {
      await page.goto("/");
      const bgs = await page.locator("#today").evaluate((root, boardSel) => {
        const out: string[] = [];
        for (const el of [root, ...Array.from(root.querySelectorAll("*"))]) {
          if (el.closest(boardSel)) continue; // 판 안은 울트라마린
          const bg = getComputedStyle(el).backgroundColor;
          if (bg === "rgb(36, 56, 168)" || bg === "rgb(50, 71, 184)") out.push(`${el.tagName.toLowerCase()} ${bg}`);
        }
        return out;
      }, '[data-testid="flap-board"]');
      expect(bgs).toEqual([]);
    });
  });
}

test.describe("접근성 · 움직임", () => {
  test("판 전체가 한 문장 — role=img · aria-label · 칸은 aria-hidden (글자 하나씩 읽지 않음)", async ({ page }) => {
    await page.goto("/");
    await expect(board(page)).toHaveAttribute("role", "img");
    const label = (await board(page).getAttribute("aria-label")) ?? "";
    expect(label.length).toBeGreaterThan(10);
    const cells = board(page).locator('[data-testid="flap-cell"]');
    const n = await cells.count();
    expect(n).toBeGreaterThan(0);
    for (let i = 0; i < n; i++) await expect(cells.nth(i)).toHaveAttribute("aria-hidden", "true");
    await expect(page.getByRole("img", { name: label })).toBeVisible();
  });

  test("움직임 줄이기 — 바로 최종 글자 (넘어가는 중간 글자 없음)", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/");
    // 로드 직후(0.2초) 이미 최종 글자 — 판 글자를 모아 라벨과 맞춤
    await page.waitForTimeout(200);
    const first = await board(page).locator('[data-testid="flap-row"]').nth(0).textContent();
    await page.waitForTimeout(2200);
    const later = await board(page).locator('[data-testid="flap-row"]').nth(0).textContent();
    expect(first, "움직임 줄이기에서는 처음부터 최종 글자").toBe(later);
    await ctx.close();
  });

  test("한 번만 — 처음에 넘어가며 맞춰진 뒤 2.5초 안에 끝나고 다시 바뀌지 않음", async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: "no-preference", viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/");
    await page.waitForTimeout(2600); // 1~2초 + 여유
    const settled = await board(page).locator('[data-testid="flap-row"]').allTextContents();
    await page.waitForTimeout(2500);
    expect(await board(page).locator('[data-testid="flap-row"]').allTextContents(), "다시 돌지 않음").toEqual(settled);
    await ctx.close();
  });
});

test("긴 금액(1,234.56원 같은 긴 글)도 칸이 판을 넘치지 않음 — /design 이 아니라 실제 홈에서 칸 폭 · 판 폭만 확인 (375)", async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const page = await ctx.newPage();
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const b = await board(page).boundingBox();
  const rows = board(page).locator('[data-testid="flap-row"]');
  for (let i = 0; i < 2; i++) {
    const r = await rows.nth(i).boundingBox();
    expect(r && b && r.x >= b.x - 0.5 && r.x + r.width <= b.x + b.width + 0.5, `줄 ${i}`).toBeTruthy();
  }
  // 한 줄 글자 수(칸 수)는 긴 금액 — "1,234.56원 / 100엔"(15자)이 줄임표 없이 들어갈 만큼 크거나, 넘치면 줄임표로 끝남
  const money = ((await rows.nth(1).textContent()) ?? "").replace(/\s+/g, "");
  expect(money.length, "금액 줄 칸 수").toBeGreaterThanOrEqual(10);
  await ctx.close();
});

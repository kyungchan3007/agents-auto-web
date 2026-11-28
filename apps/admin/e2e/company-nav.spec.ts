// 작업 0403 — 회사 링크(owner 가 아닌 세션)는 안내 창 없이 GEO 측정 · 만드는 방식 두 화면만 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   서버 쪽(막힌 4개 주소 → 302 /geo · 막힌 bff 403 · / → /geo · ?t= 이동)은 worker/company-session.test.ts — 이 e2e 는 정적 서버(Worker 없음)에서 브라우저가 받는 /session 을 가짜 응답으로 바꿈
//   화면 약속(builder 가 이 모양으로)
//     메뉴 목록은 세션에 따라 거름 — 받기 전(첫 그림 · 서버 그림 포함) · 받지 못함 · 회사 이름이면 GEO 측정(/geo · 키 2) · 만드는 방식(/how · 키 3) 두 개 · owner 로 확인되면 여섯 개(지금 그대로)
//     같은 목록을 쓰는 곳: 넓은 화면 사이드 · 휴대폰 위 메뉴 · 찾기(⌘K) 화면 줄 · 숫자 단축키 · 로고 링크(회사 = /geo · owner = 지금처럼 /log)
//     안내 창(role=dialog · data-testid="gate-welcome")은 없음 — 대신 넣는 안내 문구도 없음
//     owner 확인이 늦게 와 메뉴가 두 개 → 여섯 개가 될 때 처음 두 링크 · 본문 위치가 움직이지 않고(사이드는 아래만 늘어남) 휴대폰 위 메뉴 줄 높이도 그대로
import { type Page, expect, test } from "@playwright/test";
import { companySession, hydrated, mockGeo, ownerSession } from "./helpers";

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 820;
const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
/** 지금 화면 폭에 맞는 어드민 메뉴(넓은 화면 사이드 · 휴대폰 위) */
const menu = (page: Page) => (isPhone(page) ? page.locator("header.adm-mtop") : page.locator("aside.adm-side")).getByRole("navigation", { name: "어드민 메뉴" });
const linkTexts = (page: Page) => menu(page).getByRole("link").evaluateAll((els) => els.map((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim()));
const brand = (page: Page) => page.locator("a.adm-brand").filter({ visible: true }).first();

const COMPANY_PATHS = ["/geo", "/how"];

test.describe("회사 세션 — 안내 창 없음 · 메뉴 두 개", () => {
  for (const path of COMPANY_PATHS) {
    test(`${path} — 안내 창(dialog · gate-welcome) 없음 · 메뉴는 GEO 측정 · 만드는 방식 두 개 · 로고는 /geo · 가로 넘침 0`, async ({ page }) => {
      await mockGeo(page);
      await companySession(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(menu(page).getByRole("link")).toHaveCount(2);
      const texts = await linkTexts(page);
      expect(texts.map((t) => (isPhone(page) && t === "GEO" ? "GEO 측정" : t))).toEqual(["GEO 측정", "만드는 방식"]);
      await expect(menu(page).getByRole("link").nth(0)).toHaveAttribute("href", "/geo");
      await expect(menu(page).getByRole("link").nth(1)).toHaveAttribute("href", "/how");
      await expect(menu(page).locator('a[aria-current="page"]')).toHaveCount(1);
      await expect(brand(page)).toHaveAttribute("href", "/geo");
      // 안내 창 — 늦게 떠도 안 되므로 /session 을 받은 뒤 잠시 더 봄
      await page.waitForTimeout(900);
      await expect(tid(page, "gate-welcome")).toHaveCount(0);
      await expect(page.getByRole("dialog", { name: /전용 링크/ })).toHaveCount(0);
      await expect(page.getByText("전용 링크로 들어오셨습니다")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "둘러보기" })).toHaveCount(0);
      // 메뉴 두 개를 받은 뒤에도 그대로(owner 확인 전 · 후 모두 두 개)
      await expect(menu(page).getByRole("link")).toHaveCount(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    });
  }

  test("이름이 apply- 모양이 아니어도(friend) 회사 세션 · 다른 회사 이름에서도 같은 두 개 · 안내 창 없음", async ({ page }) => {
    for (const name of ["friend", "apply-my-co-1124", "apply-beta-1125"]) {
      await page.unroute("**/session").catch(() => undefined);
      await companySession(page, name);
      await page.goto("/how");
      await expect(menu(page).getByRole("link")).toHaveCount(2);
      await page.waitForTimeout(500);
      await expect(tid(page, "gate-welcome")).toHaveCount(0);
      await expect(menu(page).getByRole("link")).toHaveCount(2);
    }
  });

  test("서버 그림(자바스크립트 없이 받은 HTML)의 어드민 메뉴도 두 개 — owner 확인 전에 여섯 개를 그리지 않음", async ({ request }) => {
    for (const path of ["/geo", "/how"]) {
      const html = await (await request.get(path)).text();
      const navs = [...html.matchAll(/<nav[^>]*aria-label="어드민 메뉴"[^>]*>([\s\S]*?)<\/nav>/g)].map((m) => m[1] ?? "");
      expect(navs.length, `${path}: 어드민 메뉴 nav 수`).toBeGreaterThan(0);
      for (const n of navs) {
        const hrefs = [...n.matchAll(/<a[^>]*href="([^"]+)"/g)].map((m) => m[1]);
        expect(hrefs, `${path}: 서버 그림 메뉴 링크`).toEqual(["/geo", "/how"]);
      }
      expect(html).not.toContain('data-testid="gate-welcome"');
    }
  });

  test("받기 전 · 받는 중 · 받지 못함(401 · 404 · 네트워크 실패 · 알 수 없는 모양)에서도 메뉴는 두 개 — 한 번도 여섯 개로 그려진 적 없음", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __maxLinks: number };
      w.__maxLinks = 0;
      const read = () => {
        for (const nav of document.querySelectorAll('nav[aria-label="어드민 메뉴"]')) w.__maxLinks = Math.max(w.__maxLinks, nav.querySelectorAll("a").length);
      };
      new MutationObserver(read).observe(document, { subtree: true, childList: true });
      const tick = () => {
        read();
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    for (const mode of ["지연", "401", "404", "abort", "shape"] as const) {
      await page.unroute("**/session").catch(() => undefined);
      await page.route("**/session", async (route) => {
        if (mode === "지연") {
          await new Promise((r) => setTimeout(r, 700));
          return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ name: "apply-acme-1124" }) });
        }
        if (mode === "abort") return route.abort();
        if (mode === "shape") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ unexpected: true }) });
        return route.fulfill({ status: Number(mode), contentType: "application/json", body: JSON.stringify({ error: "x" }) });
      });
      await page.goto("/how");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.waitForTimeout(1100);
      await expect(menu(page).getByRole("link"), mode).toHaveCount(2);
      const max = await page.evaluate(() => (window as unknown as { __maxLinks: number }).__maxLinks);
      expect(max, `${mode}: 어드민 메뉴 링크가 한 번에 가장 많이 그려진 수`).toBeLessThanOrEqual(2);
      await expect(tid(page, "gate-welcome")).toHaveCount(0);
    }
  });

  test("찾기 창(⌘K · 휴대폰은 찾기 단추)의 화면 줄도 두 개 — 작업실 · 알리기 · 유입 · 인스타 유입은 없음 · 사이트로 가기는 있음", async ({ page }) => {
    await mockGeo(page);
    await companySession(page);
    await page.goto("/how");
    await hydrated(page.locator(".adm-find"));
    if (isPhone(page)) await page.getByRole("button", { name: "찾기" }).click();
    else await page.keyboard.press("ControlOrMeta+k");
    const box = page.getByRole("dialog", { name: "찾기" });
    await expect(box).toBeVisible();
    const hints = await box.locator('li[role="option"] .h').allInnerTexts();
    expect(hints.filter((h) => /^\d$/.test(h.trim())).sort(), "찾기 창 화면 줄의 단축키 칸").toEqual(["2", "3"]);
    const labels = await box.locator('li[role="option"] .w').allInnerTexts();
    expect(labels.some((l) => l.trim() === "GEO 측정")).toBe(true);
    expect(labels.some((l) => l.trim() === "만드는 방식")).toBe(true);
    for (const gone of ["작업실", "알리기", "유입", "인스타 유입"]) expect(labels.some((l) => l.trim() === gone), `찾기 창에 ${gone} 없음`).toBe(false);
    expect(labels.some((l) => l.trim() === "사이트로 가기")).toBe(true);
    // 그 화면 이름으로 찾아도 안 나옴
    await box.getByRole("combobox").fill("인스타");
    const found = await box.locator('li[role="option"] .w').allInnerTexts();
    expect(found.some((l) => /인스타 유입/.test(l)), "찾기: 인스타 유입").toBe(false);
  });

  test("숫자 단축키 — 2(GEO) · 3(만드는 방식)만 움직임 · 1 · 4 · 5 · 6 · 7 · 0 은 아무 일도 없음 (넓은 화면)", async ({ page }) => {
    test.skip(isPhone(page), "글쇠 단축키는 넓은 화면");
    await mockGeo(page);
    await companySession(page);
    await page.goto("/how");
    await hydrated(page.locator(".adm-find"));
    for (const k of ["1", "4", "5", "6", "7", "0", "8", "9"]) {
      await page.keyboard.press(k);
      await page.waitForTimeout(150);
      await expect(page, `키 ${k} 는 동작 안 함`).toHaveURL(/\/how\/?$/);
    }
    await page.keyboard.press("2");
    await expect(page).toHaveURL(/\/geo\/?$/);
    await hydrated(page.locator(".adm-find"));
    for (const k of ["1", "4", "5", "6"]) {
      await page.keyboard.press(k);
      await page.waitForTimeout(150);
      await expect(page, `GEO 에서 키 ${k}`).toHaveURL(/\/geo\/?$/);
    }
    await page.keyboard.press("3");
    await expect(page).toHaveURL(/\/how\/?$/);
  });

  test("메뉴 링크를 누르면 GEO ↔ 만드는 방식으로 감 · 사이트로 가기(넓은 화면)는 flapfx.com", async ({ page }) => {
    await mockGeo(page);
    await companySession(page);
    await page.goto("/how");
    await menu(page).getByRole("link", { name: /^GEO/ }).click();
    await expect(page).toHaveURL(/\/geo\/?$/);
    await menu(page).getByRole("link", { name: "만드는 방식" }).click();
    await expect(page).toHaveURL(/\/how\/?$/);
    if (!isPhone(page)) await expect(page.getByRole("link", { name: "사이트로 가기" })).toHaveAttribute("href", "https://flapfx.com");
  });

  test("로고 링크는 /geo — 눌러도 /geo (막힌 /log 로 가지 않음)", async ({ page }) => {
    await mockGeo(page);
    await companySession(page);
    await page.goto("/how");
    await expect(brand(page)).toHaveAttribute("href", "/geo");
    await brand(page).click();
    await expect(page).toHaveURL(/\/geo\/?$/);
  });
});

test.describe("owner 세션 — 여섯 개 · 지금 그대로", () => {
  test("/log · /geo · /how · /marketing · /traffic · /instagram 어디서나 메뉴 여섯 · 로고 /log · 안내 창 없음", async ({ page }) => {
    await ownerSession(page);
    for (const path of ["/log", "/geo", "/how", "/marketing", "/traffic", "/instagram"]) {
      await page.goto(path);
      await expect(menu(page).getByRole("link"), path).toHaveCount(6);
      const hrefs = await menu(page).getByRole("link").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
      expect(hrefs, path).toEqual(["/log", "/geo", "/how", "/marketing", "/traffic", "/instagram"]);
      await expect(brand(page), path).toHaveAttribute("href", "/log");
      await expect(tid(page, "gate-welcome")).toHaveCount(0);
    }
  });

  test("찾기 창 화면 줄 여섯 · 숫자 단축키 1 · 4 · 5 · 6 도 움직임 (넓은 화면)", async ({ page }) => {
    test.skip(isPhone(page), "글쇠 단축키는 넓은 화면");
    await mockGeo(page);
    await ownerSession(page);
    await page.goto("/how");
    await expect(menu(page).getByRole("link")).toHaveCount(6);
    await hydrated(page.locator(".adm-find"));
    await page.keyboard.press("ControlOrMeta+k");
    const box = page.getByRole("dialog", { name: "찾기" });
    await expect(box).toBeVisible();
    const hints = await box.locator('li[role="option"] .h').allInnerTexts();
    expect(hints.filter((h) => /^\d$/.test(h.trim())).sort()).toEqual(["1", "2", "3", "4", "5", "6"]);
    await page.keyboard.press("Escape");
    for (const [key, re] of [["1", /\/log\/?$/], ["4", /\/marketing\/?$/], ["5", /\/traffic\/?$/], ["6", /\/instagram\/?$/]] as const) {
      await page.goto("/how");
      await expect(menu(page).getByRole("link")).toHaveCount(6);
      await hydrated(page.locator(".adm-find"));
      await page.keyboard.press(key);
      await expect(page, `키 ${key}`).toHaveURL(re);
    }
  });
});

test.describe("owner 확인이 늦게 와도 메뉴 칸이 흔들리지 않음", () => {
  /** 처음 두 링크 · 제목 · 본문 · (휴대폰) 위 메뉴 줄의 자리와 크기 */
  const snap = (page: Page) =>
    page.evaluate((phone) => {
      const nav = (phone ? document.querySelector("header.adm-mtop") : document.querySelector("aside.adm-side"))?.querySelector('nav[aria-label="어드민 메뉴"]') as HTMLElement | null;
      const r = (e: Element | null | undefined) => {
        const b = e?.getBoundingClientRect();
        return b ? { x: Math.round(b.x * 10) / 10, y: Math.round((b.y + scrollY) * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 } : null;
      };
      const links = [...(nav?.querySelectorAll("a") ?? [])];
      return {
        count: links.length,
        first: r(links[0]),
        second: r(links[1]),
        h1: r(document.querySelector("h1")),
        main: r(document.querySelector("main")),
        topbar: phone ? r(document.querySelector("header.adm-mtop")) : null,
        side: phone ? null : r(document.querySelector("aside.adm-side")),
        hscroll: document.documentElement.scrollWidth - innerWidth,
      };
    }, isPhone(page));

  for (const delay of [600, 1800]) {
    test(`owner 응답이 ${delay}ms 늦게 옴 — 두 개로 그리다가 여섯 개 · 처음 두 링크 · 제목 · 본문 · 위 메뉴 줄 높이 그대로 · 가로 넘침 0`, async ({ page }) => {
      await mockGeo(page);
      await ownerSession(page, delay);
      await page.goto("/how");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(menu(page).getByRole("link")).toHaveCount(2);
      await hydrated(page.locator(".adm-find"));
      const before = await snap(page);
      expect(before.count).toBe(2);
      await expect(menu(page).getByRole("link")).toHaveCount(6, { timeout: delay + 6000 });
      await page.waitForTimeout(250);
      const after = await snap(page);
      expect(after.count).toBe(6);
      expect(after.first, "처음 링크(GEO 측정) 자리").toEqual(before.first);
      expect(after.second, "둘째 링크(만드는 방식) 자리").toEqual(before.second);
      expect(after.h1, "제목 자리").toEqual(before.h1);
      expect(after.main, "본문 자리").toEqual(before.main);
      if (isPhone(page)) {
        expect(after.topbar?.h, "휴대폰 위 메뉴 줄 높이").toBe(before.topbar?.h);
        expect(after.topbar?.y, "휴대폰 위 메뉴 줄 위치").toBe(before.topbar?.y);
      } else {
        // 사이드는 위에서부터 쌓여 아래만 늘어남 — 위 끝 · 폭은 그대로
        expect(after.side?.y, "사이드 위치").toBe(before.side?.y);
        expect(after.side?.w, "사이드 폭").toBe(before.side?.w);
      }
      expect(before.hscroll).toBeLessThanOrEqual(0);
      expect(after.hscroll).toBeLessThanOrEqual(0);
    });
  }

  test("owner 로 확인된 뒤 더해지는 네 항목은 원래 순서대로 맨 뒤(작업실 · 알리기 · 유입 · 인스타 유입) — 앞의 두 개는 안 움직임", async ({ page }) => {
    await mockGeo(page);
    await ownerSession(page, 800);
    await page.goto("/how");
    await expect(menu(page).getByRole("link")).toHaveCount(2);
    await expect(menu(page).getByRole("link")).toHaveCount(6, { timeout: 7000 });
    const hrefs = await menu(page).getByRole("link").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs.sort()).toEqual(["/geo", "/how", "/instagram", "/log", "/marketing", "/traffic"].sort());
  });

  test("회사 세션은 /session 이 늦게 와도 메뉴 · 본문 자리가 그대로(두 개 그대로)", async ({ page }) => {
    await mockGeo(page);
    await companySession(page, "apply-acme-1124", 1200);
    await page.goto("/how");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await hydrated(page.locator(".adm-find"));
    const before = await snap(page);
    await page.waitForTimeout(1800);
    const after = await snap(page);
    expect(after).toEqual(before);
    expect(after.count).toBe(2);
  });
});

// 작업 0403 — 회사 링크(owner 가 아닌 세션)는 안내 창 없이 GEO 측정 · 만드는 방식 두 화면만 (builder e746e5f0 방식)
//   서버 쪽(막힌 4개 주소 → 302 /geo · 막힌 bff 403 · / → /geo · ?t= 이동 · owner 응답에만 data-viewer · Vary: Cookie)은 worker/company-session.test.ts · worker/viewer.test.ts
//   이 e2e 는 정적 서버(Worker 없음)에서 봄 — owner 는 Worker 가 붙이는 <html data-viewer="owner"> 를 첫 그림 전에 직접 붙여 흉내(helpers.ts ownerSession) · 회사는 표시 없음
//   약속
//     메뉴(사이드 · 휴대폰 위)는 정적 HTML 에 여섯 개를 그리고 회사용이 아닌 네 개에 data-owner-only · CSS html:not([data-viewer=owner]) [data-owner-only] { display:none } → 첫 그림부터 최종 모양(/session 을 기다리지 않음)
//     찾기 · 숫자 단축키 · 로고 링크는 useViewerOwner(서버 그림 false · 브라우저는 html 속성) — 회사 = 화면 두 줄 · 키 2/3 · 로고 /geo · owner = 여섯 줄 · 키 1~6 · 로고 /log
//     안내 창(role=dialog · data-testid="gate-welcome")은 없음 — 대신 넣는 안내 문구도 없음
//     추가 지시: 회사(owner 아님) 세션에만 원문 두 문장 — 넓은 화면은 사이드바 로그아웃 바로 위(.adm-demo-note-side) · 휴대폰(820px 이하)은 본문 맨 아래 한 번(.adm-demo-note-main) · owner 에겐 첫 그림부터 없음(html[data-viewer=owner] .adm-demo-note 숨김) · 기존 안내 문단(.adm-note)은 owner · 회사 모두 그대로 · 문구 때문에 메뉴 · 본문 위치가 변하지 않음
//     /session 이 늦게 와도(또는 실패해도) 메뉴 · 제목 · 본문 · 사이트로 가기 자리가 첫 프레임부터 끝까지 같음 · 회사 메뉴 아래에 빈칸이 없음(사이트로 가기가 두 개 바로 아래)
import { type Page, expect, test } from "@playwright/test";
import { companySession, hydrated, mockGeo, ownerSession } from "./helpers";

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 820;
const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
/** 지금 화면 폭에 맞는 어드민 메뉴(넓은 화면 사이드 · 휴대폰 위) — 숨겨진 링크(display none)는 role 조회에서 빠짐 */
const menu = (page: Page) => (isPhone(page) ? page.locator("header.adm-mtop") : page.locator("aside.adm-side")).getByRole("navigation", { name: "어드민 메뉴" });
const linkTexts = (page: Page) => menu(page).getByRole("link").evaluateAll((els) => els.map((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim()));
const hrefs = (page: Page) => menu(page).getByRole("link").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
const brand = (page: Page) => page.locator("a.adm-brand").filter({ visible: true }).first();

const COMPANY_PATHS = ["/geo", "/how"];
/** 채용 담당자 안내 글 전용 선택자(adm-demo-note-*) — 어드민 화면 곳곳의 기존 안내 문단은 클래스 adm-note 를 이미 쓰므로 그 이름과 섞지 않음 */
const DEMO_SEL = ".adm-demo-note-side, .adm-demo-note-main";
const SIX = ["/log", "/geo", "/how", "/marketing", "/traffic", "/instagram"];

test.describe("회사 세션 — 안내 창 없음 · 메뉴 두 개", () => {
  for (const path of COMPANY_PATHS) {
    test(`${path} — 안내 창(dialog · gate-welcome) 없음 · 메뉴는 GEO 측정 · 만드는 방식 두 개 · 로고는 /geo · 가로 넘침 0`, async ({ page }) => {
      await mockGeo(page);
      await companySession(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(menu(page).getByRole("link")).toHaveCount(2);
      const texts = await linkTexts(page);
      expect(texts.map((t) => (isPhone(page) && t === "GEO" ? "GEO 측정" : t.replace(/\s*\d$/, "")))).toEqual(["GEO 측정", "만드는 방식"]);
      expect(await hrefs(page)).toEqual(["/geo", "/how"]);
      await expect(menu(page).locator('a[aria-current="page"]')).toHaveCount(1);
      await expect(brand(page)).toHaveAttribute("href", "/geo");
      await page.waitForTimeout(900);
      await expect(tid(page, "gate-welcome")).toHaveCount(0);
      await expect(page.getByRole("dialog", { name: /전용 링크/ })).toHaveCount(0);
      await expect(page.getByText("전용 링크로 들어오셨습니다")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "둘러보기" })).toHaveCount(0);
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

  test("서버 그림(자바스크립트 없이 받은 HTML) — 메뉴 링크 여섯 개 중 회사용 아닌 네 개에만 data-owner-only · 회사용 두 개(GEO · 만드는 방식)에는 없음 · gate-welcome 없음", async ({ request }) => {
    for (const path of ["/geo", "/how"]) {
      const html = await (await request.get(path)).text();
      const navs = [...html.matchAll(/<nav[^>]*aria-label="어드민 메뉴"[^>]*>([\s\S]*?)<\/nav>/g)].map((m) => m[1] ?? "");
      expect(navs.length, `${path}: 어드민 메뉴 nav 수`).toBe(2); // 사이드 · 휴대폰 위
      for (const n of navs) {
        const links = [...n.matchAll(/<a\b([^>]*)>/g)].map((m) => m[1] ?? "");
        expect(links.map((a) => /href="([^"]+)"/.exec(a)?.[1]), `${path}: 서버 그림 메뉴 링크`).toEqual(SIX);
        expect(links.map((a) => /data-owner-only/.test(a)), `${path}: data-owner-only`).toEqual([true, false, false, true, true, true]);
      }
      expect(html).not.toContain('data-testid="gate-welcome"');
      expect(html, "서버 그림의 html 에는 owner 표시가 없음(Worker 가 owner 에게만 붙임)").not.toMatch(/<html[^>]*data-viewer/);
    }
  });

  test("CSS: 표시가 없으면 owner 전용 네 개는 display none · 표시가 있으면 보임", async ({ page }) => {
    await page.goto("/how");
    const display = () => menu(page).locator("a[data-owner-only]").evaluateAll((els) => els.map((e) => getComputedStyle(e).display));
    // 속성 없음 → 숨김 (role 조회는 숨은 링크를 빼므로 DOM 으로 직접 읽음)
    const hidden = await page.evaluate(() => [...document.querySelectorAll("[data-owner-only]")].map((e) => getComputedStyle(e).display));
    expect(hidden.length).toBeGreaterThanOrEqual(8); // 사이드 4 + 휴대폰 4
    for (const d of hidden) expect(d).toBe("none");
    await page.evaluate(() => document.documentElement.setAttribute("data-viewer", "owner"));
    const shown = await page.evaluate(() => [...document.querySelectorAll("[data-owner-only]")].map((e) => getComputedStyle(e).display));
    // 지금 화면 폭에서 안 보이는 쪽 메뉴(휴대폰 폭의 사이드 · 넓은 화면의 위 메뉴)는 부모가 숨겨 있으므로 보이는 메뉴 쪽만 봄
    expect((await display()).every((d) => d !== "none"), `표시 있음 → 보이는 메뉴의 owner 전용 항목 display: ${(await display()).join()}`).toBe(true);
    expect(shown.some((d) => d !== "none")).toBe(true);
  });

  test("받기 전 · 받는 중 · 받지 못함(401 · 404 · 네트워크 실패 · 알 수 없는 모양)에서도 보이는 메뉴는 늘 두 개 — 한 번도 여섯 개로 그려진 적 없음", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __maxVisible: number };
      w.__maxVisible = 0;
      const read = () => {
        for (const nav of document.querySelectorAll('nav[aria-label="어드민 메뉴"]')) w.__maxVisible = Math.max(w.__maxVisible, [...nav.querySelectorAll("a")].filter((a) => a.getClientRects().length > 0).length);
      };
      // 그림이 그려지는 프레임(rAF)에서만 읽음 — 스타일이 붙기 전 DOM 삽입 순간은 화면에 그려지지 않음
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
      const max = await page.evaluate(() => (window as unknown as { __maxVisible: number }).__maxVisible);
      expect(max, `${mode}: 보이는 어드민 메뉴 링크가 한 번에 가장 많았던 수`).toBeLessThanOrEqual(2);
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
    await hydrated(page.locator(".adm-find"));
    await expect(brand(page)).toHaveAttribute("href", "/geo");
    await brand(page).click();
    await expect(page).toHaveURL(/\/geo\/?$/);
  });
});

test.describe("owner 세션 — 여섯 개 · 지금 그대로", () => {
  test("/log · /geo · /how · /marketing · /traffic · /instagram 어디서나 메뉴 여섯 · 로고 /log · 안내 창 없음", async ({ page }) => {
    await ownerSession(page);
    for (const path of SIX) {
      await page.goto(path);
      await expect(menu(page).getByRole("link"), path).toHaveCount(6);
      expect(await hrefs(page), path).toEqual(SIX);
      await hydrated(page.locator(".adm-find"));
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

test.describe("첫 프레임부터 끝 모양 — /session 이 늦어도 메뉴 · 본문 · 사이트로 가기 자리 변화 0", () => {
  /** 첫 프레임부터 매 프레임, 보이는 메뉴 링크 수와 자리(처음 링크 · 메뉴 아래 끝 · 사이트로 가기 · 본문 · 휴대폰 위 메뉴 줄)를 모음 */
  const RECORD = () => {
    const w = window as unknown as { __fr: Record<string, number>[]; __stop: boolean };
    w.__fr = [];
    w.__stop = false;
    const t0 = performance.now();
    const r = (e: Element | null | undefined) => e?.getBoundingClientRect();
    const tick = () => {
      const phone = getComputedStyle(document.querySelector("header.adm-mtop") ?? document.body).display !== "none";
      const nav = (phone ? document.querySelector("header.adm-mtop") : document.querySelector("aside.adm-side"))?.querySelector('nav[aria-label="어드민 메뉴"]');
      const main = r(document.querySelector("main"));
      if (nav && main && main.height > 0) {
        const links = [...nav.querySelectorAll("a")].filter((a) => a.getClientRects().length > 0);
        const first = r(links[0]);
        const last = r(links[links.length - 1]);
        const foot = r(document.querySelector("aside.adm-side .adm-nav.foot a"));
        const top = r(document.querySelector("header.adm-mtop"));
        const note = r([...document.querySelectorAll(".adm-demo-note-side, .adm-demo-note-main")].find((e) => e.getClientRects().length > 0));
        const logout = phone ? null : r(document.querySelector("aside.adm-side .adm-logout"));
        w.__fr.push({
          t: Math.round(performance.now() - t0),
          n: links.length,
          firstX: Math.round((first?.x ?? -1) * 2) / 2,
          firstY: Math.round(((first?.y ?? -1) + scrollY) * 2) / 2,
          lastBottom: Math.round(((last?.bottom ?? -1) + scrollY) * 2) / 2,
          footY: phone ? -1 : Math.round(((foot?.y ?? -1) + scrollY) * 2) / 2,
          mainY: Math.round((main.y + scrollY) * 2) / 2,
          mainX: Math.round(main.x * 2) / 2,
          topH: Math.round((top?.height ?? -1) * 2) / 2,
          noteY: note && !phone ? Math.round((note.y + scrollY) * 2) / 2 : -1, // 휴대폰은 본문 맨 아래라 아래 내용이 늦게 늘면 따라 내려감(문구 탓이 아님) — 넓은 화면 사이드만 잼
          noteH: note ? Math.round(note.height * 2) / 2 : -1,
          logoutY: logout ? Math.round((logout.y + scrollY) * 2) / 2 : -1,
        });
      }
      if (!w.__stop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const frames = async (page: Page) => {
    await page.evaluate(() => {
      (window as unknown as { __stop: boolean }).__stop = true;
    });
    return page.evaluate(() => (window as unknown as { __fr: Record<string, number>[] }).__fr);
  };
  const sig = (f: Record<string, number>) => JSON.stringify({ n: f.n, firstX: f.firstX, firstY: f.firstY, lastBottom: f.lastBottom, footY: f.footY, mainY: f.mainY, mainX: f.mainX, topH: f.topH, noteY: f.noteY, noteH: f.noteH, logoutY: f.logoutY });

  for (const [who, want] of [["회사", 2], ["owner", 6]] as const) {
    for (const delay of [1500, 0]) {
      test(`${who} · /session ${delay === 0 ? "즉시" : `${delay}ms 늦게`} — 첫 프레임부터 끝까지 보이는 메뉴 ${want}개 · 모든 프레임의 자리가 같음`, async ({ page }) => {
        await mockGeo(page);
        if (who === "owner") await ownerSession(page, delay);
        else await companySession(page, "apply-acme-1124", delay);
        await page.addInitScript(RECORD);
        await page.goto("/how", { waitUntil: "commit" });
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await hydrated(page.locator(".adm-find"));
        await page.waitForTimeout(delay + 900);
        const fr = await frames(page);
        expect(fr.length, "기록한 프레임 수").toBeGreaterThan(20);
        const sigs = new Set(fr.map(sig));
        expect([...sigs], `프레임마다 메뉴 · 본문 자리가 달라짐: ${[...sigs].slice(0, 3).join(" | ")}`).toHaveLength(1);
        expect(fr[0]?.n, `${who}: 첫 프레임 보이는 메뉴 링크 수`).toBe(want);
        expect(Math.max(...fr.map((f) => f.n)), "가장 많았던 수").toBe(want);
        expect(Math.min(...fr.map((f) => f.n)), "가장 적었던 수").toBe(want);
      });
    }
  }

  test("/session 이 실패(401 · 네트워크 실패)해도 회사 메뉴는 두 개 · 자리 변화 0", async ({ page }) => {
    await mockGeo(page);
    await page.route("**/session", (route) => route.abort());
    await page.addInitScript(RECORD);
    await page.goto("/how", { waitUntil: "commit" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.waitForTimeout(1200);
    const fr = await frames(page);
    expect(new Set(fr.map(sig)).size).toBe(1);
    expect(fr[0]?.n).toBe(2);
  });

  test("회사 메뉴 아래에 빈칸이 없음 — 넓은 화면은 두 번째 링크 바로 아래에 '사이트로 가기'(간격 48px 이하) · owner 도 여섯 번째 바로 아래", async ({ page }) => {
    test.skip(isPhone(page), "넓은 화면 사이드");
    await mockGeo(page);
    await companySession(page);
    await page.goto("/how");
    await expect(menu(page).getByRole("link")).toHaveCount(2);
    const gap = () =>
      page.evaluate(() => {
        const links = [...document.querySelectorAll('aside.adm-side nav[aria-label="어드민 메뉴"] a')].filter((a) => a.getClientRects().length > 0);
        const last = links[links.length - 1]?.getBoundingClientRect();
        const foot = document.querySelector("aside.adm-side .adm-nav.foot a")?.getBoundingClientRect();
        return Math.round(((foot?.y ?? 0) - (last?.bottom ?? 0)) * 10) / 10;
      });
    const companyGap = await gap();
    expect(companyGap, `회사: 메뉴 마지막 링크와 사이트로 가기 사이 ${companyGap}px`).toBeGreaterThan(0);
    expect(companyGap).toBeLessThanOrEqual(48);
    await page.unroute("**/session");
    await ownerSession(page);
    await page.goto("/how");
    await expect(menu(page).getByRole("link")).toHaveCount(6);
    const ownerGap = await gap();
    expect(ownerGap, `owner: ${ownerGap}px`).toBeGreaterThan(0);
    expect(ownerGap).toBeLessThanOrEqual(48);
  });

  test("휴대폰 위 메뉴 — 회사 두 개 · owner 여섯 개 모두 줄 높이 52 그대로 · 가로 넘침 0", async ({ page }) => {
    test.skip(!isPhone(page), "휴대폰 위 메뉴");
    await mockGeo(page);
    await companySession(page);
    await page.goto("/how");
    await expect(menu(page).getByRole("link")).toHaveCount(2);
    const h1 = (await page.locator("header.adm-mtop").boundingBox())?.height;
    await page.unroute("**/session");
    await ownerSession(page);
    await page.goto("/how");
    await expect(menu(page).getByRole("link")).toHaveCount(6);
    const h2 = (await page.locator("header.adm-mtop").boundingBox())?.height;
    expect(h1).toBe(h2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});

const NOTE = "채용 담당자분들을 위한 데모 링크입니다. 열람 기록이 남지 않도록 모든 분께 같은 링크 하나를 드리고 있습니다.";

test.describe("채용 담당자 안내 글 (작업 0403 추가 지시)", () => {
  const visible = (page: Page) => page.locator(DEMO_SEL).evaluateAll((els) => els.filter((e) => e.getClientRects().length > 0).map((e) => ({ cls: e.className, text: (e.textContent ?? "").replace(/\s+/g, " ").trim() })));

  for (const path of COMPANY_PATHS) {
    test(`${path} · 회사 세션 — 보이는 안내 글은 정확히 하나 · 원문 두 문장 그대로 · ${"넓은 화면은 사이드 · 휴대폰은 본문 맨 아래"}`, async ({ page }) => {
      await mockGeo(page);
      await companySession(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const shown = await visible(page);
      expect(shown, "보이는 안내 글 수").toHaveLength(1);
      expect(shown[0]?.text, "원문 그대로").toBe(NOTE);
      expect(shown[0]?.cls).toContain(isPhone(page) ? "adm-demo-note-main" : "adm-demo-note-side");
      await expect(page.getByText(NOTE, { exact: true }).filter({ visible: true })).toHaveCount(1);
    });
  }

  test("넓은 화면 — 문구는 사이드바 '사이트로 가기' 아래 · 로그아웃 바로 위 · 겹치지 않음 · 글자 12px 이상 · 사이드 안에 들어 있음", async ({ page }) => {
    test.skip(isPhone(page), "넓은 화면 사이드바");
    await mockGeo(page);
    await companySession(page);
    await page.goto("/how");
    const g = await page.evaluate(() => {
      const r = (sel: string) => document.querySelector(sel)?.getBoundingClientRect();
      const note = document.querySelector(".adm-demo-note-side") as HTMLElement;
      const side = r("aside.adm-side");
      const nb = note.getBoundingClientRect();
      const foot = r("aside.adm-side .adm-nav.foot");
      const out = r("aside.adm-side .adm-logout");
      return { nb, foot, out, side, fs: Number.parseFloat(getComputedStyle(note).fontSize), sw: note.scrollWidth - note.clientWidth };
    });
    expect(g.nb.top, "사이트로 가기 아래").toBeGreaterThanOrEqual((g.foot?.bottom ?? 0) - 0.5);
    expect(g.nb.bottom, "로그아웃 위").toBeLessThanOrEqual((g.out?.top ?? 0) + 0.5);
    expect((g.out?.top ?? 0) - g.nb.bottom, "문구와 로그아웃 사이").toBeLessThanOrEqual(16);
    expect(g.nb.left).toBeGreaterThanOrEqual((g.side?.left ?? 0) - 0.5);
    expect(g.nb.right).toBeLessThanOrEqual((g.side?.right ?? 0) + 0.5);
    expect(g.fs, "작은 글씨여도 12px 이상").toBeGreaterThanOrEqual(12);
    expect(g.sw, "글이 칸 밖으로 넘치지 않음").toBeLessThanOrEqual(0);
    await expect(page.locator(".adm-demo-note-main")).toBeHidden();
  });

  test("휴대폰 — 문구는 본문 맨 아래 한 번(마지막 내용 뒤) · 사이드 문구는 안 보임 · 가로 넘침 0", async ({ page }) => {
    test.skip(!isPhone(page), "휴대폰");
    await mockGeo(page);
    await companySession(page);
    await page.goto("/how");
    await expect(page.locator(".adm-demo-note-main")).toBeVisible();
    await expect(page.locator(".adm-demo-note-side")).toBeHidden();
    const g = await page.evaluate(() => {
      const main = document.querySelector("main") as HTMLElement;
      const note = document.querySelector(".adm-demo-note-main") as HTMLElement;
      const last = main.lastElementChild;
      const content = [...main.children].filter((e) => e !== note && e.getClientRects().length > 0);
      const lastContent = content[content.length - 1]?.getBoundingClientRect();
      return { isLast: last === note, noteTop: note.getBoundingClientRect().top + scrollY, contentBottom: (lastContent?.bottom ?? 0) + scrollY, hs: document.documentElement.scrollWidth - innerWidth, fs: Number.parseFloat(getComputedStyle(note).fontSize) };
    });
    expect(g.isLast, "본문의 맨 마지막 요소").toBe(true);
    expect(g.noteTop, "마지막 내용 아래").toBeGreaterThanOrEqual(g.contentBottom - 0.5);
    expect(g.fs).toBeGreaterThanOrEqual(12);
    expect(g.hs).toBeLessThanOrEqual(0);
  });

  test("owner — 안내 글이 어디에도 안 보임(사이드 · 본문 모두 display none) · 로그아웃은 맨 아래 그대로", async ({ page }) => {
    await mockGeo(page);
    await ownerSession(page);
    await page.goto("/how");
    await expect(menu(page).getByRole("link")).toHaveCount(6);
    expect(await visible(page)).toHaveLength(0);
    await expect(page.getByText(NOTE, { exact: true }).filter({ visible: true })).toHaveCount(0);
    if (!isPhone(page)) {
      const bottom = await page.evaluate(() => {
        const out = document.querySelector("aside.adm-side .adm-logout")?.getBoundingClientRect();
        const side = document.querySelector("aside.adm-side")?.getBoundingClientRect();
        return { gap: (side?.bottom ?? 0) - (out?.bottom ?? 0) };
      });
      expect(bottom.gap, "로그아웃이 사이드 맨 아래(여백 40px 이하)").toBeLessThanOrEqual(40);
    }
  });

  test("서버 그림(HTML) — 안내 글 두 곳(사이드 · 본문)에 원문 두 문장이 그대로 · owner 숨김은 CSS(html[data-viewer=owner])", async ({ request }) => {
    for (const path of ["/geo", "/how"]) {
      const html = await (await request.get(path)).text();
      expect(html.split(NOTE).length - 1, `${path}: 원문이 들어 있는 곳`).toBe(2);
      expect(html).toContain("adm-demo-note-side");
      expect(html).toContain("adm-demo-note-main");
    }
  });

  test("문구가 있어도 메뉴 · 본문 · 사이트로 가기 · 로그아웃 자리가 첫 프레임부터 끝까지 같고, /session 이 늦어도 같음", async ({ page }) => {
    await mockGeo(page);
    await companySession(page, "apply-acme-1124", 1500);
    await page.addInitScript(() => {
      const w = window as unknown as { __nf: string[]; __stop: boolean };
      w.__nf = [];
      w.__stop = false;
      const tick = () => {
        const note = [...document.querySelectorAll(".adm-demo-note-side, .adm-demo-note-main")].find((e) => e.getClientRects().length > 0)?.getBoundingClientRect();
        const phone = getComputedStyle(document.querySelector("header.adm-mtop") ?? document.body).display !== "none";
        const main = document.querySelector("main")?.getBoundingClientRect();
        const nav = document.querySelector("aside.adm-side .adm-nav.foot a, header.adm-mtop")?.getBoundingClientRect();
        if (main && main.height > 0) w.__nf.push(JSON.stringify([note ? (phone ? 1 : Math.round((note.y + scrollY) * 2) / 2) : -1, note ? Math.round(note.height * 2) / 2 : -1, Math.round((main.y + scrollY) * 2) / 2, Math.round((nav?.y ?? -1) * 2) / 2]));
        if (!w.__stop) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.goto("/how", { waitUntil: "commit" });
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await hydrated(page.locator(".adm-find"));
    await page.waitForTimeout(2400);
    const fr = await page.evaluate(() => {
      (window as unknown as { __stop: boolean }).__stop = true;
      return (window as unknown as { __nf: string[] }).__nf;
    });
    expect(fr.length).toBeGreaterThan(20);
    expect([...new Set(fr)], "문구 · 본문 · 메뉴 자리가 프레임마다 같음").toHaveLength(1);
    expect(JSON.parse(fr[0] as string)[0], "첫 프레임부터 문구가 있음").toBeGreaterThan(0);
  });
});

test.describe("owner 화면의 기존 안내 문단은 그대로 (작업 0403 — .adm-note 는 기존 문단 클래스)", () => {
  /** 새 안내 글이 아닌 기존 페이지 안내 문단 중 눈에 보이는 것 */
  const pageNotes = (page: Page) => page.locator(".adm-note").evaluateAll((els) => els.filter((e) => e.getClientRects().length > 0).map((e) => (e.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 40)));

  for (const path of ["/how", "/geo"]) {
    test(`${path} — owner 와 회사가 보는 기존 안내 문단이 같음(owner 에게 사라지지 않음) · 새 안내 글만 다름`, async ({ page }) => {
      await mockGeo(page);
      await companySession(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await hydrated(page.locator(".adm-find"));
      await page.waitForTimeout(600);
      const company = await pageNotes(page);
      expect(company.length, `${path}: 회사가 보는 기존 안내 문단 수`).toBeGreaterThan(0);
      await page.unroute("**/session");
      await ownerSession(page);
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await hydrated(page.locator(".adm-find"));
      await page.waitForTimeout(600);
      const owner = await pageNotes(page);
      expect(owner, `${path}: owner 의 기존 안내 문단`).toEqual(company);
      expect(await visible(page)).toHaveLength(0); // 새 글은 owner 에게 없음
    });
  }
});

test.describe("공용 링크(recruiter)와 회사 링크(apply-…)는 같은 화면 (작업 0403)", () => {
  for (const name of ["recruiter", "apply-acme-1124"]) {
    test(`${name} — 메뉴 두 개 · 로고 /geo · 안내 글 한 번 · 안내 창 없음`, async ({ page }) => {
      await mockGeo(page);
      await companySession(page, name);
      await page.goto("/geo");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(menu(page).getByRole("link")).toHaveCount(2);
      expect(await hrefs(page)).toEqual(["/geo", "/how"]);
      await expect(brand(page)).toHaveAttribute("href", "/geo");
      const shown = await visible(page);
      expect(shown).toHaveLength(1);
      expect(shown[0]?.text).toBe(NOTE);
      await page.waitForTimeout(700);
      await expect(tid(page, "gate-welcome")).toHaveCount(0);
    });
  }
});

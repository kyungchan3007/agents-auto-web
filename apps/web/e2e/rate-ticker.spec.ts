// 작업 0399 — 흐르는 환율 띠 e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   홈: hero 캐러셀 맨 아래(알약 · ‹ › 아래)에 띠 · 바닥 고정 띠 없음 · 높이 52px(휴대폰 44px)
//   홈 밖(통화 · 통화 상세 · 여행 물가 · 나라 물가 · 직구 계산 · 항공권 · 소개 · 404): 화면 바닥 고정(position fixed · bottom 0 · 높이 48px · 휴대폰 42px) · 맨 아래에서 바닥 출처 띠를 안 가림 · 메뉴(z 50) · 시트(z 70)보다 아래
//   builder 가 만든 표시(shared/ticker/rate-ticker.tsx — 홈 · 바닥이 같은 부품) — 클래스 rt-*
//     [data-testid="rate-ticker"]  띠 루트(section · aria-label "오늘 환율") · data-variant="hero"(홈 hero 아래) | "fixed"(바닥 고정) · data-run="true"(흐름 켜짐 = 자바스크립트가 돌고 움직임 줄이기가 아닐 때) · data-held(손가락으로 만짐)
//     .rt-label  왼쪽 고정 라벨 — 넓은 화면 "오늘 환율 · 11.27 기준" · 휴대폰 "오늘 환율"(날짜는 CSS 로 숨김)
//     .rt-view   흐르는 칸(overflow) — 흐름 켜짐이면 hidden · 꺼짐(자바스크립트 꺼짐 · 움직임 줄이기)이면 가로 스크롤 · .rt-track 이 CSS animation 으로 왼쪽으로(약 40px/초) · 마우스(.rt-view:hover) · 키보드 초점(:focus-within)이면 animation-play-state paused
//     ul.rt-row  항목 줄 — 읽히는 목록은 aria-hidden 이 없는 첫 줄 하나 · 두 번째(복사본)는 aria-hidden="true" · 복사본 링크 tabindex -1
//     [data-testid="rate-ticker-item"]  읽히는 줄의 항목 링크(a · href="/currencies/{코드}") — 안에 국기 · .rt-name · .rt-amount(금액) · .rt-sig(점 + 글 · 신호가 없으면 없음)
//   띠가 붙을 때 페이지 위치가 움직이지 않게 처음부터 아래 여백 확보 · 띠 글자 대비는 값을 기록만(.tmp/ticker-contrast.json · 4.5 미만이면 lead 에게)
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { type Locator, type Page, expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";
import { hydrated } from "./helpers";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const OTHER = ["/currencies", "/currencies/USD", "/prices", "/prices/JPN", "/calc", "/flights", "/about", "/__no_such_page__"];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("flapfx:intro-off", "1");
    } catch {}
  });
});

const barH = (isMobile: boolean) => (isMobile ? 42 : 48);
const heroH = (isMobile: boolean) => (isMobile ? 44 : 52);
const box = async (loc: Locator, name: string) => {
  const b = await loc.first().boundingBox();
  if (!b) throw new Error(`${name} 가 화면에 없음`);
  return b;
};
const scrollTo = async (page: Page, where: "top" | "mid" | "bottom") => {
  await page.evaluate((w) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo(0, w === "top" ? 0 : w === "mid" ? Math.floor(max / 2) : max);
  }, where);
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120)))));
};

test.describe("홈 — hero 캐러셀 맨 아래 띠 · 바닥 고정 띠 없음", () => {
  for (const [label, force] of [["블프 장(지금 시각 그대로)", false], ["기본 장", true]] as const) {
    test(`${label} — hero 아래 띠(placement hero) · 알약 · ‹ › 아래 · 높이 52(휴대폰 44) · 바닥 띠 없음`, async ({ page, isMobile }) => {
      if (force) await forceDefaultHero(page);
      await page.goto("/");
      const t = tid(page, "rate-ticker");
      await expect(t).toHaveCount(1);
      await expect(t).toHaveAttribute("data-variant", "hero");
      await expect(page.locator('[data-testid="hero-carousel"] [data-testid="rate-ticker"]')).toHaveCount(1);
      const tb = await box(t, "띠");
      expect(Math.abs(tb.height - heroH(isMobile)), "띠 높이").toBeLessThanOrEqual(1);
      // 알약 · ‹ › 줄은 블프 기간에만 보임(기본 장에서는 CSS 로 숨김) — 보이는 장 · 줄 아래에 띠
      const slide = await box(page.locator('[data-testid="hero-slide"][data-active="true"]'), "보이는 장");
      expect(tb.y, "보이는 장 아래").toBeGreaterThanOrEqual(slide.y + slide.height - 1);
      const tabs = tid(page, "hero-tabs");
      if (await tabs.isVisible()) {
        const tabsBox = await box(tabs, "알약");
        expect(tb.y, "알약 줄 아래").toBeGreaterThanOrEqual(tabsBox.y + tabsBox.height - 1);
      }
      expect(await t.evaluate((el) => getComputedStyle(el).position), "홈 띠는 바닥 고정이 아님").not.toBe("fixed");
      expect(await page.locator('[data-testid="rate-ticker"][data-variant="fixed"]').count()).toBe(0);
      await scrollTo(page, "bottom");
      expect(await page.locator("*").evaluateAll((els) => els.filter((e) => getComputedStyle(e).position === "fixed" && e.getBoundingClientRect().bottom >= innerHeight - 1 && e.getBoundingClientRect().height > 20 && e.closest("[data-testid='rate-ticker']")).length), "바닥 고정 띠 없음").toBe(0);
    });
  }
});

test.describe("홈 밖 — 화면 바닥 고정 띠", () => {
  for (const path of OTHER) {
    test(`${path} — 맨 위 · 중간 · 맨 아래에서 bottom 0 · 높이 48(휴대폰 42) · 맨 아래에서 바닥 출처 띠 · 마지막 내용을 안 가림`, async ({ page, isMobile }) => {
      await page.goto(path);
      const t = tid(page, "rate-ticker");
      await expect(t).toHaveCount(1);
      await expect(t).toHaveAttribute("data-variant", "fixed");
      expect(await t.evaluate((el) => getComputedStyle(el).position)).toBe("fixed");
      for (const where of ["top", "mid", "bottom"] as const) {
        await scrollTo(page, where);
        const b = await box(t, `띠(${where})`);
        const vh = page.viewportSize()!.height;
        expect(Math.abs(b.y + b.height - vh), `${where}: 화면 바닥(bottom 0)`).toBeLessThanOrEqual(1);
        expect(Math.abs(b.height - barH(isMobile)), `${where}: 높이`).toBeLessThanOrEqual(1);
      }
      // 맨 아래: 마지막 내용(바닥 출처 띠 footer 또는 main 끝)이 띠 위
      await scrollTo(page, "bottom");
      const last = await page.evaluate(() => {
        const f = document.querySelector("footer");
        const el = f ?? document.querySelector("main") ?? document.body;
        return el.getBoundingClientRect().bottom;
      });
      const tb = await box(t, "띠");
      expect(last, "마지막 내용 아래 끝이 띠 위").toBeLessThanOrEqual(tb.y + 1);
    });

    test(`${path} — 띠가 붙을 때 · 글꼴 로딩 뒤에도 띠 자리(아래 여백)와 본문 위치가 움직이지 않음(서버 첫 그림부터 여백 확보)`, async ({ page }) => {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      const read = () =>
        page.evaluate(() => {
          const sp = document.querySelector(".rt-spacer")?.getBoundingClientRect().height ?? -1;
          const t = document.querySelector('[data-testid="rate-ticker"]')?.getBoundingClientRect();
          return { spacer: sp, tickerH: t?.height ?? -1, tickerBottom: t ? t.bottom : -1, top: document.querySelector("main")?.getBoundingClientRect().top ?? 0 };
        });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      const early = await read();
      expect(early.spacer, "서버 첫 그림에 여백이 이미 있음").toBeGreaterThan(30);
      await hydrated(tid(page, "rate-ticker"));
      await page.waitForTimeout(1200);
      const late = await read();
      expect(Math.abs(late.spacer - early.spacer), "띠 아래 여백").toBeLessThanOrEqual(1);
      expect(Math.abs(late.tickerH - early.tickerH), "띠 높이").toBeLessThanOrEqual(1);
      expect(Math.abs(late.tickerBottom - early.tickerBottom), "띠 위치").toBeLessThanOrEqual(1);
      expect(Math.abs(late.top - early.top), "본문 위치").toBeLessThanOrEqual(1);
    });
  }
});

test.describe("항목 · 순서 · 라벨 · 읽기 · 누르면", () => {
  test("항목: 국기 · 이름 · 금액 · (신호) — 엔 · 달러 · 유로 순으로 시작 · 금액은 '원' 으로 끝", async ({ page }) => {
    await page.goto("/currencies");
    const copy1 = page.locator('[data-testid="rate-ticker"] [data-testid="rate-ticker-item"]');
    const n = await copy1.count();
    expect(n).toBeGreaterThanOrEqual(3);
    const names = await copy1.evaluateAll((as) => as.map((a) => (a.textContent ?? "").replace(/\s+/g, " ").trim()));
    expect(names[0]).toContain("엔");
    expect(names[1]).toContain("달러");
    expect(names[2]).toContain("유로");
    for (let i = 0; i < n; i++) {
      const it = copy1.nth(i);
      await expect(it.locator('.rt-amount')).toHaveText(/^[\d,]+(\.\d)?원$/);
      const sig = it.locator('.rt-sig');
      if (await sig.count()) await expect(sig).toHaveText(/낮음|보통|높음/);
      expect(await it.getAttribute("href")).toMatch(/^\/currencies\/[A-Z]{3}$/);
    }
    // 흐르는 복사본은 같은 항목 수 · 같은 주소
    const copy2 = page.locator('[data-testid="rate-ticker"] ul.rt-row[aria-hidden="true"] a');
    expect(await copy2.count()).toBe(n);
    expect(await copy2.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(await copy1.evaluateAll((as) => as.map((a) => a.getAttribute("href"))));
  });

  test("라벨 — 넓은 화면 '오늘 환율 · M.DD 기준' · 휴대폰 '오늘 환율'", async ({ page, isMobile }) => {
    await page.goto("/currencies");
    const label = page.locator(".rt-label");
    await expect(label).toBeVisible();
    if (isMobile) await expect(label).toHaveText("오늘 환율");
    else await expect(label).toHaveText(/^오늘 환율\s*· \d{1,2}\.\d{2} 기준$/);
  });

  test("화면 읽기 목록은 하나 — 읽히는 목록 1개 · 링크 수 = 항목 수 · 복사본은 aria-hidden · 복사본 링크는 tabindex -1", async ({ page }) => {
    await page.goto("/currencies");
    const t = tid(page, "rate-ticker");
    const n = await t.locator('[data-testid="rate-ticker-item"]').count();
    await expect(t.getByRole("list")).toHaveCount(1);
    await expect(t.getByRole("listitem")).toHaveCount(n);
    await expect(t.getByRole("link")).toHaveCount(n);
    await expect(t.locator('ul.rt-row[aria-hidden="true"]')).toHaveAttribute("aria-hidden", "true");
    expect(await t.locator('ul.rt-row[aria-hidden="true"] a').evaluateAll((as) => as.every((a) => a.getAttribute("tabindex") === "-1"))).toBe(true);
  });

  test("항목을 누르면 /currencies/{통화 코드}", async ({ page }) => {
    await page.goto("/prices");
    const first = page.locator('[data-testid="rate-ticker"] [data-testid="rate-ticker-item"]').first();
    const href = await first.getAttribute("href");
    await first.click();
    await expect(page).toHaveURL(new RegExp(`${href}/?$`));
  });

  test("홈 hero 띠 항목도 누르면 통화 상세", async ({ page }) => {
    await page.goto("/");
    const first = page.locator('[data-testid="rate-ticker"] [data-testid="rate-ticker-item"]').first();
    const href = await first.getAttribute("href");
    await first.click();
    await expect(page).toHaveURL(new RegExp(`${href}/?$`));
  });
});

test.describe("움직임", () => {
  const x = (page: Page) => page.locator(".rt-track").evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);

  test("흐름 — 같은 줄을 두 번 이어 왼쪽으로 · 약 초당 40px(30~55px) · 줄이 끝에서 끊기지 않음(한 바퀴 뒤에도 위치가 되돌아옴)", async ({ page }) => {
    await page.goto("/currencies");
    await hydrated(tid(page, "rate-ticker"));
    const track = page.locator(".rt-track");
    expect(await track.evaluate((el) => getComputedStyle(el).animationName), "애니메이션이 있음").not.toBe("none");
    const a = await x(page);
    await page.waitForTimeout(1000);
    const b = await x(page);
    expect(a - b, "1초에 왼쪽으로 움직인 px").toBeGreaterThan(30);
    expect(a - b).toBeLessThan(55);
    // 같은 줄 두 번 — 트랙 폭이 한 복사본 폭의 두 배
    const [w1, w2, wt] = await track.evaluate((el) => [...el.querySelectorAll("ul.rt-row")].map((c) => c.getBoundingClientRect().width).concat(el.getBoundingClientRect().width));
    expect(Math.abs(w1 - w2), "두 복사본 폭이 같음").toBeLessThanOrEqual(1);
    expect(wt).toBeGreaterThanOrEqual(w1 + w2 - 2);
  });

  test("마우스를 올리면 멈춤 · 떼면 다시 흐름", async ({ page }) => {
    await page.goto("/currencies");
    await hydrated(tid(page, "rate-ticker"));
    const t = tid(page, "rate-ticker");
    const track = page.locator(".rt-track");
    const b = await box(t, "띠");
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await expect.poll(() => track.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");
    const a = await x(page);
    await page.waitForTimeout(600);
    expect(Math.abs((await x(page)) - a), "멈춘 동안 움직이지 않음").toBeLessThanOrEqual(1);
    await page.mouse.move(b.x + b.width / 2, 5);
    await expect.poll(() => track.evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("running");
  });

  test("키보드 초점이 들어오면 멈춤", async ({ page }) => {
    await page.goto("/currencies");
    await hydrated(tid(page, "rate-ticker"));
    await page.locator('[data-testid="rate-ticker"] [data-testid="rate-ticker-item"]').first().focus();
    await expect.poll(() => page.locator(".rt-track").evaluate((el) => getComputedStyle(el).animationPlayState)).toBe("paused");
  });

  test("움직임 줄이기 — 흐르지 않고 가로 스크롤만(첫 항목부터)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies");
    await hydrated(tid(page, "rate-ticker"));
    const track = page.locator(".rt-track");
    expect(await track.evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    const a = await x(page);
    await page.waitForTimeout(700);
    expect(Math.abs((await x(page)) - a)).toBeLessThanOrEqual(0.5);
    const scroll = await page.locator(".rt-view").evaluate((el) => {
      const s = getComputedStyle(el);
      return { ox: s.overflowX, sw: el.scrollWidth, cw: el.clientWidth, left: el.scrollLeft };
    });
    expect(["auto", "scroll"]).toContain(scroll.ox);
    expect(scroll.sw, "항목이 띠보다 길어 가로로 밀어 볼 수 있음").toBeGreaterThan(scroll.cw);
    expect(scroll.left, "처음에는 첫 항목부터").toBe(0);
  });

  test("자바스크립트 꺼짐 — 서버 첫 그림에 띠 · 흐르지 않고 가로 스크롤", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL: baseURL ?? undefined });
    const page = await ctx.newPage();
    await page.goto("/currencies");
    const t = tid(page, "rate-ticker");
    await expect(t).toHaveCount(1);
    expect(await t.locator('[data-testid="rate-ticker-item"]').count()).toBeGreaterThanOrEqual(3);
    expect(await page.locator(".rt-track").evaluate((el) => getComputedStyle(el).animationName)).toBe("none");
    const s = await page.locator(".rt-view").evaluate((el) => ({ ox: getComputedStyle(el).overflowX, sw: el.scrollWidth, cw: el.clientWidth, left: el.scrollLeft }));
    expect(["auto", "scroll"]).toContain(s.ox);
    expect(s.sw).toBeGreaterThan(s.cw);
    expect(s.left).toBe(0);
    await ctx.close();
  });
});

test.describe("겹치는 순서 — 메뉴 · 시트가 띠보다 위", () => {
  test("띠의 z-index 는 메뉴(50) · 시트(70)보다 낮음", async ({ page }) => {
    await page.goto("/currencies");
    const z = await tid(page, "rate-ticker").evaluate((el) => {
      const v = getComputedStyle(el).zIndex;
      return v === "auto" ? 0 : Number(v);
    });
    expect(z, "띠 z-index").toBeLessThan(50);
  });

  test("휴대폰 메뉴를 열면 메뉴가 띠 위(띠 자리를 메뉴가 덮으면 메뉴가 먼저 눌림)", async ({ page, isMobile }) => {
    test.skip(!isMobile, "휴대폰 메뉴 버튼은 휴대폰 프로젝트에서만");
    await page.goto("/currencies");
    await hydrated(tid(page, "rate-ticker"));
    const btn = page.getByRole("banner").getByRole("button", { name: /메뉴/ });
    await expect(async () => {
      if ((await btn.getAttribute("aria-expanded")) !== "true") await btn.click();
      await expect(btn).toHaveAttribute("aria-expanded", "true", { timeout: 1000 });
    }).toPass({ timeout: 10_000 });
    const hit = await page.evaluate(() => {
      const t = document.querySelector('[data-testid="rate-ticker"]')!.getBoundingClientRect();
      const h = document.querySelector("header")!.getBoundingClientRect();
      // 메뉴(헤더 안)와 띠가 겹치는 높이가 있으면 그 점에서 맨 위는 헤더 쪽 · 겹침이 없으면 통과
      const y = Math.max(t.top, h.top) + 2;
      const overlap = h.bottom > t.top;
      const top = document.elementFromPoint(innerWidth / 2, Math.min(y, innerHeight - 1));
      return { overlap, inHeader: !!top?.closest("header"), inTicker: !!top?.closest("[data-testid='rate-ticker']") };
    });
    if (hit.overlap) expect(hit.inHeader, "겹치는 자리에서는 메뉴가 위").toBe(true);
  });

  test("나라 시트(1024 미만)를 열면 시트 · 막이 띠 위 — 띠 자리를 눌러도 띠가 아니라 시트 · 막", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto("/prices");
    const links = page.locator('[data-testid="price-bands"] [data-testid="price-band-link"]');
    await hydrated(tid(page, "price-bands"));
    await expect(async () => {
      await links.first().evaluate((el) => (el as HTMLElement).click());
      await expect(tid(page, "country-sidebar")).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15_000 });
    const hit = await page.evaluate(() => {
      const t = document.querySelector('[data-testid="rate-ticker"]')!.getBoundingClientRect();
      const el = document.elementFromPoint(innerWidth / 2, t.top + t.height / 2);
      return { inTicker: !!el?.closest("[data-testid='rate-ticker']"), inSheet: !!el?.closest("[data-testid='country-sidebar']"), inBackdrop: el?.getAttribute("data-testid") === "country-side-backdrop" };
    });
    expect(hit.inTicker, "시트가 열린 동안 띠가 시트를 덮지 않음").toBe(false);
    expect(hit.inSheet || hit.inBackdrop).toBe(true);
  });
});

test.describe("320 ~ 1600 · 넓은 글꼴 — 띠가 겹침 · 가로 스크롤을 만들지 않음", () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, "폭을 직접 맞춰 재는 검사 — 넓은 화면 프로젝트에서만");
  });
  for (const wide of [false, true]) {
    test(`/currencies · /prices/JPN · 홈 ${wide ? "넓은 글꼴 " : ""}— 가로 스크롤 없음 · 띠가 라벨 · 항목과 겹치지 않음 · 띠가 화면 안`, async ({ page }) => {
      test.setTimeout(180_000);
      for (const path of ["/currencies", "/prices/JPN", "/"]) {
        await page.goto(path);
        if (wide) await page.addStyleTag({ content: `*{font-family:"Arial Black","Verdana",sans-serif !important;letter-spacing:0.02em !important}` });
        for (const w of [320, 360, 390, 480, 600, 768, 900, 1024, 1280, 1440, 1600]) {
          await page.setViewportSize({ width: w, height: 800 });
          await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120)))));
          const r = await page.evaluate(() => {
            const t = document.querySelector('[data-testid="rate-ticker"]')!;
            const tr = t.getBoundingClientRect();
            const lab = document.querySelector('.rt-label')!.getBoundingClientRect();
            const first = document.querySelector('[data-testid="rate-ticker"] [data-testid="rate-ticker-item"]')!;
            // 라벨 오른쪽에 항목이 겹쳐 보이지 않게(라벨 뒤는 흐려지는 칸) — 라벨은 띠 안쪽
            return { sx: document.documentElement.scrollWidth - document.documentElement.clientWidth, inView: tr.left >= -1 && tr.right <= innerWidth + 1, labInside: lab.left >= tr.left - 1 && lab.right <= tr.right + 1 && lab.height <= tr.height + 1, firstHeight: first.getBoundingClientRect().height };
          });
          expect(r.sx, `${path} ${w}px 가로 스크롤`).toBeLessThanOrEqual(0);
          expect(r.inView, `${path} ${w}px 띠가 화면 안`).toBe(true);
          expect(r.labInside, `${path} ${w}px 라벨이 띠 안`).toBe(true);
        }
      }
    });
  }
});

// 글자 대비 — 값은 기록만(lead 요청). 띠 뒤 배경을 띠를 숨긴 채 찍어 평균색을 구하고 띠 바탕(rgba(24,36,100,.36))을 얹은 색과 흰 글자의 대비를 잼(blur · saturate 는 무시한 근사)
test.describe("글자 대비 기록", () => {
  test("홈 밖 바닥 띠 — 흰 본문 위 · 파란 머리 위(맨 위 · 중간 · 맨 아래) 글자 대비 값을 .tmp/ticker-contrast.json 에 기록", async ({ page, isMobile }) => {
    test.setTimeout(180_000);
    const rows: { path: string; where: string; viewport: string; contrast: number }[] = [];
    for (const path of ["/prices/JPN", "/currencies", "/calc", "/about"]) {
      await page.goto(path);
      await hydrated(tid(page, "rate-ticker"));
      for (const where of ["top", "mid", "bottom"] as const) {
        await scrollTo(page, where);
        const b = await box(tid(page, "rate-ticker"), "띠");
        await tid(page, "rate-ticker").evaluate((el) => ((el as HTMLElement).style.visibility = "hidden"));
        const shot = await page.screenshot({ clip: { x: b.x, y: b.y, width: b.width, height: b.height } });
        await tid(page, "rate-ticker").evaluate((el) => ((el as HTMLElement).style.visibility = ""));
        const contrast = await page.evaluate(async (b64) => {
          const img = new Image();
          img.src = `data:image/png;base64,${b64}`;
          await img.decode();
          const c = document.createElement("canvas");
          c.width = img.width;
          c.height = img.height;
          const g = c.getContext("2d")!;
          g.drawImage(img, 0, 0);
          const lum = (r: number, gg: number, bb: number) => {
            const f = (v: number) => {
              const s = v / 255;
              return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
            };
            return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(bb);
          };
          let worst = 21;
          const cols = 8;
          for (let i = 0; i < cols; i++) {
            const d = g.getImageData(Math.floor((i * c.width) / cols), 0, Math.max(1, Math.floor(c.width / cols)), c.height).data;
            let r = 0, gg = 0, bb = 0, n = 0;
            for (let p = 0; p < d.length; p += 4) { r += d[p]; gg += d[p + 1]; bb += d[p + 2]; n++; }
            r /= n; gg /= n; bb /= n;
            const a = 0.36; // 띠 바탕 rgba(24,36,100,.36) 을 뒤 색 위에 얹음
            const L = lum(a * 24 + (1 - a) * r, a * 36 + (1 - a) * gg, a * 100 + (1 - a) * bb);
            worst = Math.min(worst, (1 + 0.05) / (L + 0.05)); // 흰 글자(L=1) 대비
          }
          return Math.round(worst * 100) / 100;
        }, shot.toString("base64"));
        rows.push({ path, where, viewport: isMobile ? "휴대폰" : "넓은 화면", contrast });
      }
    }
    const dir = resolve(process.cwd(), "../../.tmp");
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/ticker-contrast-${isMobile ? "mobile" : "desktop"}.json`, JSON.stringify(rows, null, 1));
    test.info().annotations.push({ type: "대비(흰 글자 · 최소)", description: JSON.stringify(rows.map((r) => `${r.path}@${r.where}=${r.contrast}`)) });
    for (const r of rows) expect(r.contrast, `${r.path} ${r.where}`).toBeGreaterThan(1); // 기록용 — 판정은 lead
  });
});

// 작업 0393 — 기본 hero 고른 곳: 탑승권 모션 · 숫자 칸 · 제안 목록 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   builder 가 다는 표시(data-testid): hero-facts(숫자 칸) 안 hero-facts-title · hero-fact-rate · hero-fact-tenk · hero-fact-price · hero-fact-bar(role=img) · hero-fact-position · hero-fact-link · hero-facts-mine(고른 뒤에만)
//     제안 목록 줄 오른쪽 hero-suggest-code(공항 코드) · 탑승권 hero-pass(data-s · data-city) 의 라벨 .hp-lbl[data-mine=true] · 링크 hero-pass-go
//   값은 홈이 받는 환율 · 신호 · 물가에서만 — 값이 없는 칸은 글이 정확히 "-" (인도는 통화가 없어 전부 "-")
import { type Locator, type Page, expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const box = async (loc: Locator, name: string) => {
  const b = await loc.first().boundingBox();
  if (!b) throw new Error(`${name} 가 화면에 없음`);
  return b;
};
const front = (page: Page) => page.locator('[data-testid="hero-pass"][data-s="0"]');
const frontCity = async (page: Page) => (await front(page).getAttribute("data-city")) ?? "";
const chip = (page: Page, city: string) => tid(page, "hero-chip").filter({ hasText: city });
const outs = (page: Page) => page.evaluate(() => (window as unknown as { __outs: string[] }).__outs.slice());
const resetOuts = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as { __outs: string[] }).__outs.length = 0;
    (window as unknown as { __snaps: unknown[] }).__snaps.length = 0;
  });
const snaps = (page: Page) => page.evaluate(() => (window as unknown as { __snaps: Record<string, string>[] }).__snaps.slice());

test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
  await page.addInitScript(() => {
    localStorage.setItem("flapfx:intro-off", "1");
    // 탑승권이 사라지기 시작한 때(data-s 가 out 으로 바뀐 때)를 도시와 함께 기록 — 한 번 고르는데 여러 번 기록되면 "반복"
    (window as unknown as { __outs: string[] }).__outs = [];
    (window as unknown as { __snaps: Record<string, string>[] }).__snaps = [];
    new MutationObserver((ms) => {
      for (const m of ms) {
        const el = m.target as HTMLElement;
        if (el.getAttribute("data-s") === "out") (window as unknown as { __outs: string[] }).__outs.push(el.getAttribute("data-city") ?? "");
      }
      // 바뀔 때마다 모든 장의 자리를 기록 — 넘김 중 어느 장이 어느 자리인지 나중에 확인
      const snap: Record<string, string> = {};
      for (const e of Array.from(document.querySelectorAll('[data-testid="hero-pass"]'))) snap[e.getAttribute("data-city") ?? ""] = e.getAttribute("data-s") ?? "";
      (window as unknown as { __snaps: Record<string, string>[] }).__snaps.push(snap);
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ["data-s"] });
  });
});

const settle = async (page: Page) => {
  await expect(front(page)).toHaveCount(1);
  await expect.poll(() => page.locator('[data-testid="hero-pass"][data-s="out"]').count(), { timeout: 5000 }).toBe(0);
};

test.describe("고르기 모션 — 처음 모션 한 번 (작업 0393 R1)", () => {
  test("칩 도쿄 → 방콕 → 다낭: 누를 때마다 맨 앞 장이 한 번만 사라지고 그 도시가 맨 앞", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    for (const city of ["도쿄", "방콕", "다낭"]) {
      await settle(page);
      if ((await frontCity(page)) === city) continue; // 자동 넘김으로 이미 맨 앞이면 건너뜀
      const before = await frontCity(page);
      await resetOuts(page);
      await chip(page, city).click();
      await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe(city);
      await page.waitForTimeout(1800); // 끊김 · 반복이 있다면 이 사이에 한 번 더 기록됨
      expect(await outs(page), `${city} 고른 뒤 사라진 장`).toEqual([before]);
      expect(await frontCity(page)).toBe(city);
    }
  });

  test("넘김 중 연달아 누르면 마지막 것만 — 끝난 뒤 맨 앞은 마지막으로 누른 도시 · 장은 도시당 한 장", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    await chip(page, "방콕").click();
    await chip(page, "다낭").click();
    await expect.poll(() => frontCity(page), { timeout: 5000 }).toBe("다낭");
    await page.waitForTimeout(1800);
    expect(await frontCity(page)).toBe("다낭");
    const cities = await tid(page, "hero-pass").evaluateAll((els) => els.map((e) => e.getAttribute("data-city")));
    expect(new Set(cities).size).toBe(cities.length);
  });

  test("고른 뒤 8초가 지나도 자동 넘김 없음 — 맨 앞은 그대로 · 사라진 장 기록 없음", async ({ page }) => {
    test.setTimeout(40_000);
    await page.goto("/");
    await settle(page);
    const target = (await frontCity(page)) === "방콕" ? "다낭" : "방콕";
    await chip(page, target).click();
    await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe(target);
    await page.waitForTimeout(1200);
    await resetOuts(page);
    await page.waitForTimeout(9000);
    expect(await outs(page)).toEqual([]);
    expect(await frontCity(page)).toBe(target);
  });

  test("고른 곳 라벨 · 항공권 링크 — 고른 장에만 \"· 고른 곳\" 과 \"{도시} 항공권 날짜 보기 ›\"", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const target = (await frontCity(page)) === "방콕" ? "다낭" : "방콕";
    await chip(page, target).click();
    await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe(target);
    await expect(front(page).locator('.hp-lbl[data-mine="true"]')).toHaveCount(1);
    await expect(front(page).locator('.hp-lbl[data-mine="true"]')).toContainText("고른 곳");
    await expect(tid(page, "hero-pass").locator('.hp-lbl[data-mine="true"]')).toHaveCount(1);
    await expect(tid(page, "hero-pass-go")).toHaveCount(1);
    await expect(tid(page, "hero-pass-go")).toHaveText(`${target} 항공권 날짜 보기 ›`);
  });
});

test.describe("검색으로 고르기 — 네 도시 밖 (작업 0393 R1 · R3)", () => {
  test("'뉴델리' 입력 → 제안 \"인도 뉴델리\" → Enter: 그 곳 장이 맨 앞 · 덱 밖 장은 하나 · 숫자 칸 제목 · 환율 · 1만원이면 \"-\"", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    await tid(page, "hero-search").fill("뉴델리");
    await expect(page.getByRole("option", { name: /인도 뉴델리/ })).toBeVisible();
    await tid(page, "hero-search").press("Enter");
    await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe("뉴델리");
    await expect(tid(page, "hero-facts-title")).toHaveText("인도 뉴델리");
    await expect(tid(page, "hero-facts-mine")).toBeVisible();
    // 인도는 통화가 없어 환율 · 1만원이면은 "-" · 물가는 나라 기준 자료라 있으면 숫자 · 없으면 "-"
    for (const id of ["hero-fact-rate", "hero-fact-tenk"]) await expect(tid(page, id), id).toHaveText("-");
    await expect(tid(page, "hero-fact-price")).toHaveText(/^(-|비슷|\d+% (낮음|높음))$/);
    expect(await tid(page, "hero-pass").count()).toBe(5);
    // 또 다른 도시를 고르면 덱 밖 장은 여전히 하나
    await tid(page, "hero-search").fill("뭄바이");
    await tid(page, "hero-search").press("Enter");
    await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe("뭄바이");
    await expect.poll(() => tid(page, "hero-pass").count(), { timeout: 4000 }).toBe(5);
    expect(await tid(page, "hero-pass").evaluateAll((els) => els.map((e) => e.getAttribute("data-city")))).not.toContain("뉴델리");
  });

  test("제안 줄 클릭 · 보기 단추 · Enter 가 같은 결과 — 방콕을 입력해 세 가지로 고름", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const done = async () => {
      await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe("방콕");
      await expect(tid(page, "hero-facts-title")).toHaveText("태국 방콕");
      await settle(page);
    };
    await tid(page, "hero-search").fill("방콕");
    await page.getByRole("option", { name: /방콕/ }).first().click();
    await done();
    await tid(page, "hero-search").fill("다낭");
    await tid(page, "hero-go").click();
    await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe("다낭");
    await settle(page);
    await tid(page, "hero-search").fill("방콕");
    await tid(page, "hero-search").press("Enter");
    await done();
  });

  test("제안 목록이 입력칸과 겹치지 않고(입력칸 아래 8px 안팎) 맨 위에 보임 · 줄 오른쪽 공항 코드", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const input = tid(page, "hero-search");
    await input.fill("인도");
    const list = page.getByRole("listbox", { name: "도시 · 나라 제안" });
    await expect(list).toBeVisible();
    const f = await box(page.locator("form.hp-ask"), "입력칸");
    const l = await box(list, "제안 목록");
    expect(l.y, "목록 위쪽은 입력칸 아래쪽보다 아래").toBeGreaterThanOrEqual(f.y + f.height + 4);
    expect(l.y - (f.y + f.height)).toBeLessThanOrEqual(14);
    // 목록 안 여러 점이 실제로 목록(맨 위)이어야 — 칩 · 안내 글이 비치거나 위에 올라오지 않음
    const hits = await page.evaluate(
      ({ x, y, w, h }) => [0.1, 0.5, 0.9].flatMap((fx) => [0.15, 0.5, 0.85].map((fy) => !!document.elementFromPoint(x + w * fx, y + h * fy)?.closest('[role="listbox"]'))),
      { x: l.x, y: l.y, w: l.width, h: l.height },
    );
    expect(hits.every(Boolean), "목록 위에 다른 것이 올라옴").toBe(true);
    // 불투명 — 배경 알파 1
    const bg = await list.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toMatch(/^rgb\(/);
    // 도시 · 나라 검색은 그대로: "도쿄" 제안 줄에 공항 코드
    await input.fill("도쿄");
    const opt = page.getByRole("option", { name: /도쿄/ }).first();
    await expect(opt).toBeVisible();
    await expect(opt.locator('[data-testid="hero-suggest-code"]')).toHaveText(/^[A-Z]{3}$/);
    const o = await box(opt, "줄");
    const c = await box(opt.locator('[data-testid="hero-suggest-code"]'), "공항 코드");
    expect(c.x + c.width, "공항 코드는 줄 오른쪽").toBeGreaterThan(o.x + o.width * 0.7);
  });
});

test.describe("숫자 칸 (작업 0393 R2)", () => {
  test("안 골랐을 때 맨 앞 탑승권 도시를 따라감 · 비지 않음 · 값 있는 도시는 \"-\" 아님", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const city = await frontCity(page);
    await expect(tid(page, "hero-facts")).toBeVisible();
    await expect(tid(page, "hero-facts-title")).toContainText(city);
    await expect(tid(page, "hero-facts-mine")).toHaveCount(0);
    for (const id of ["hero-fact-rate", "hero-fact-tenk", "hero-fact-price", "hero-fact-position"]) expect(((await tid(page, id).textContent()) ?? "").trim().length, id).toBeGreaterThan(0);
    await expect(tid(page, "hero-fact-bar")).toHaveAttribute("role", "img");
    // 값이 있는 곳은 숫자가 있음 (환율 칸)
    const rate = (await tid(page, "hero-fact-rate").textContent()) ?? "";
    if (rate.trim() !== "-") expect(rate).toMatch(/\d/);
  });

  test("도쿄 → 방콕 → 다낭 → 뉴델리: 숫자 칸 제목이 따라가고 높이는 같음 (±1px)", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    const heights: number[] = [];
    for (const [city, title] of [
      ["도쿄", "일본 도쿄"],
      ["방콕", "태국 방콕"],
      ["다낭", "베트남 다낭"],
    ] as const) {
      await chip(page, city).click();
      await expect(tid(page, "hero-facts-title")).toHaveText(title);
      await settle(page);
      heights.push((await box(tid(page, "hero-facts"), "숫자 칸")).height);
    }
    await tid(page, "hero-search").fill("뉴델리");
    await tid(page, "hero-search").press("Enter");
    await expect(tid(page, "hero-facts-title")).toHaveText("인도 뉴델리");
    await settle(page);
    heights.push((await box(tid(page, "hero-facts"), "숫자 칸")).height);
    expect(Math.max(...heights) - Math.min(...heights), `숫자 칸 높이 ${heights.join(" · ")}`).toBeLessThanOrEqual(1);
  });

  test("값이 있는 도쿄: 오늘 환율 \"원\" · 1만원이면 \"엔\" · 위치 문장 \"90일 중\" · 나라 페이지 링크 · 값을 지어내지 않음(숫자 + 단위 모양)", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    await chip(page, "도쿄").click();
    await expect(tid(page, "hero-facts-title")).toHaveText("일본 도쿄");
    const rate = (await tid(page, "hero-fact-rate").textContent()) ?? "";
    test.skip(rate.trim() === "-", "이 환경의 자료에 엔 환율이 없음");
    expect(rate).toMatch(/\d[\d,.]*원/);
    expect(rate).toContain("1엔");
    expect((await tid(page, "hero-fact-tenk").textContent()) ?? "").toMatch(/\d[\d,]*\s*엔/);
    await expect(tid(page, "hero-fact-position")).toContainText("90일 중");
    await expect(tid(page, "hero-fact-link")).toHaveAttribute("href", /\/(prices|currencies)\//);
  });
});

test.describe("새로고침 뒤 유지 (작업 0393 R1)", () => {
  test("방콕을 고르고 새로고침하면 고른 곳(저장 값 · 숫자 칸 제목)이 그대로", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    await chip(page, "방콕").click();
    await expect(tid(page, "hero-facts-title")).toHaveText("태국 방콕");
    await page.reload();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("flapfx:picked") ?? "null")?.city)).toBe("방콕");
    await expect(tid(page, "hero-facts-title")).toHaveText("태국 방콕");
  });
});

// 추가 지시 — 고를 때 사라지는 동안 원래 1번 장(B)이 드러나지 않음: 맨 앞 A · 1번 B 일 때 C 를 고르면 사라지는 동안 data-s=1 은 C · 끝나면 C 가 0 · 중간에 B 가 0 이 되는 순간 없음
test.describe("고르는 동안 원래 1번 장이 드러나지 않음 (작업 0393 추가)", () => {
  const CHIPS = ["도쿄", "방콕", "다낭", "파리"];
  const perms = <T,>(a: T[]): T[][] => (a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map((r) => [x, ...r])));

  type Sample = { out: boolean; zero: string[]; stack: { city: string; op: number }[] };
  /** 50ms 마다 탑승권 묶음 가운데를 찍음 — 그 점에 겹친 장을 위에서 아래로(elementsFromPoint) · 보이는 정도(opacity) · 자리 */
  const startSampler = (page: Page) =>
    page.evaluate(() => {
      const w = window as unknown as { __samp: Sample[]; __sampId: number };
      if (!document.getElementById("__hit")) {
        const st = document.createElement("style");
        st.id = "__hit";
        st.textContent = ".hp-passes, .hp-pass { pointer-events: auto !important; }"; // 장식 묶음은 평소 클릭을 통과시킴 — 검사 때만 찍히게
        document.head.append(st);
      }
      w.__samp = [];
      w.__sampId = window.setInterval(() => {
        const f = document.querySelector(".hp-float")?.getBoundingClientRect();
        if (!f) return;
        const all = Array.from(document.querySelectorAll('[data-testid="hero-pass"]')) as HTMLElement[];
        const stack = document
          .elementsFromPoint(f.left + f.width / 2, f.top + f.height / 2)
          .map((e) => e.closest('[data-testid="hero-pass"]') as HTMLElement | null)
          .filter((e, i, a): e is HTMLElement => !!e && a.indexOf(e) === i)
          .map((e) => ({ city: e.getAttribute("data-city") ?? "", op: Number.parseFloat(getComputedStyle(e).opacity) }));
        w.__samp.push({ out: all.some((e) => e.getAttribute("data-s") === "out"), zero: all.filter((e) => e.getAttribute("data-s") === "0").map((e) => e.getAttribute("data-city") ?? ""), stack });
      }, 50);
    });
  const stopSampler = (page: Page) =>
    page.evaluate(() => {
      const w = window as unknown as { __samp: Sample[]; __sampId: number };
      clearInterval(w.__sampId);
      return w.__samp;
    });

  /** 한 번 고르고 · 끝난 뒤 기록을 검사 */
  const pickAndCheck = async (page: Page, target: string, doPick: () => Promise<void>) => {
    await settle(page);
    const a = await frontCity(page);
    if (a === target) return;
    const b = await page.locator('[data-testid="hero-pass"][data-s="1"]').getAttribute("data-city");
    await resetOuts(page);
    await startSampler(page);
    await doPick();
    await expect.poll(() => frontCity(page), { timeout: 4000 }).toBe(target);
    await settle(page);
    await page.waitForTimeout(300);
    const samples = await stopSampler(page);
    const log = await snaps(page);
    const why = `${a}(앞) · ${b}(1번) → ${target} 고름`;
    const i = log.findIndex((m) => m[a] === "out");
    expect(i, `${why}: 맨 앞 장이 사라지는 기록`).toBeGreaterThanOrEqual(0);
    expect(log[i][target], `${why}: 사라지는 동안 1번 자리는 고른 장`).toBe("1");
    for (const [k, m] of log.entries()) {
      const zero = Object.entries(m).filter(([, v]) => v === "0").map(([c]) => c);
      for (const c of zero) expect([a, target], `${why}: ${k}번째 기록에서 ${c} 가 0 번 자리`).toContain(c);
    }
    expect(log.at(-1)?.[target], `${why}: 끝나면 고른 장이 0`).toBe("0");
    // 실제 화면: 사라지는 동안(out 이 있는 표본) 맨 앞(A)을 뺀 보이는 장 중 가장 위는 늘 고른 장 · 0번 자리에는 A 나 고른 장만
    const during = samples.filter((m) => m.out);
    expect(during.length, `${why}: 사라지는 동안 찍은 표본`).toBeGreaterThanOrEqual(4);
    for (const [k, m] of during.entries()) {
      const top = m.stack.filter((x) => x.city !== a && x.op > 0.05)[0];
      expect(top?.city, `${why}: 사라지는 ${k}번째 표본(${k * 50}ms 쯤) 맨 앞 아래 가장 위 장 ${JSON.stringify(m.stack)}`).toBe(target);
    }
    for (const m of samples) for (const c of m.zero) expect([a, target], `${why}: 0번 자리에 ${c}`).toContain(c);
  };

  test("네 칩의 모든 순서(24가지) — 매 선택마다 B 가 0 이 되는 순간 없음 · 사라지는 동안 1번은 고른 장", async ({ page }, info) => {
    test.setTimeout(300_000);
    await page.goto("/");
    const orders = info.project.name === "넓은 화면" ? perms(CHIPS) : perms(CHIPS).filter((_, i) => i % 6 === 0);
    for (const order of orders) for (const city of order) await pickAndCheck(page, city, () => chip(page, city).click());
  });

  test("덱 밖 도시(오사카 · 뉴델리 · 뭄바이)와 칩을 섞어 고르기 — 같은 규칙", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    const viaSearch = (q: string) => async () => {
      await tid(page, "hero-search").fill(q);
      await tid(page, "hero-search").press("Enter");
    };
    for (const [city, q] of [
      ["오사카", "오사카"],
      ["도쿄", ""],
      ["뉴델리", "뉴델리"],
      ["뭄바이", "뭄바이"],
      ["다낭", ""],
      ["오사카", "오사카"],
      ["방콕", ""],
    ] as const) await pickAndCheck(page, city, q ? viaSearch(q) : () => chip(page, city).click());
  });
});

// 작업 0366 — 통화 상세 고칠 것 넷 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   1) 한 줄 답: "1파운드는 1,761.5원으로, 1년 평균 1,937.1원보다 9% 낮습니다." · 상자 높이 고정(넓은 화면 한 줄 · 휴대폰 두 줄 · 통화를 바꿔도 상자 · 1년 최저 · 최고 카드 위치 그대로 · 문장이 가장 긴 통화 포함) · 자주 묻는 질문 첫 답은 그대로(단위 테스트 + 여기)
//   2) 사이드바에서 몇 번을 골라도 버튼 국기는 마지막 통화 하나 · 아래 줄 "고른 통화 · …"
//   3) 칩 · 검색으로 바꿔도 같은 규칙 · 새로 고치면 기본 넷
//   4) 넓은 화면: 열 때 날아간 국기가 사이드바 목록의 보이는 범위 안 줄에 앉음(사이드바 밖으로 빠지지 않음) · 보이지 않으면 날지 않음 · 닫을 때도 보이는 줄에서만 버튼으로 돌아감
//      좁은 화면 시트: 국기 날아가기 없음 · 여행 물가 사이드바도 깨지지 않음
//   움직임의 모양(곡선 · 시간)은 @design 이라 여기서 보지 않음 — 날아가는 국기 복제본([data-side-fly])의 위치만 프레임마다 읽음
// 표시(data-testid): currency-answer(한 줄 답 상자 · 안에 p 둘: 라벨 · 문장) · route-card(1년 최저 · 최고 · 평균 카드) · currency-more · currency-more-flag(data-currency) · currency-more-sub · currency-sidebar · currency-side-list · currency-side-row · chip(data-code) · currency-search
//   날아가는 국기 복제본 = body 바로 아래 [data-side-fly] (0361 부터 있던 것) · 목록 줄의 국기 자리 = [data-fly-to=코드]
import { type Page, expect, test } from "@playwright/test";
import { hydrated } from "./helpers";
import { listCodes, listLink, openSide, tid } from "./currency-list";

const flags = (page: Page) => tid(page, "currency-more-flag").evaluateAll((els) => els.map((e) => e.getAttribute("data-currency")));
const urlIs = (page: Page, code: string) => expect(page).toHaveURL(new RegExp(`/currencies/${code}/?$`), { timeout: 12000 });
const quiet = async (page: Page) => {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(900);
};
const nameOf = (page: Page, code: string) => listLink(page, code).locator('[data-testid="currency-name"]').first().innerText();
const html = async (page: Page, path: string) => {
  const r = await page.request.get(path);
  expect(r.status(), `${path} 가 정적 페이지로 있어야 함`).toBe(200);
  return r.text();
};
/** 정적 HTML 에서 한 줄 답 문장(라벨 아래 p) — 없으면 null */
const answerOf = (h: string): string | null => {
  const i = h.indexOf('data-testid="currency-answer"');
  if (i < 0) return null;
  const block = h.slice(i, h.indexOf("</div>", i));
  const ps = [...block.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim());
  return ps[1] ?? null;
};
const LINE = /^\d*[^\s\d]+(은|는) [\d,.]+원으로, 1년 평균 [\d,.]+원(보다 \d+% (낮|높)습니다|과 거의 같습니다)\.$/;
const NO_RECORD = /^\d*[^\s\d]+(은|는) [\d,.]+원입니다\.$/; // 1년 기록을 못 받은 통화(지어내지 않음)

// ─────────────────────────────── 1) 한 줄 답
test.describe("한 줄 답 문장 (작업 0366 · 1)", () => {
  test("정적 HTML — 모든 통화가 \"오늘 값 · 1년 평균 값 · %\" 한 문장 · 1년 최저 · 괄호 · 차이 글자 없음 · 낮음/높음이 숫자와 맞음", async ({ page }) => {
    await page.goto("/currencies/USD");
    const codes = await listCodes(page);
    expect(codes.length).toBeGreaterThan(3);
    for (const code of codes) {
      const t = answerOf(await html(page, `/currencies/${code}`));
      if (t === null) continue; // 오늘 값이 없으면 상자가 없음
      expect(t, `${code} 문장`).not.toMatch(/1년 최저|[()]|차이|낮고|높고/);
      expect(LINE.test(t) || NO_RECORD.test(t), `${code}: ${t}`).toBe(true);
      const nums = (t.match(/[\d,]+(?:\.\d+)?(?=원)/g) ?? []).map((n) => Number(n.replace(/,/g, "")));
      if (nums.length === 2) {
        if (/낮습니다/.test(t)) expect(nums[0], `${code} 낮음: ${t}`).toBeLessThan(nums[1]);
        if (/높습니다/.test(t)) expect(nums[0], `${code} 높음: ${t}`).toBeGreaterThan(nums[1]);
      }
    }
  });

  test("자주 묻는 질문 첫 답은 그대로 — 1년 평균(값) · 1년 최저(값)와는 … 차이 문장이 있음", async ({ page }) => {
    await page.goto("/currencies/JPY");
    const first = tid(page, "faq-item").first();
    await expect(first).toBeVisible();
    const text = (await first.innerText()).replace(/\s+/g, " ");
    expect(text).toMatch(/1년 평균\([\d,.]+원\)/);
    expect(text).toMatch(/1년 최저\([\d,.]+원\)와는 [\d.]+% 차이/);
  });
});

// ─────────────────────────────── 1) 상자 높이 고정
const isWide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
/** 한 줄 답 상자 · 문장 줄 수 · 1년 최저 · 최고 카드가 상자 맨 위에서 얼마나 아래인지 (문서 좌표) */
const measureAnswer = (page: Page) =>
  page.evaluate(() => {
    const box = document.querySelector('[data-testid="currency-answer"]');
    const card = document.querySelector('[data-testid="route-card"]');
    if (!box || !card) return null;
    const p = box.querySelectorAll("p")[1] as HTMLElement;
    const lh = parseFloat(getComputedStyle(p).lineHeight);
    const [b, c, pr] = [box.getBoundingClientRect(), card.getBoundingClientRect(), p.getBoundingClientRect()];
    return { boxH: Math.round(b.height * 10) / 10, textH: Math.round(pr.height * 10) / 10, lines: Math.round(pr.height / lh), cardFromBox: Math.round((c.top - b.top) * 10) / 10 };
  });

test.describe("한 줄 답 상자 높이 고정 (작업 0366 · 1)", () => {
  test("모든 통화(문장이 가장 긴 통화 포함) — 상자 높이 · 문장 줄 수(넓은 화면 1줄 · 휴대폰 2줄) · 상자에서 1년 최저 · 최고 카드까지 거리가 같음", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    const codes = await listCodes(page);
    const rows: { code: string; len: number }[] = [];
    for (const code of codes) rows.push({ code, len: (answerOf(await html(page, `/currencies/${code}`)) ?? "").length });
    const longest = rows.reduce((a, b) => (b.len > a.len ? b : a)).code; // 가장 긴 문장 통화는 반드시 포함 (모든 통화를 재므로 자동 포함)
    const seen: Record<string, NonNullable<Awaited<ReturnType<typeof measureAnswer>>>> = {};
    for (const code of codes) {
      await page.goto(`/currencies/${code}`);
      await page.waitForLoadState("networkidle");
      const m = await measureAnswer(page);
      if (m) seen[code] = m;
    }
    expect(Object.keys(seen), "문장이 있는 통화가 여럿").not.toHaveLength(0);
    expect(seen[longest], `가장 긴 문장 통화 ${longest} 도 잼`).toBeDefined();
    const heights = new Set(Object.values(seen).map((m) => m.boxH));
    const dist = new Set(Object.values(seen).map((m) => m.cardFromBox));
    expect([...heights], `상자 높이가 통화마다 같음: ${JSON.stringify(seen)}`).toHaveLength(1);
    expect([...dist], "상자 맨 위에서 1년 최저 · 최고 카드까지 거리가 같음").toHaveLength(1);
    if (isWide(page)) for (const [c, m] of Object.entries(seen)) expect(m.lines, `${c} 넓은 화면은 한 줄`).toBe(1);
    if (isPhone(page)) for (const [c, m] of Object.entries(seen)) expect(m.lines, `${c} 휴대폰은 두 줄 높이`).toBe(2); // 짧은 문장도 두 줄 높이를 미리 잡음
  });

  test("통화를 바꿔도(칩 · 사이드바 · 검색) 상자 높이와 1년 최저 · 최고 카드 위치가 그대로", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/JPY");
    await page.waitForLoadState("networkidle");
    const base = await measureAnswer(page);
    expect(base, "문장 상자 있음").not.toBeNull();
    const codes = (await listCodes(page)).filter((c) => !["JPY", "USD"].includes(c));
    for (const code of ["USD", ...codes.slice(0, 3)]) {
      if (code === "USD") await tid(page, "chip").and(page.locator('[data-code="USD"]')).click();
      else {
        await openSide(page);
        await listLink(page, code).click();
      }
      await urlIs(page, code);
      await quiet(page);
      const m = await measureAnswer(page);
      if (!m) continue;
      expect(m.boxH, `${code} 상자 높이`).toBe(base!.boxH);
      expect(m.cardFromBox, `${code} 카드 위치`).toBe(base!.cardFromBox);
    }
  });
});

// ─────────────────────────────── 2) · 3) 버튼 국기
test.describe("버튼 국기는 마지막으로 고른 통화 하나 (작업 0366 · 2 · 3)", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  test("사이드바에서 두 번 · 세 번 골라도 국기는 마지막 통화 하나 · 아래 줄은 '고른 통화 · 그 통화'", async ({ page }) => {
    await page.goto("/currencies/USD");
    await quiet(page);
    expect(await flags(page), "처음 들어오면 기본 네 개").toHaveLength(4);
    const [a, b, c] = (await listCodes(page)).filter((x) => x !== "USD").slice(4, 7);
    for (const code of [a, b, c]) {
      const name = await nameOf(page, code);
      await openSide(page);
      await listLink(page, code).click();
      await urlIs(page, code);
      await quiet(page);
      expect(await flags(page), `${code} 고른 뒤 국기`).toEqual([code]);
      await expect(tid(page, "currency-more-sub")).toContainText(`고른 통화 · ${name}`);
    }
  });

  test("칩으로 바꿔도 같은 규칙 — 국기 하나 · 아래 줄 · 이어서 사이드바 · 다시 칩이어도 마지막 하나", async ({ page }) => {
    await page.goto("/currencies/USD");
    await quiet(page);
    await tid(page, "chip").and(page.locator('[data-code="THB"]')).click();
    await urlIs(page, "THB");
    await quiet(page);
    expect(await flags(page), "칩으로 THB").toEqual(["THB"]);
    await expect(tid(page, "currency-more-sub")).toContainText("고른 통화 · ");
    const x = (await listCodes(page)).find((c) => !["THB", "USD", "JPY", "EUR"].includes(c))!;
    await openSide(page);
    await listLink(page, x).click();
    await urlIs(page, x);
    await quiet(page);
    expect(await flags(page), "사이드바로 이어서").toEqual([x]);
    await tid(page, "chip").and(page.locator('[data-code="EUR"]')).click();
    await urlIs(page, "EUR");
    await quiet(page);
    expect(await flags(page), "다시 칩으로 EUR").toEqual(["EUR"]);
  });

  test("검색으로 바꿔도 같은 규칙 — '도쿄' → JPY 하나 · 이어서 '방콕' → THB 하나", async ({ page }) => {
    await page.goto("/currencies/USD");
    await quiet(page);
    const input = page.getByTestId("currency-search").getByRole("combobox");
    for (const [q, code] of [["도쿄", "JPY"], ["방콕", "THB"]] as const) {
      await expect(async () => {
        await input.fill(q);
        await expect(page.getByTestId("currency-search").getByRole("option").first()).toBeVisible({ timeout: 1000 });
      }).toPass({ timeout: 10_000 });
      await input.press("Enter");
      await urlIs(page, code);
      await quiet(page);
      expect(await flags(page), `${q} → ${code}`).toEqual([code]);
      await expect(tid(page, "currency-more-sub")).toContainText("고른 통화 · ");
    }
  });

  test("새로 고치면 기본 네 개로 돌아감(고른 값은 그 페이지 흐름 안에서만 기억)", async ({ page }) => {
    await page.goto("/currencies/USD");
    await quiet(page);
    const first = await flags(page);
    expect(first).toHaveLength(4);
    await tid(page, "chip").and(page.locator('[data-code="THB"]')).click();
    await urlIs(page, "THB");
    await quiet(page);
    expect(await flags(page)).toEqual(["THB"]);
    await page.reload();
    await quiet(page);
    expect(await flags(page), "새로 고침 뒤").toEqual(first);
    await expect(tid(page, "currency-more-sub")).toContainText("개 통화 오늘 환율을 한눈에");
  });
});

// ─────────────────────────────── 4) 열 때 · 닫을 때 국기
/** 프레임마다 날아가는 국기 복제본 · 목록 상자 · 화면 크기를 읽음 */
const record = (page: Page, ms: number) =>
  page.evaluate((span) => {
    const w = window as unknown as { __rec: unknown[] };
    w.__rec = [];
    const t0 = performance.now();
    const step = () => {
      const list = document.querySelector("[data-scroll-ok]") as HTMLElement | null;
      const lb = list?.getBoundingClientRect();
      w.__rec.push({
        t: performance.now() - t0,
        vw: innerWidth,
        vh: innerHeight,
        list: lb ? { top: lb.top, bottom: lb.bottom, left: lb.left, right: lb.right } : null,
        flies: [...document.querySelectorAll("[data-side-fly]")].map((el, i) => { const r = el.getBoundingClientRect(); return { i, left: r.left, top: r.top, right: r.right, bottom: r.bottom }; }),
      });
      if (performance.now() - t0 < span) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, ms);
type Box = { left: number; top: number; right: number; bottom: number };
type Fr = { t: number; vw: number; vh: number; list: Box | null; flies: (Box & { i: number })[] };
const frames = (page: Page) => page.evaluate(() => (window as unknown as { __rec: Fr[] }).__rec);
const inside = (b: Box, o: Box, slack = 2) => b.left >= o.left - slack && b.top >= o.top - slack && b.right <= o.right + slack && b.bottom <= o.bottom + slack;
/** 복제본 하나(i)의 마지막으로 보인 프레임 */
const lastOf = (fr: Fr[]) => {
  const out = new Map<number, { f: Fr; b: Box }>();
  for (const f of fr) for (const b of f.flies) out.set(b.i, { f, b });
  return [...out.values()];
};
/** 연 뒤 모든 목록 줄의 국기 자리가 다시 보임(opacity 0 으로 남지 않음) */
const rowFlagsShown = (page: Page) => page.evaluate(() => [...document.querySelectorAll("[data-fly-to]")].every((e) => getComputedStyle(e).opacity !== "0"));

test.describe("열 때 날아가는 국기 (작업 0366 · 4 · 넓은 화면 사이드바)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
  });

  test("목록 맨 끝 통화에서 열어도(기본 국기 줄이 목록 위로 벗어나 있음) 국기가 화면 밖 · 사이드바 밖으로 빠지지 않음 · 앉으면 목록 보이는 범위 안", async ({ page }) => {
    await page.goto("/currencies/USD");
    const last = (await listCodes(page)).at(-1)!;
    await page.goto(`/currencies/${last}`);
    await quiet(page);
    const buttonFlags = await flags(page);
    await tid(page, "currency-more").scrollIntoViewIfNeeded();
    await record(page, 2600);
    await openSide(page);
    await page.waitForTimeout(2800);
    const fr = await frames(page);
    for (const f of fr) for (const b of f.flies) expect(inside(b, { left: 0, top: 0, right: f.vw, bottom: f.vh }, 1), `t=${f.t.toFixed(0)} 화면 밖으로 나감 (${JSON.stringify(b)})`).toBe(true);
    // 날아갈 줄이 열린 뒤 목록 보이는 범위 밖이면 그 국기는 날지 않음 — 동시에 날아간 복제본 수 ≤ 보이는 범위 안에 있는 국기 줄 수
    const listNow = fr.filter((f) => f.list).at(-1)!.list!;
    let visibleRows = 0;
    for (const code of buttonFlags) {
      const r = await page.locator(`[data-fly-to="${code}"]`).evaluate((e) => { const b = e.getBoundingClientRect(); return { left: b.left, top: b.top, right: b.right, bottom: b.bottom }; });
      if (inside(r, listNow, 1)) visibleRows++;
    }
    const flown = Math.max(0, ...fr.map((f) => f.flies.length));
    expect(flown, `날아간 국기 ${flown}개 · 목록 보이는 범위 안의 국기 줄 ${visibleRows}개 (보이지 않는 줄로는 날지 않아야 함)`).toBeLessThanOrEqual(visibleRows);
    for (const { f, b } of lastOf(fr)) {
      expect(f.list, "복제본이 있을 때 목록 상자").not.toBeNull();
      expect(inside(b, f.list!, 3), `앉은 자리가 목록 보이는 범위 밖 ${JSON.stringify(b)} / ${JSON.stringify(f.list)}`).toBe(true);
    }
    expect(await rowFlagsShown(page), "목록 줄의 국기 자리가 숨겨진 채 남음").toBe(true);
    expect(await page.locator("[data-side-fly]").count(), "복제본이 남음").toBe(0);
  });

  test("고른 통화(= 지금 통화) 국기 하나는 날아가 그 줄 국기 자리에 정확히 앉음 · 목록 보이는 범위 안", async ({ page }) => {
    await page.goto("/currencies/USD");
    await quiet(page);
    const x = (await listCodes(page)).filter((c) => c !== "USD").at(-2)!; // 목록 아래쪽 통화
    await openSide(page);
    await listLink(page, x).click();
    await urlIs(page, x);
    await quiet(page);
    expect(await flags(page)).toEqual([x]);
    await tid(page, "currency-more").scrollIntoViewIfNeeded();
    await record(page, 2600);
    await openSide(page);
    await page.waitForTimeout(2800);
    const fr = await frames(page);
    const ends = lastOf(fr);
    expect(ends.length, "고른 국기 하나가 날아감").toBeGreaterThanOrEqual(1);
    const row = await page.locator(`[data-fly-to="${x}"]`).evaluate((e) => { const r = e.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; });
    const listBox = fr.filter((f) => f.list).at(-1)!.list!;
    expect(inside(row, listBox, 2), `그 줄이 목록 보이는 범위 안 (열 때 날아갈 줄을 먼저 보이게 맞춤) ${JSON.stringify(row)} / ${JSON.stringify(listBox)}`).toBe(true);
    const end = ends[0].b;
    expect(Math.abs(end.left - row.left), "앉은 자리 가로").toBeLessThanOrEqual(6);
    expect(Math.abs(end.top - row.top), "앉은 자리 세로").toBeLessThanOrEqual(6);
  });

  test("닫을 때 — 국기 줄이 목록 보이는 범위 밖이면 날지 않음 · 날면 보이는 줄에서 시작", async ({ page }) => {
    await page.goto("/currencies/USD");
    await quiet(page);
    const x = (await listCodes(page)).filter((c) => c !== "USD").at(-1)!;
    await openSide(page);
    await listLink(page, x).click();
    await urlIs(page, x);
    await quiet(page);
    await openSide(page);
    await page.waitForTimeout(1600);
    await tid(page, "currency-side-list").evaluate((el) => { el.scrollTop = 0; }); // 그 줄을 목록 보이는 범위 밖으로
    await page.waitForTimeout(200);
    await record(page, 1600);
    await page.keyboard.press("Escape");
    await expect(tid(page, "currency-sidebar")).toBeHidden({ timeout: 4000 });
    await page.waitForTimeout(600);
    const fr = await frames(page);
    for (const f of fr) for (const b of f.flies) expect(inside(b, { left: 0, top: 0, right: f.vw, bottom: f.vh }, 1), `닫을 때 화면 밖 (${JSON.stringify(b)})`).toBe(true);
    for (const f of fr) {
      if (!f.list) continue;
      for (const b of f.flies) {
        // 목록 줄에서 출발한 복제본은 처음 보인 프레임이 목록 범위 안
        const first = fr.find((g) => g.flies.some((h) => h.i === b.i))!;
        if (first === f) expect(inside(b, f.list, 3), `출발 자리가 목록 범위 밖 ${JSON.stringify(b)}`).toBe(true);
      }
    }
    expect(await rowFlagsShown(page)).toBe(true);
  });
});

test.describe("시트(좁은 화면)에서는 국기 날아가기 없음 (작업 0366 · 4)", () => {
  for (const width of [390, 900]) {
    test(`폭 ${width} — 열고 닫는 동안 날아가는 국기 복제본이 한 번도 없음 · 줄 국기는 줄과 함께 보임`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 700 ? 844 : 800 });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto("/currencies/USD");
      const last = (await listCodes(page)).at(-1)!;
      await page.goto(`/currencies/${last}`);
      await quiet(page);
      await tid(page, "currency-more").scrollIntoViewIfNeeded();
      await record(page, 2600);
      await openSide(page);
      await page.waitForTimeout(2800);
      let fr = await frames(page);
      expect(fr.flatMap((f) => f.flies).length, "열 때 복제본").toBe(0);
      expect(await rowFlagsShown(page), "줄 국기가 보임").toBe(true);
      await expect(tid(page, "currency-side-row").first()).toBeVisible();
      await record(page, 1600);
      await page.keyboard.press("Escape");
      await expect(tid(page, "currency-sidebar")).toBeHidden({ timeout: 4000 });
      await page.waitForTimeout(600);
      fr = await frames(page);
      expect(fr.flatMap((f) => f.flies).length, "닫을 때 복제본").toBe(0);
    });
  }
});

test.describe("여행 물가 나라 사이드바도 깨지지 않음 (작업 0366 · 4 · 같은 공통 부품)", () => {
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    test(`폭 ${width} — 열면 보이고 화면 안 · 떠다니는 국기 복제본 없음 · 닫으면 사라지고 남는 것 없음`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.goto("/prices");
      const links = tid(page, "price-bands").locator('[data-testid="price-band-link"]');
      await hydrated(links.first());
      await links.first().scrollIntoViewIfNeeded();
      await record(page, 2400);
      await links.first().evaluate((el) => (el as HTMLElement).click());
      const side = tid(page, "country-sidebar");
      await expect(side).toBeVisible();
      await page.waitForTimeout(2600);
      const b = await side.boundingBox();
      expect(b, "사이드바 상자").not.toBeNull();
      expect(b!.x, "왼쪽").toBeGreaterThanOrEqual(-1);
      expect(b!.y, "위").toBeGreaterThanOrEqual(-1);
      expect(b!.x + b!.width, "오른쪽").toBeLessThanOrEqual(width + 1);
      expect(b!.y + b!.height, "아래").toBeLessThanOrEqual(height + 1);
      const fr = await frames(page);
      for (const f of fr) for (const o of f.flies) expect(inside(o, { left: 0, top: 0, right: f.vw, bottom: f.vh }, 1), `복제본이 화면 밖 ${JSON.stringify(o)}`).toBe(true);
      expect(await page.locator("[data-side-fly]").count(), "복제본이 남음").toBe(0);
      await page.keyboard.press("Escape");
      await expect(side).toBeHidden({ timeout: 4000 });
      expect(await page.locator("[data-side-fly]").count(), "닫은 뒤 복제본이 남음").toBe(0);
    });
  }
});

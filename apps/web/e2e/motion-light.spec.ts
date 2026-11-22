// 작업 0281 — 움직임 방식만 가볍게 (시안 48 · 보이는 움직임은 그대로 · 기능 e2e)
//   바뀐 것: 요일 막대 · 탑승권 비행기 · 통화 범위 카드가 width · left 대신 transform 으로 움직임(같은 모습 · 같은 최종 위치) ·
//            홈 도착지 카드([data-boot])가 스크립트가 늦거나 못 받아도 몇 초 뒤 보임
//   검사: 최종 값(막대 길이 · 비행기 · 범위 카드 위치)이 값 그대로 · 움직임 줄이기에서 바로 최종 상태 · 스크립트를 못 받아도 · 끄고도 내용이 보임
//   제외: 창밖 덮개 · 물가 노선 고정 스크롤(이번 대상 아님)
//   값 의존(출발일 달력 막대 · 비행기)은 출발일 자료가 있는 빌드에서만 돎(AIRFARE_FIXTURE=1 고정 자료 빌드 · 그 밖은 건너뜀)
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
/** 등장 움직임이 끝나기를 기다림 */
async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await Promise.race([Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Number.POSITIVE_INFINITY).map((a) => a.finished.catch(() => undefined))), new Promise((res) => setTimeout(res, 3000))]);
  });
  await page.waitForTimeout(1500); // 1050ms 슬라이드 + 220ms 늦춤
}

test.describe("움직임 가볍게 (작업 0281)", () => {
  test("통화 범위 카드 — 오늘 점 · 1년 평균 눈금의 최종 위치가 값 그대로(transform 으로 움직임 · left 로 움직이지 않음)", async ({ page }) => {
    await page.goto("/currencies/USD");
    const plane = tid(page, "route-plane");
    test.skip((await plane.count()) === 0, "범위 카드 없음(자료 없음)");
    await plane.scrollIntoViewIfNeeded();
    await settle(page);
    const m = await plane.evaluate((el) => {
      const box = (el.parentElement as HTMLElement).getBoundingClientRect(), r = el.getBoundingClientRect();
      const tick = el.parentElement!.querySelector("span.bg-fg") as HTMLElement | null;
      const tr = tick?.getBoundingClientRect();
      return { pos: Number(el.getAttribute("data-position")), cx: (r.left + r.width / 2 - box.left) / box.width, tickCx: tr ? (tr.left + tr.width / 2 - box.left) / box.width : null, left: getComputedStyle(el).left };
    });
    expect(Math.abs(m.cx - m.pos), `오늘 점 위치(상자 폭의 비율) ${m.cx.toFixed(3)} · 값 ${m.pos.toFixed(3)}`).toBeLessThanOrEqual(0.01);
    if (m.tickCx !== null) { expect(m.tickCx, "평균 눈금이 칸 안").toBeGreaterThanOrEqual(0); expect(m.tickCx).toBeLessThanOrEqual(1); }
    // 위치는 left 가 아니라 transform 으로 정해짐: left 는 0 에 고정(처음 들어올 때만 transform 전환이 붙고, 그 밖에는 전환 없이 바로 자리 잡으므로 전환 속성은 보지 않음)
    expect(m.left, "left 는 0 에 고정").toBe("0px");
  });

  test("움직임 줄이기 — 통화 범위 카드는 움직임 없이 바로 최종 위치", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/USD");
    const plane = tid(page, "route-plane");
    test.skip((await plane.count()) === 0, "범위 카드 없음(자료 없음)");
    await plane.scrollIntoViewIfNeeded();
    await page.waitForLoadState("networkidle");
    // 움직임을 기다리지 않고 바로(0.5초 안) 최종 위치
    await expect
      .poll(() => plane.evaluate((el) => { const box = (el.parentElement as HTMLElement).getBoundingClientRect(), r = el.getBoundingClientRect(); return Math.abs((r.left + r.width / 2 - box.left) / box.width - Number(el.getAttribute("data-position"))); }), { timeout: 500, intervals: [50] })
      .toBeLessThanOrEqual(0.01);
    // 움직임 줄이기: 전환 시간이 0(또는 0.0001초 이하로 줄임)
    const secs = await plane.evaluate((el) => getComputedStyle(el).transitionDuration.split(",").map((x) => parseFloat(x)));
    for (const d of secs) expect(d, "전환 시간(초)").toBeLessThanOrEqual(0.001);
  });

  test("출발일 달력 — 요일 막대 보이는 길이 = 값(transform 최종 위치) · 탑승권 비행기는 도착해 오른쪽 끝", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/flights");
    test.skip((await tid(page, "airfare-chip").count()) === 0, "출발일 자료 없는 빌드(고정 자료 빌드에서만 돎)");
    await tid(page, "airfare-week-row").first().scrollIntoViewIfNeeded();
    await settle(page);
    const bars = await tid(page, "airfare-week-fill").evaluateAll((els) =>
      els.map((f) => {
        const r = f.getBoundingClientRect(), t = (f.parentElement as HTMLElement).getBoundingClientRect();
        const percent = (Number(/translateX\(([-\d.]+)%\)/.exec((f as HTMLElement).style.transform)?.[1] ?? "NaN") + 100) / 100;
        return { visible: Math.max(0, Math.min(r.right, t.right) - Math.max(r.left, t.left)) / t.width, percent, prop: getComputedStyle(f).transitionProperty, w: r.width / t.width };
      }),
    );
    expect(bars.length).toBe(7);
    for (const b of bars) {
      expect(Math.abs(b.visible - b.percent), `보이는 길이 ${b.visible.toFixed(3)} · 값 ${b.percent.toFixed(3)}`).toBeLessThanOrEqual(0.01);
      expect(b.prop, "막대는 transform 으로 자람").toContain("transform");
      expect(b.prop).not.toMatch(/\bwidth\b/);
    }
    expect(Math.max(...bars.map((b) => b.visible)), "가장 긴 막대가 칸을 채움").toBeGreaterThan(0.9);
    expect(new Set(bars.map((b) => Math.round(b.visible * 100))).size, "막대 길이가 서로 다름").toBeGreaterThan(1);
    // 비행기: 도착(data-flown) 뒤 길(.fly)의 오른쪽 끝에 닿음
    await tid(page, "airfare-pass").scrollIntoViewIfNeeded();
    await expect.poll(() => page.evaluate(() => { const f = document.querySelector(".af-pass .fly") as HTMLElement, s = f?.querySelector("svg") as SVGElement | null; return f && s ? Math.round(f.getBoundingClientRect().right - s.getBoundingClientRect().right) : -99; }), { timeout: 5000 }).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector(".af-pass .fly svg") as Element).transitionProperty), "비행기는 transform 으로 움직임").toContain("transform");
  });

  test("스크립트를 받지 못해도(자바스크립트는 켜짐) 홈 도착지 카드가 몇 초 뒤 보임 — 숨은 채 남지 않음", async ({ page }) => {
    await page.route(/\/_next\/static\/.*\.js/, (r) => r.abort());
    await page.addInitScript(() => localStorage.setItem("flapfx:intro-off", "1"));
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const list = tid(page, "dest-list");
    test.skip((await list.count()) === 0, "도착지 카드 없음(자료 없음)");
    // 6.5초 안에 펼친 최종 카드: 줄이 보이고(불투명) · 목록 높이가 줄 수만큼
    await expect.poll(() => tid(page, "dest-row").first().evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 8000, message: "도착지 줄이 보임" }).toBeGreaterThan(0.99);
    const h = await list.evaluate((el) => el.getBoundingClientRect().height);
    expect(h, "목록이 줄 수만큼 펼쳐짐").toBeGreaterThan(200);
  });

  test("JavaScript 를 끄고도 — 홈 도착지 카드 · 통화 상세 숫자가 최종 값으로 보임", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto("/");
    if ((await tid(page, "dest-list").count()) > 0) {
      await expect(tid(page, "dest-row").first()).toBeVisible();
      expect(await tid(page, "dest-row").first().evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(0.99);
    }
    await page.goto("/currencies/USD");
    const counts = tid(page, "count-up");
    test.skip((await counts.count()) === 0, "카운트 숫자 없음");
    const pairs = await counts.evaluateAll((els) => els.slice(0, 4).map((e) => ({ text: (e.textContent ?? "").trim(), final: (e.getAttribute("data-final") ?? "").trim() })));
    for (const p of pairs) expect(p.text, "숫자가 올라가는 도중이 아니라 최종 값").toBe(p.final);
    await ctx.close();
  });
});

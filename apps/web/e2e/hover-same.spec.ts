// 작업 0293 — 마우스를 올렸을 때 변화를 같게 (사용자가 정한 조건: 시안 62번 "고친 모습대로") · 기준은 홈 도시 칩(올리면 바탕 옅은 회색)
//   새 색 없이 토큰만: 바탕 옅은 회색 = surface-2 · 테두리 파랑 = cheap · 흰 화살표 = foam
//   1 여행 타이밍 도시 칩(고르지 않은 것): 바탕 옅은 회색 + 테두리 파랑 · 2 달력 ‹ ›(쓸 수 있을 때): 파랑 바탕 + 흰 화살표 · 3 날짜 칸(고르지 않은 것): 바탕 옅은 회색
//   4 창밖 달 버튼(고르지 않은 것): 바탕 옅은 회색 · 5 여행 물가 나라 단추(고르지 않은 것): 바탕 옅은 회색 + 테두리 파랑
//   6 창밖 "다시 보기": 테두리 파랑 · 바닥 띠 "소개 · 판단 기준": 색 한 단계 진하게(밑줄은 그대로) · 여행 물가 "통화 상세": 올리면 밑줄 · 통화 칩 더 보기 상자 앞뒤 단추: 테두리 파랑 + 바탕 옅은 회색
//   고른 것(고른 칩 · 고른 날 · 지금 달 · 지금 정거장)은 올려도 변화 없음 · 손가락으로 누르는 기기(hover:none · 휴대폰 프로젝트)에서는 올려도 아무것도 변하지 않음(올림 상태가 남지 않음)
//   달력 · 창밖 달 · 다시 보기는 자료(고정 자료 빌드 · AIRFARE_FIXTURE=1)가 있을 때만 있음 — 없으면 건너뜀 · 두 프로젝트에서 돌며 폭은 바꾸지 않음(프로젝트의 기기 설정이 hover 여부를 정함)
import { type Locator, type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);

/** 토큰이 풀린 실제 색 — 임시 칸에 var(--토큰) 을 칠해 브라우저가 계산한 값을 읽음 */
async function tokens(page: Page) {
  return page.evaluate(() => {
    const read = (prop: "backgroundColor" | "color", token: string) => {
      const d = document.createElement("div");
      if (prop === "color") d.style.color = `var(${token})`;
      else d.style.backgroundColor = `var(${token})`;
      document.body.appendChild(d);
      const v = getComputedStyle(d)[prop];
      d.remove();
      return v;
    };
    return { surface2: read("backgroundColor", "--hav-surface-2"), cheap: read("color", "--hav-cheap"), foam: read("color", "--hav-foam"), fg: read("color", "--hav-fg"), fg2: read("color", "--hav-fg-2"), cheapBg: read("backgroundColor", "--hav-cheap") };
  });
}
const canHover = (page: Page) => page.evaluate(() => matchMedia("(hover: hover)").matches);

type Look = { bg: string; border: string; color: string; deco: string };
const look = (el: Locator): Promise<Look> =>
  el.evaluate((e) => {
    const cs = getComputedStyle(e);
    return { bg: cs.backgroundColor, border: cs.borderTopColor, color: cs.color, deco: cs.textDecorationLine };
  });
/** 마우스를 치운 모습 → 올린 모습(전환이 끝난 뒤) */
async function hoverPair(page: Page, el: Locator): Promise<{ off: Look; on: Look }> {
  await el.scrollIntoViewIfNeeded();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(350);
  const off = await look(el);
  await el.hover();
  await page.waitForTimeout(450);
  const on = await look(el);
  await page.mouse.move(2, 2);
  return { off, on };
}

async function openFlights(page: Page) {
  await page.goto("/flights");
  await page.waitForLoadState("networkidle");
}
const hasAirfare = async (page: Page) => (await tid(page, "airfare-chip").count()) > 0;

test.describe("마우스 올렸을 때 변화 같게 (작업 0293)", () => {
  test("여행 타이밍 도시 칩 — 고르지 않은 칩: 올리면 바탕 옅은 회색 + 테두리 파랑 · 고른 칩: 변화 없음", async ({ page }) => {
    await openFlights(page);
    test.skip(!(await hasAirfare(page)), "출발일 달력 자료 없음(고정 자료 빌드에서만)");
    const t = await tokens(page);
    const hover = await canHover(page);
    const other = page.locator('[data-testid="airfare-chip"][aria-pressed="false"]').first();
    const picked = page.locator('[data-testid="airfare-chip"][aria-pressed="true"]').first();
    const o = await hoverPair(page, other);
    if (hover) { expect(o.on.bg, "올린 칩 바탕").toBe(t.surface2); expect(o.on.border, "올린 칩 테두리").toBe(t.cheap); expect(o.on, "올림 전과 달라짐").not.toEqual(o.off); }
    else expect(o.on, "손가락 기기는 올림 변화 없음").toEqual(o.off);
    const p = await hoverPair(page, picked);
    expect(p.on, "고른 칩은 올려도 변화 없음").toEqual(p.off);
  });

  test("달력 ‹ › — 쓸 수 있는 단추: 올리면 파랑 바탕 + 흰 화살표 · 꺼진 단추: 변화 없음", async ({ page }) => {
    await openFlights(page);
    test.skip(!(await hasAirfare(page)), "출발일 달력 자료 없음(고정 자료 빌드에서만)");
    const t = await tokens(page);
    const hover = await canHover(page);
    const next = tid(page, "airfare-next");
    if (await next.isEnabled()) {
      const n = await hoverPair(page, next);
      if (hover) { expect(n.on.bg, "올린 단추 바탕").toBe(t.cheapBg); expect(n.on.color, "화살표").toBe(t.foam); }
      else expect(n.on, "손가락 기기는 올림 변화 없음").toEqual(n.off);
    }
    const prev = tid(page, "airfare-prev");
    if (await prev.isDisabled()) {
      await prev.scrollIntoViewIfNeeded();
      const before = await look(prev);
      await prev.hover({ force: true });
      await page.waitForTimeout(450);
      expect(await look(prev), "꺼진 단추는 올려도 변화 없음").toEqual(before);
    }
  });

  test("날짜 칸 — 고르지 않은 칸: 올리면 바탕 옅은 회색 · 고른 날: 변화 없음", async ({ page }) => {
    await openFlights(page);
    test.skip(!(await hasAirfare(page)), "출발일 달력 자료 없음(고정 자료 빌드에서만)");
    const t = await tokens(page);
    const hover = await canHover(page);
    const day = page.locator('[data-testid="airfare-day"][aria-pressed="false"]').nth(3);
    const d = await hoverPair(page, day);
    if (hover) { expect(d.on.bg, "올린 날짜 칸 바탕").toBe(t.surface2); expect(d.off.bg, "올리기 전").not.toBe(t.surface2); }
    else expect(d.on, "손가락 기기는 올림 변화 없음").toEqual(d.off);
    const picked = page.locator('[data-testid="airfare-day"][aria-pressed="true"]').first();
    const p = await hoverPair(page, picked);
    expect(p.on, "고른 날은 올려도 변화 없음").toEqual(p.off);
  });

  test("창밖 달 버튼 — 고르지 않은 달: 올리면 바탕 옅은 회색 · 지금 달: 변화 없음 · 다시 보기: 테두리 파랑", async ({ page }) => {
    await openFlights(page);
    test.skip((await tid(page, "window-month").count()) === 0, "창밖 12달 자료 없음");
    const t = await tokens(page);
    const hover = await canHover(page);
    const other = page.locator('[data-testid="window-month"][aria-pressed="false"]').first();
    const o = await hoverPair(page, other);
    if (hover) expect(o.on.bg, "올린 달 바탕").toBe(t.surface2);
    else expect(o.on, "손가락 기기는 올림 변화 없음").toEqual(o.off);
    const cur = page.locator('[data-testid="window-month"][aria-pressed="true"]').first();
    const c = await hoverPair(page, cur);
    expect(c.on, "지금 달은 올려도 변화 없음").toEqual(c.off);
    const replay = tid(page, "window-replay");
    if (await replay.count()) {
      const r = await hoverPair(page, replay);
      if (hover) { expect(r.on.border, "다시 보기 테두리").toBe(t.cheap); expect(r.on.bg, "다시 보기 바탕").toBe(t.surface2); }
      else expect(r.on, "손가락 기기는 올림 변화 없음").toEqual(r.off);
    }
  });

  test("여행 물가 나라 단추 — 고르지 않은 단추: 올리면 바탕 옅은 회색 + 테두리 파랑 · 지금 정거장: 변화 없음 · 통화 상세 링크: 올리면 밑줄", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/prices");
    await page.waitForLoadState("networkidle");
    test.skip((await tid(page, "route-stop").count()) === 0, "물가 자료 없음");
    const t = await tokens(page);
    const hover = await canHover(page);
    const other = page.locator('[data-testid="route-stop"][data-active="false"]').first();
    const o = await hoverPair(page, other);
    if (hover) { expect(o.on.bg, "올린 단추 바탕").toBe(t.surface2); expect(o.on.border, "올린 단추 테두리").toBe(t.cheap); }
    else expect(o.on, "손가락 기기는 올림 변화 없음").toEqual(o.off);
    const active = page.locator('[data-testid="route-stop"][data-active="true"]').first();
    const a = await hoverPair(page, active);
    expect(a.on, "지금 정거장은 올려도 변화 없음").toEqual(a.off);
    // 통화 상세 링크(밑줄은 안쪽 글자 칸에): 올리면 밑줄
    const link = page.locator('[data-testid="price-bands"] a[aria-label$="통화 상세"]').first();
    if (await link.count()) {
      await link.scrollIntoViewIfNeeded();
      // 목록이 나타나는 움직임(위로 떠오름)이 끝난 뒤에 올려야 올린 자리가 어긋나지 않음
      await page.evaluate(async () => { await Promise.race([Promise.all(document.getAnimations().filter((x) => x.effect && x.effect.getComputedTiming().iterations !== Number.POSITIVE_INFINITY).map((x) => x.finished.catch(() => undefined))), new Promise((res) => setTimeout(res, 3000))]); });
      const span = link.locator("span").first();
      await page.mouse.move(2, 2);
      const off = await span.evaluate((e) => getComputedStyle(e).textDecorationLine);
      // 스크롤이 자리를 잡는 동안 마우스가 링크 밖으로 밀릴 수 있어, 올린 채로 다시 올려 가며 올림 모습이 나오는지 기다림
      let on = "";
      await expect
        .poll(async () => { await link.hover(); await page.waitForTimeout(150); on = await span.evaluate((e) => getComputedStyle(e).textDecorationLine); return hover ? on : "none"; }, { timeout: 4000, message: "올리면 밑줄" })
        .toContain(hover ? "underline" : "none");
      if (hover) { expect(off, "올리기 전 밑줄 없음").not.toContain("underline"); expect(on, "올리면 밑줄").toContain("underline"); }
      else expect(on, "손가락 기기는 올림 변화 없음").toBe(off);
    }
  });

  test("바닥 띠 '소개 · 판단 기준' — 올리면 색이 한 단계 진해짐(fg-2 → fg) · 밑줄은 그대로 · 손가락 기기는 변화 없음", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/prices");
    await page.waitForLoadState("networkidle");
    const t = await tokens(page);
    const hover = await canHover(page);
    const link = page.locator("footer a", { hasText: "소개 · 판단 기준" }).first();
    await expect(link).toHaveCount(1);
    const l = await hoverPair(page, link);
    expect(l.off.color, "올리기 전").toBe(t.fg2);
    expect(l.on.deco, "밑줄은 그대로").toContain("underline");
    if (hover) expect(l.on.color, "올린 색").toBe(t.fg);
    else expect(l.on.color, "손가락 기기는 색이 안 바뀜").toBe(t.fg2);
  });

  test("통화 칩 더 보기 상자 앞뒤 단추 — 쓸 수 있는 단추: 올리면 테두리 파랑 + 바탕 옅은 회색 · 꺼진 단추: 변화 없음", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    // 고른 통화가 일곱 개(다섯 + 둘)일 때만 '더보기 +2' 상자가 생김 — currency-chips.spec 과 같은 저장값을 미리 넣음
    await page.addInitScript(([k, v]) => { try { window.localStorage.setItem(k as string, v as string); } catch {} }, ["flapfx:recent-currencies", JSON.stringify(["GBP", "SGD", "AUD", "MYR", "CNH", "JPY", "USD"])]);
    await page.goto("/currencies/GBP");
    await page.waitForLoadState("networkidle");
    const more = tid(page, "chip-more");
    test.skip((await more.count()) === 0, "통화 칩 더 보기 없음");
    await more.click();
    const next = tid(page, "chip-box-next");
    await expect(next).toBeVisible();
    const t = await tokens(page);
    const hover = await canHover(page);
    test.skip(await next.isDisabled(), "상자가 한 쪽뿐");
    const n = await hoverPair(page, next);
    if (hover) { expect(n.on.border, "올린 단추 테두리").toBe(t.cheap); expect(n.on.bg, "올린 단추 바탕").toBe(t.surface2); }
    else expect(n.on, "손가락 기기는 올림 변화 없음").toEqual(n.off);
    const prev = tid(page, "chip-box-prev");
    if (await prev.isDisabled()) {
      const before = await look(prev);
      await prev.hover({ force: true });
      await page.waitForTimeout(450);
      expect(await look(prev), "꺼진 단추는 올려도 변화 없음").toEqual(before);
    }
  });
});

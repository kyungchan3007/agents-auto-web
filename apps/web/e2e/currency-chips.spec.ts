// 작업 0231 — 고른 통화 칩 (한 줄 5개 · 더보기 +N · 떠 있는 상자 · 쪽 넘김 · 밀림 · 저장) e2e · 테스트 먼저
//   사용자 원문: "칩들은 내가 선택한 나라들을 칩으로 추가를 하자 최대 5개를 보여주고 5개가 넘어가면 더보기가 생겨서 더보기 선택하면 모션이 생기면서 찍었던 모든 칩을 다 보여주는거야 그러니까 하나씩 밀려나가는거지 … 박스안에는 최대 5개 까지 보여주고 만약 5개 이상이면 페이지 네이션으로"
//   DOM 계약
//     칩 줄 [data-testid="currency-chips"] nav · 칩마다 [data-testid="chip"][data-code="JPY"](기존 링크 · aria-label "엔화 JPY" · aria-current) · 줄에는 5개까지 · 밀려 나가는 칩은 data-leaving="true" 로 잠깐(≈0.4초) 남아 오른쪽으로 빠지며 사라짐
//     더보기 [data-testid="chip-more"] 버튼 "더보기 +N"(5개를 넘을 때만 · aria-expanded · 누르면 상자가 펼쳐지고 다시 누르면 닫힘)
//     상자 [data-testid="chip-box"] — 칩 줄 아래에 떠 있음(position absolute · 옆 검색칸 · 아래 내용 자리를 밀지 않음) · 안에 고른 통화 모두: [data-testid="chip-box-item"][data-code] 한 쪽 5개 · 넘으면 [data-testid="chip-box-prev"] [data-testid="chip-box-page"]("1 / 2") [data-testid="chip-box-next"] (옆으로 미끄러지며 넘김 · 첫 쪽의 이전 · 끝 쪽의 다음은 disabled)
//       상자에서 고르면 상자가 닫히고 그 통화로 전환(주소 · 칩 맨 앞) · Esc · 바깥 누르기로도 닫힘
//     저장: localStorage "flapfx:recent-currencies"(JSON 배열 · 맨 앞이 가장 최근) — 다음 방문에도 같은 칩 줄 · 저장이 없으면 지금 운영 그대로(JPY · USD · EUR · THB + 지금 통화가 넷 밖이면 맨 앞)
//     움직임 줄이기면 밀림 · 빠짐 · 상자 펼침 모두 움직임 없이 바로 최종
//   첫 그림 깜빡임 고침(lead 결정): 저장이 있는 사람만 — 문서 앞쪽 아주 작은 인라인 스크립트가 localStorage "flapfx:recent-currencies" 가 있으면 <html data-recent-chips> 를 달고 → CSS 가 그 표시가 있고 아직 하이드레이션 전이면 칩 줄을 visibility hidden → 저장 순서로 그린 뒤 해제(밀림 모션 없이 나타남) · 저장이 없으면(처음 방문) 숨김 없이 첫 프레임부터 기본 칩 · JS 꺼짐은 기본 칩 · 저장이 깨져 있어도 영영 숨지 않음
//   목록의 통화는 아래 둘러보기 목록 [data-testid="currency-list"] 의 링크로 고름 (받은 통화가 달라도 되게 목록에서 읽음)
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const KEY = "flapfx:recent-currencies";
const DEFAULT4 = ["JPY", "USD", "EUR", "THB"];

/** 칩 줄에 보이는 칩(밀려 나가는 중인 것 제외)을 왼쪽부터 */
const rowCodes = (page: Page) =>
  tid(page, "chip").evaluateAll((els) => els.filter((e) => e.getAttribute("data-leaving") !== "true").map((e) => ({ c: e.getAttribute("data-code") ?? "", x: e.getBoundingClientRect().x })).sort((a, b) => a.x - b.x).map((o) => o.c));
const stored = (page: Page) => page.evaluate((k) => JSON.parse(window.localStorage.getItem(k) ?? "[]") as string[], KEY);
/** 목록에서 기본 네 통화가 아닌 통화 코드 n개 */
const others = async (page: Page, n: number) => {
  const all = await tid(page, "currency-list").locator("a[href^='/currencies/']").evaluateAll((els) => els.map((e) => (e.getAttribute("href") ?? "").split("/").pop() ?? ""));
  return all.filter((c) => !DEFAULT4.includes(c)).slice(0, n);
};
const pickFromList = (page: Page, code: string) => tid(page, "currency-list").locator(`a[href="/currencies/${code}"]`).click();
const seed = (page: Page, list: string[]) => page.addInitScript(([k, v]) => { try { window.localStorage.setItem(k as string, v as string); } catch {} }, [KEY, JSON.stringify(list)]);
/** 목록에 이 통화들이 모두 있는지(자료 조건 · 구현 유무와 상관없음) */
const hasAll = async (page: Page, codes: string[]) => {
  const all = await tid(page, "currency-list").locator("a[href^='/currencies/']").evaluateAll((els) => els.map((e) => (e.getAttribute("href") ?? "").split("/").pop() ?? ""));
  return codes.every((c) => all.includes(c));
};
const urlIs = (page: Page, code: string) => expect(page).toHaveURL(new RegExp(`/currencies/${code}/?$`), { timeout: 8000 });

test.describe("고른 통화 칩 (작업 0231)", () => {
  test("처음 칩 줄은 지금 운영 그대로 — JPY · USD · EUR · THB (저장 없음) · 더보기 없음 · 칩마다 data-code · 지금 통화 aria-current", async ({ page }) => {
    await page.goto("/currencies/JPY");
    const row = await rowCodes(page);
    const avail = await tid(page, "currency-list").locator("a[href^='/currencies/']").evaluateAll((els) => els.map((e) => (e.getAttribute("href") ?? "").split("/").pop()));
    expect(row).toEqual(DEFAULT4.filter((c) => avail.includes(c)));
    await expect(tid(page, "chip-more")).toHaveCount(0);
    await expect(tid(page, "chip").first()).toHaveAttribute("aria-current", "page");
    expect(await tid(page, "currency-chips").locator('a[aria-current="page"]').getAttribute("data-code")).toBe("JPY");
    expect(await stored(page)).toEqual([]); // 보기만 해서는 저장하지 않음
  });

  test("고르면 맨 앞에 붙고 한 칸씩 밀림 · 5개까지 · 6번째부터 '더보기 +N' · 이미 있는 통화는 맨 앞으로 · 저장 순서 (움직임 줄이기로 결과만)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/JPY");
    const [a, b, c] = await others(page, 3);
    test.skip(!c, "목록에 통화가 모자람");
    await pickFromList(page, a);
    await urlIs(page, a);
    expect(await rowCodes(page)).toEqual([a, "JPY", "USD", "EUR", "THB"]);
    await expect(tid(page, "chip-more")).toHaveCount(0);
    await pickFromList(page, b);
    await urlIs(page, b);
    expect(await rowCodes(page)).toEqual([b, a, "JPY", "USD", "EUR"]);
    await expect(tid(page, "chip-more")).toHaveText("더보기 +1");
    await tid(page, "chip").and(page.locator('[data-code="EUR"]')).click(); // 이미 있는 통화는 맨 앞으로
    await urlIs(page, "EUR");
    expect(await rowCodes(page)).toEqual(["EUR", b, a, "JPY", "USD"]);
    await expect(tid(page, "chip-more")).toHaveText("더보기 +1");
    await pickFromList(page, c);
    await urlIs(page, c);
    expect(await rowCodes(page)).toEqual([c, "EUR", b, a, "JPY"]);
    await expect(tid(page, "chip-more")).toHaveText("더보기 +2");
    expect(await stored(page)).toEqual([c, "EUR", b, a, "JPY", "USD", "THB"]);
    await expect(tid(page, "chip").first()).toHaveAttribute("aria-current", "page");
  });

  test("더보기 상자 — 떠 있음(옆 검색칸 · 아래 내용 안 밀림) · 고른 칩 모두 한 쪽 5개 · ‹ 1 / 2 › 쪽 넘김 · 고르면 닫히고 전환 · Esc · 바깥 누르기", async ({ page }) => {
    const list = ["GBP", "SGD", "AUD", "MYR", "CNH", "JPY", "USD"]; // 7개 → 두 쪽(5 + 2)
    await seed(page, list);
    await page.goto("/currencies/GBP");
    await page.waitForTimeout(500);
    test.skip(!(await hasAll(page, list)), "받은 통화가 모자람"); // 자료 조건만 (칩이 없어서 건너뛰지 않음)
    const more = tid(page, "chip-more");
    const n = list.length - 5;
    await expect(more).toHaveText(`더보기 +${n}`);
    await expect(more).toHaveAttribute("aria-expanded", "false");
    const rects = async () => ({ search: await tid(page, "currency-search").boundingBox(), detail: await tid(page, "currency-detail").boundingBox(), chips: await tid(page, "currency-chips").boundingBox() });
    const before = await rects();
    await more.click();
    const box = tid(page, "chip-box");
    await expect(box).toBeVisible();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    expect(await box.evaluate((e) => getComputedStyle(e).position), "상자는 떠 있음").toBe("absolute");
    const after = await rects();
    expect(after.search, "검색칸이 밀림").toEqual(before.search);
    expect(after.detail, "아래 내용이 밀림").toEqual(before.detail);
    const bb = (await box.boundingBox())!;
    expect(bb.y, "상자가 칩 줄 아래").toBeGreaterThanOrEqual(before.chips!.y + before.chips!.height - 2);
    const vw = page.viewportSize()!.width;
    expect(bb.x, "상자 왼쪽이 화면 안").toBeGreaterThanOrEqual(-1);
    expect(bb.x + bb.width, "상자 오른쪽이 화면 안").toBeLessThanOrEqual(vw + 1);
    const items = () => tid(page, "chip-box-item").evaluateAll((els) => els.map((e) => e.getAttribute("data-code")));
    await expect.poll(items, { timeout: 2000 }).toEqual(list.slice(0, 5));
    await expect(tid(page, "chip-box-page")).toHaveText("1 / 2");
    await expect(tid(page, "chip-box-prev")).toBeDisabled();
    await tid(page, "chip-box-next").click();
    await expect.poll(items, { timeout: 3000 }).toEqual(list.slice(5));
    await expect(tid(page, "chip-box-page")).toHaveText("2 / 2");
    await expect(tid(page, "chip-box-next")).toBeDisabled();
    await tid(page, "chip-box-prev").click();
    await expect.poll(items, { timeout: 3000 }).toEqual(list.slice(0, 5));
    // Esc 로 닫힘 · 다시 열고 바깥 누르기로 닫힘
    await page.keyboard.press("Escape");
    await expect(box).toHaveCount(0);
    await more.click();
    await expect(box).toBeVisible();
    await page.mouse.click(5, (page.viewportSize()?.height ?? 800) - 5);
    await expect(box).toHaveCount(0);
    // 상자에서 고르면 닫히고 전환 — 가려져 있던 마지막 쪽 통화(USD)를 고름
    await more.click();
    await tid(page, "chip-box-next").click();
    await expect.poll(items, { timeout: 3000 }).toEqual(list.slice(5));
    await tid(page, "chip-box-item").and(page.locator('[data-code="USD"]')).click();
    await expect(box).toHaveCount(0);
    await urlIs(page, "USD");
    await expect.poll(async () => (await rowCodes(page))[0], { message: "고른 칩이 맨 앞", timeout: 4000 }).toBe("USD"); // 이동 직후 칩이 아직 미끄러지는 중일 수 있어 잠깐 기다림
    expect((await stored(page))[0]).toBe("USD");
  });

  test("다음 방문에도 같은 칩 줄(새로 고침) · 같은 브라우저의 다른 탭도 바로 반영(움직임 없이)", async ({ page, context }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/JPY");
    const [a, b] = await others(page, 2);
    test.skip(!b, "목록에 통화가 모자람");
    const other = await context.newPage();
    await other.emulateMedia({ reducedMotion: "reduce" });
    await other.goto("/currencies/JPY");
    await pickFromList(page, a);
    await urlIs(page, a);
    await pickFromList(page, b);
    await urlIs(page, b);
    const want = [b, a, "JPY", "USD", "EUR"];
    expect(await rowCodes(page)).toEqual(want);
    await expect.poll(() => rowCodes(other), { timeout: 4000 }).toEqual(want); // 다른 탭
    await page.reload();
    await page.waitForTimeout(500);
    expect(await rowCodes(page), "새로 고침 뒤 같은 칩 줄").toEqual(want);
    await expect(tid(page, "chip-more")).toHaveText("더보기 +1");
  });

  test("밀림 모션 — 새 칩이 맨 앞에 붙고 나머지가 옛 자리에서 한 칸씩 미끄러지고 · 맨 끝 칩이 오른쪽으로 빠지며 사라짐 · 더보기 +1 이 나타남", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await seed(page, ["JPY", "USD", "EUR", "THB", "GBP"]); // 이미 5개
    await page.goto("/currencies/JPY");
    await page.waitForTimeout(500);
    const [x] = (await others(page, 6)).filter((c) => !["GBP"].includes(c));
    test.skip(!x, "목록에 통화가 모자람");
    const old = await tid(page, "chip").evaluateAll((els) => Object.fromEntries(els.map((e) => [e.getAttribute("data-code"), e.getBoundingClientRect().x])));
    await page.evaluate(() => {
      const w = window as unknown as { __cf: unknown[]; __stopC: boolean };
      w.__cf = []; w.__stopC = false; const t0 = performance.now();
      const tick = () => {
        const m: Record<string, { x: number; op: number; leaving: boolean }> = {};
        document.querySelectorAll('[data-testid="chip"]').forEach((e) => { let o = 1; for (let n: Element | null = e; n && n !== document.body; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity); m[e.getAttribute("data-code") ?? ""] = { x: e.getBoundingClientRect().x, op: o, leaving: e.getAttribute("data-leaving") === "true" }; });
        w.__cf.push({ t: performance.now() - t0, m, more: !!document.querySelector('[data-testid="chip-more"]') });
        if (!w.__stopC) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await pickFromList(page, x);
    await page.waitForTimeout(2800);
    const fr = (await page.evaluate(() => { const w = window as unknown as { __cf: unknown[]; __stopC: boolean }; w.__stopC = true; return w.__cf; })) as { t: number; m: Record<string, { x: number; op: number; leaving: boolean }>; more: boolean }[];
    const end = fr[fr.length - 1].m;
    // 새 칩은 맨 앞(가장 왼쪽)
    const endRow = Object.entries(end).filter(([, v]) => !v.leaving).sort((a, b) => a[1].x - b[1].x).map(([c]) => c);
    expect(endRow, "끝 모양").toEqual([x, "JPY", "USD", "EUR", "THB"]);
    // 남은 칩(JPY)은 옛 자리 → 새 자리로 미끄러짐: 중간 값을 지나고 · 거꾸로 가지 않음
    const jpy = fr.map((f) => f.m.JPY?.x).filter((v): v is number => v !== undefined);
    const moved = jpy.filter((v) => v > old.JPY + 2 && v < end.JPY.x - 2);
    expect(end.JPY.x, "JPY 가 오른쪽으로 한 칸 밀림").toBeGreaterThan(old.JPY + 20);
    expect(moved.length, "JPY 가 중간 자리를 지남(미끄러짐 프레임 수)").toBeGreaterThanOrEqual(3);
    for (let i = 1; i < jpy.length; i++) expect(jpy[i], "칩이 거꾸로 움직임").toBeGreaterThanOrEqual(jpy[i - 1] - 1.5);
    // 맨 끝 칩(GBP)은 data-leaving 으로 남아 오른쪽으로 빠지며 사라짐
    const gbp = fr.filter((f) => f.m.GBP);
    const leaving = gbp.filter((f) => f.m.GBP.leaving);
    expect(leaving.length, "GBP 가 빠지는 프레임 수").toBeGreaterThanOrEqual(3);
    expect(Math.max(...leaving.map((f) => f.m.GBP.x)), "오른쪽으로 빠짐").toBeGreaterThan(old.GBP + 10);
    expect(Math.min(...leaving.map((f) => f.m.GBP.op)), "흐려짐").toBeLessThan(0.7);
    expect(end.GBP, "끝에 GBP 는 줄에서 없음").toBeUndefined();
    // 더보기 +1 이 나타남
    expect(fr[0].more).toBe(false);
    await expect(tid(page, "chip-more")).toHaveText("더보기 +1");
  });

  test("움직임 줄이기 — 밀려 나가는 칩이 남지 않고(data-leaving 없음) 칩 자리가 바로 최종", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await seed(page, ["JPY", "USD", "EUR", "THB", "GBP"]);
    await page.goto("/currencies/JPY");
    const [x] = (await others(page, 6)).filter((c) => c !== "GBP");
    test.skip(!x, "목록에 통화가 모자람");
    await page.evaluate(() => { const w = window as unknown as { __leave: number; __stopL: boolean }; w.__leave = 0; w.__stopL = false; const tick = () => { w.__leave += document.querySelectorAll('[data-testid="chip"][data-leaving="true"]').length; if (!w.__stopL) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    await pickFromList(page, x);
    await urlIs(page, x);
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => { const w = window as unknown as { __leave: number; __stopL: boolean }; w.__stopL = true; return w.__leave; }), "빠지는 칩 프레임").toBe(0);
    expect(await rowCodes(page)).toEqual([x, "JPY", "USD", "EUR", "THB"]);
  });

  test("가로 넘침 0 · 콘솔 오류 없음 — 칩 줄 · 상자 (1280 · 390)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await seed(page, ["GBP", "SGD", "AUD", "MYR", "CNH", "JPY", "USD"]);
    await page.goto("/currencies/GBP");
    await page.waitForTimeout(500);
    test.skip(!(await hasAll(page, ["GBP", "SGD", "AUD", "MYR", "CNH", "JPY", "USD"])), "받은 통화가 모자람");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), "닫힌 채 가로 넘침").toBeLessThanOrEqual(1);
    await tid(page, "chip-more").click();
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), "상자가 열린 채 가로 넘침").toBeLessThanOrEqual(1);
    const bb = (await tid(page, "chip-box").boundingBox())!;
    expect(bb.x + bb.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
    void isPhone;
    expect(errors).toEqual([]);
  });
});

test.describe("저장된 칩 첫 그림 깜빡임 없음 (작업 0231 · lead 결정)", () => {
  /** 문서가 열릴 때부터 매 프레임 — 눈에 보이는 칩(visibility hidden · 투명 제외)과 위치 */
  const INIT = `
    window.__cf = [];
    document.addEventListener("DOMContentLoaded", () => {
      const t0 = performance.now();
      const tick = () => {
        const vis = [...document.querySelectorAll('[data-testid="chip"]')].filter((e) => {
          let o = 1, hidden = false;
          for (let n = e; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); o *= parseFloat(cs.opacity); if (cs.visibility === "hidden" || cs.display === "none") hidden = true; }
          const r = e.getBoundingClientRect();
          return !hidden && o > 0.05 && r.width > 0;
        }).map((e) => ({ c: e.getAttribute("data-code"), x: e.getBoundingClientRect().x, leaving: e.getAttribute("data-leaving") === "true" }));
        const nav = document.querySelector('[data-testid="currency-chips"]');
        let ls = null; try { ls = localStorage.getItem("flapfx:recent-currencies"); } catch (e) { ls = "읽기 실패"; }
        // 작업 0308: 틀린 칩이 보일 때 원인을 남김 — 칩 줄 준비 표시(data-ready) · 저장값 · 칩 줄 수
        window.__cf.push({ t: performance.now() - t0, vis, attr: document.documentElement.hasAttribute("data-recent-chips"), ready: !!nav && nav.hasAttribute("data-ready"), ls, navs: document.querySelectorAll('[data-testid="currency-chips"]').length });
        if (performance.now() - t0 < 6000) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  `;
  type CF = { t: number; vis: { c: string; x: number; leaving: boolean }[]; attr: boolean; ready: boolean; ls: string | null; navs: number };
  const frames = (page: Page) => page.evaluate(() => (window as unknown as { __cf: unknown[] }).__cf) as Promise<CF[]>;
  const SAVED = ["GBP", "SGD", "AUD", "MYR", "CNH", "JPY", "USD"];

  test("저장이 있고 CPU 가 6배 느려도 — 첫 프레임부터 틀린 칩(기본 줄)이 한 번도 안 보임 · html 에 data-recent-chips · 저장 순서로 나타남 · 밀림 모션 없음", async ({ page }) => {
    await seed(page, SAVED);
    await page.addInitScript(INIT);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
    await page.goto("/currencies/GBP");
    test.skip(!(await hasAll(page, SAVED)), "받은 통화가 모자람");
    await page.waitForTimeout(5500);
    const fr = await frames(page);
    expect(fr.length).toBeGreaterThan(10);
    const want = SAVED.slice(0, 5);
    expect(fr[0].attr, "첫 프레임에 html 표시(data-recent-chips)").toBe(true);
    const rowOf = (f: CF) => [...f.vis].sort((a, b) => a.x - b.x).map((v) => v.c);
    for (const f of fr) {
      const row = rowOf(f);
      expect(row.length === 0 || JSON.stringify(row) === JSON.stringify(want), `틀린 칩이 보임 (t=${f.t.toFixed(0)}ms): ${row.join(" ")} · 준비 ${f.ready} · html 표시 ${f.attr} · 칩 줄 ${f.navs}개 · 저장값 ${f.ls}`).toBe(true);
    }
    expect(rowOf(fr[fr.length - 1]), "끝에는 저장 순서").toEqual(want);
    // 나타난 뒤에는 밀림(위치 이동) 없음 · 빠지는 칩 없음
    const firstShown = fr.findIndex((f) => f.vis.length > 0);
    expect(firstShown).toBeGreaterThanOrEqual(0);
    const x0 = Object.fromEntries(fr[firstShown].vis.map((v) => [v.c, v.x]));
    for (const f of fr.slice(firstShown)) for (const v of f.vis) { expect(Math.abs(v.x - x0[v.c]), `${v.c} 칩이 움직임(밀림 모션) t=${f.t.toFixed(0)}`).toBeLessThanOrEqual(1.5); expect(v.leaving).toBe(false); }
    await expect(tid(page, "chip-more")).toHaveText("더보기 +2");
  });

  test("저장이 없으면(처음 방문) 숨김 없이 첫 프레임부터 기본 칩 · html 에 표시 없음", async ({ page }) => {
    await page.addInitScript(INIT);
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
    await page.goto("/currencies/JPY");
    await page.waitForTimeout(3500);
    const fr = await frames(page);
    expect(fr.length).toBeGreaterThan(5);
    expect(fr.every((f) => !f.attr), "html 표시가 붙음").toBe(true);
    const row = [...fr[0].vis].sort((a, b) => a.x - b.x).map((v) => v.c);
    expect(row.length, "첫 프레임부터 칩이 보임").toBeGreaterThanOrEqual(3);
    expect(row.slice(0, 4)).toEqual(DEFAULT4.filter((c) => row.includes(c)).slice(0, 4));
  });

  test("자바스크립트를 꺼도 기본 칩이 보임(저장을 읽을 수 없으니 숨기지 않음)", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/currencies/JPY");
    const vis = await tid(page, "chip").evaluateAll((els) => els.filter((e) => { for (let n: Element | null = e; n && n !== document.body; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.visibility === "hidden" || cs.display === "none") return false; } return e.getBoundingClientRect().width > 0; }).map((e) => e.getAttribute("data-code")));
    expect(vis.length).toBeGreaterThanOrEqual(3);
    await ctx.close();
  });

  test("저장이 깨져 있어도(JSON 아님 · 코드 아님) 영영 숨지 않음 — 오류 없이 하이드레이션 뒤 기본 칩", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.addInitScript(([k]) => { try { window.localStorage.setItem(k as string, "{not json"); } catch {} }, [KEY]);
    await page.goto("/currencies/JPY");
    await page.waitForTimeout(1500);
    const row = await rowCodes(page);
    expect(row.length, "깨진 저장에서도 칩이 보임").toBeGreaterThanOrEqual(3);
    const hiddenNow = await tid(page, "currency-chips").evaluate((e) => getComputedStyle(e).visibility);
    expect(hiddenNow).not.toBe("hidden");
    expect(errors).toEqual([]);
  });
});

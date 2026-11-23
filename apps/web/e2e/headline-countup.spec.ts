// 작업 0321 — 큰 제목 숫자 카운트업 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   요구(.agents/specs/0321-headline-countup/plan.md):
//   1 직구(/calc) 물건 값을 바꾸면 제목 금액만 직전 값 → 새 값으로 카운트업 · 나머지 문장은 바로
//   2 여행 물가(/prices) 나라를 바꾸면 % 숫자만 카운트업 + 노란 밑줄(emph-sweep)이 다시 그어짐 · 나라 이름 · 높습니다/낮습니다 는 바로
//   3 카운트 중 또 바뀌면 보이던 값에서 이어 감 (튀지 않음)
//   4 서버 첫 그림 · 자바스크립트 없음 · 움직임 줄이기 = 최종 값 그대로
//   5 숫자 형식 그대로(쉼표 · 원 / %) · tabular-nums
//   6 숫자 없는 문장으로 바뀌면 모션 없이 바로
//   7 처음 들어올 때 밑줄 모션 그대로
//   기록 방법: 제목 안 숫자 조각(data-testid="emph")의 글을 화면 프레임마다 읽음 — 구현 부품(CountUp 등)의 모양에 기대지 않고 보이는 값만 봄
import { type Page, expect, test } from "@playwright/test";
import { hydrated } from "./helpers";

type Frame = { t: number; text: string; emph: string[]; sweep: boolean };
type W = Window & { __rec?: Frame[]; __stop?: boolean };

const CALC_H1 = "#calc-title";
const PRICES_H1 = "main h1";
const num = (s: string) => Number(s.replace(/[^\d.]/g, ""));
/** 숫자를 # 으로 바꾼 문장 뼈대 — 숫자가 아닌 말이 바로 바뀌는지 볼 때 */
const skeleton = (s: string) => s.replace(/[\d,]+(?:\.\d+)?(?=[%원])/g, "#");

async function startRec(page: Page, sel: string) {
  await page.evaluate((s) => {
    const w = window as W;
    w.__rec = [];
    w.__stop = false;
    const loop = () => {
      const h = document.querySelector(s) as HTMLElement | null;
      if (h) {
        const sweep = document.getAnimations().some((a) => (a as CSSAnimation).animationName === "emph-sweep" && h.contains((a.effect as KeyframeEffect | null)?.target ?? null));
        w.__rec!.push({ t: performance.now(), text: h.innerText.replace(/\s+/g, " ").trim(), emph: [...h.querySelectorAll('[data-testid="emph"]')].map((e) => (e as HTMLElement).innerText.trim()), sweep });
      }
      if (!w.__stop) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, sel);
}
const mark = (page: Page) => page.evaluate(() => performance.now());
async function stopRec(page: Page): Promise<Frame[]> {
  return page.evaluate(() => {
    const w = window as W;
    w.__stop = true;
    return w.__rec ?? [];
  });
}
/** 숫자 조각 글이 1.4초 동안 안 바뀔 때까지 기다림(카운트가 끝남) — 끝난 글을 돌려줌 */
const settle = (page: Page, sel: string) =>
  page.evaluate(
    (s) =>
      new Promise<string>((res) => {
        const read = () => [...document.querySelectorAll(`${s} [data-testid="emph"]`)].map((e) => (e as HTMLElement).innerText.trim()).join("|");
        let last = read();
        let since = performance.now();
        const t0 = since;
        const id = setInterval(() => {
          const c = read();
          const now = performance.now();
          if (c !== last) {
            last = c;
            since = now;
          }
          if (now - since > 1400 || now - t0 > 9000) {
            clearInterval(id);
            res(last);
          }
        }, 50);
      }),
    sel,
  );
/** 제목 안에서 숫자 글자를 직접 가진 요소의 tabular-nums 여부 */
const tabularOk = (page: Page, sel: string) =>
  page.evaluate((s) => {
    const h = document.querySelector(s) as HTMLElement;
    const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    const bad: string[] = [];
    let seen = 0;
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (!/\d/.test(n.textContent ?? "")) continue;
      seen++;
      const el = n.parentElement as HTMLElement;
      if (!getComputedStyle(el).fontVariantNumeric.includes("tabular-nums")) bad.push(el.outerHTML.slice(0, 80));
    }
    return { seen, bad };
  }, sel);

// ── 직구 ──
async function openCalc(page: Page) {
  await page.goto("/calc");
  test.skip((await page.getByTestId("calc-limit-fill").count()) === 0, "환율 자료 없음");
  await hydrated(page.locator("#price"));
  await page.locator("#currency").selectOption("USD");
  await page.locator("#duty").fill("8");
}
const setPrice = (page: Page, v: string) => page.locator("#price").fill(v);
/** 가격마다 끝난 금액 — 한 번 돌려 본 값 (이어 감 시험에서 끝 값을 비교) */
async function finalAmount(page: Page, price: string) {
  await setPrice(page, price);
  return num((await settle(page, CALC_H1)).split("|")[0] ?? "");
}

for (const [label, reduced] of [["", false], [" · 움직임 줄이기", true]] as const) {
  test.describe(`직구 큰 제목 카운트업${label} (작업 0321)`, () => {
    test.beforeEach(async ({ page }) => {
      if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
    });

    test(`요구 ${reduced ? "4" : "1 · 5"}: 물건 값을 바꾸면 ${reduced ? "바로 최종 값(중간 값 없음)" : "금액이 직전 값 → 새 값으로 중간 값을 지나 끝남 · 나머지 문장은 그대로 · 쉼표 · 원"}`, async ({ page }) => {
      await openCalc(page);
      await setPrice(page, "1000");
      const a = num((await settle(page, CALC_H1)).split("|")[0] ?? "");
      expect(a, "처음 금액").toBeGreaterThan(0);
      await startRec(page, CALC_H1);
      const t0 = await mark(page);
      await setPrice(page, "3000");
      const final = await settle(page, CALC_H1);
      const frames = (await stopRec(page)).filter((f) => f.t >= t0 && f.emph.length > 0);
      const b = num(final.split("|")[0] ?? "");
      expect(b, "새 금액이 더 큼").toBeGreaterThan(a);
      const vals = frames.map((f) => num(f.emph[0] ?? ""));
      for (const f of frames) {
        expect(f.emph[0], "쉼표 · 원 형식").toMatch(/^\d{1,3}(,\d{3})*원$/);
        expect(f.text, "나머지 문장은 그대로").toMatch(/^관세 · 부가세 약 [\d,]+원이 붙습니다$/);
      }
      expect(vals.at(-1), "끝은 새 금액").toBe(b);
      if (reduced) {
        expect(vals.every((v) => v === a || v === b), "움직임 줄이기 — 중간 값 없음").toBe(true);
      } else {
        expect(Math.min(...vals), "0 이 아니라 직전 값에서 시작 — 직전 값 아래로 내려가지 않음").toBeGreaterThanOrEqual(a - 1);
        expect(vals.some((v) => v > a + 1 && v < b - 1), "중간 값을 지남").toBe(true);
        expect(vals.some((v) => v < a + (b - a) * 0.5), "처음엔 직전 값 쪽(곧바로 끝 값이 아님)").toBe(true);
        for (let i = 1; i < vals.length; i++) expect(vals[i]! >= vals[i - 1]! - 1, "올라가는 동안 되돌지 않음").toBe(true);
      }
    });

    test(`요구 ${reduced ? "4" : "1"}: 값을 내려도 직전 값에서 내려감${reduced ? " (움직임 줄이기는 바로)" : ""}`, async ({ page }) => {
      await openCalc(page);
      await setPrice(page, "3000");
      const a = num((await settle(page, CALC_H1)).split("|")[0] ?? "");
      await startRec(page, CALC_H1);
      const t0 = await mark(page);
      await setPrice(page, "1000");
      const b = num((await settle(page, CALC_H1)).split("|")[0] ?? "");
      const vals = (await stopRec(page)).filter((f) => f.t >= t0 && f.emph.length > 0).map((f) => num(f.emph[0] ?? ""));
      expect(b).toBeLessThan(a);
      expect(vals.at(-1)).toBe(b);
      expect(Math.max(...vals), "직전 값 위로 올라가지 않음").toBeLessThanOrEqual(a + 1);
      if (!reduced) expect(vals.some((v) => v < a - 1 && v > b + 1), "중간 값을 지남").toBe(true);
      else expect(vals.every((v) => v === a || v === b)).toBe(true);
    });
  });
}

test.describe("직구 큰 제목 — 이어 감 · 숫자 없는 문장 · 서버 첫 그림 (작업 0321)", () => {
  test("요구 3: 카운트 도중 또 바꾸면 그 순간 보이던 값에서 새 값으로 이어 감(튀지 않음) · 끝은 새 값", async ({ page }) => {
    await openCalc(page);
    const mapA = await finalAmount(page, "1000");
    const mapB = await finalAmount(page, "3000");
    const mapC = await finalAmount(page, "1500");
    await setPrice(page, "1000");
    await settle(page, CALC_H1);
    await startRec(page, CALC_H1);
    await setPrice(page, "3000");
    // 직전 값에서 위로 50% ~ 80% 지났을 때
    const lo = mapA + (mapB - mapA) * 0.5;
    const hi = mapA + (mapB - mapA) * 0.8;
    await expect.poll(async () => page.evaluate(() => { const r = (window as W).__rec ?? []; return Number((r.at(-1)?.emph[0] ?? "").replace(/[^\d]/g, "")); }), { timeout: 5000, intervals: [10] }).toBeGreaterThan(lo);
    const seen = await page.evaluate(() => { const r = (window as W).__rec ?? []; return Number((r.at(-1)?.emph[0] ?? "").replace(/[^\d]/g, "")); });
    expect(seen, "카운트 도중(50% ~ 80%)의 값을 잡음 — 곧바로 끝 값으로 가면 안 됨").toBeLessThanOrEqual(hi);
    const t0 = await mark(page);
    await setPrice(page, "1500");
    const final = await settle(page, CALC_H1);
    const frames = (await stopRec(page)).filter((f) => f.t >= t0 - 100 && f.emph.length > 0);
    const vals = frames.map((f) => num(f.emph[0] ?? ""));
    expect(num(final.split("|")[0] ?? ""), "끝은 새 값").toBe(mapC);
    const limit = (mapB - mapA) * 0.25;
    for (let i = 1; i < vals.length; i++) expect(Math.abs(vals[i]! - vals[i - 1]!), `프레임 ${i} 에서 튐 (${vals[i - 1]} → ${vals[i]})`).toBeLessThanOrEqual(limit);
    expect(vals.some((v) => v > mapC + 1 && v < seen - 1), "보이던 값과 새 값 사이 중간 값을 지남").toBe(true);
    expect(vals.every((v) => v >= mapC - 1 && v <= mapB + 1), "시작 값(옛 값 · 0)으로 되돌아가지 않음").toBe(true);
  });

  test("요구 6: 숫자 없는 문장('관세율을 넣어 보세요')으로 바뀌면 모션 없이 바로 — 옛 금액이 줄어들지 않음", async ({ page }) => {
    await openCalc(page);
    await setPrice(page, "3000");
    const a = num((await settle(page, CALC_H1)).split("|")[0] ?? "");
    await startRec(page, CALC_H1);
    const t0 = await mark(page);
    await page.locator("#duty").fill("");
    await expect(page.locator(CALC_H1)).toHaveText("관세율을 넣어 보세요");
    await page.evaluate(() => new Promise((r) => setTimeout(r, 1200)));
    const frames = (await stopRec(page)).filter((f) => f.t >= t0);
    const switched = frames.findIndex((f) => f.text === "관세율을 넣어 보세요");
    expect(switched, "문장이 바뀜").toBeGreaterThanOrEqual(0);
    for (const f of frames.slice(0, switched)) expect(num(f.emph[0] ?? ""), "바뀌기 전까지 옛 금액 그대로(줄어들지 않음)").toBe(a);
    for (const f of frames.slice(switched)) {
      expect(f.text, "바뀐 뒤 같은 문장").toBe("관세율을 넣어 보세요");
      expect(f.emph, "숫자 조각 없음").toEqual([]);
    }
  });

  test("요구 4: 자바스크립트 없이도 서버가 그린 글이 최종 문장 — 자바스크립트가 켜진 끝 문장과 같음", async ({ browser, page }) => {
    await page.goto("/calc");
    test.skip((await page.getByTestId("calc-limit-fill").count()) === 0, "환율 자료 없음");
    await hydrated(page.locator("#price"));
    await settle(page, CALC_H1);
    const on = (await page.locator(CALC_H1).innerText()).replace(/\s+/g, " ").trim();
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const p = await ctx.newPage();
    await p.goto(new URL("/calc", page.url()).toString());
    const off = ((await p.locator(CALC_H1).innerText()) || "").replace(/\s+/g, " ").trim();
    await ctx.close();
    expect(off.length, "서버 첫 그림에 제목이 있음").toBeGreaterThan(0);
    expect(off).toBe(on);
  });

  test("요구 5: 제목 숫자는 tabular-nums — 카운트 중에도 글자 폭이 흔들리지 않는 숫자 모양", async ({ page }) => {
    await openCalc(page);
    await setPrice(page, "1000");
    await settle(page, CALC_H1);
    await setPrice(page, "3000");
    await page.evaluate(() => new Promise((r) => setTimeout(r, 300))); // 카운트 도중
    const r = await tabularOk(page, CALC_H1);
    expect(r.seen, "숫자 글자가 있음").toBeGreaterThan(0);
    expect(r.bad, "tabular-nums 가 아닌 숫자 요소").toEqual([]);
  });
});

// ── 여행 물가 ──
const savePicked = (page: Page, country = "JPN", city = "도쿄") => page.addInitScript(([c, t]) => localStorage.setItem("flapfx:picked", JSON.stringify({ v: 1, country: c, city: t, budget: 0 })), [country, city]);
const dialog = (page: Page) => page.getByRole("dialog", { name: "어디로 떠나세요?" });
async function pickChip(page: Page, i: number) {
  await page.getByTestId("pick-trip-other").first().click();
  const d = dialog(page);
  await expect(d).toBeVisible();
  await d.getByTestId("pick-chip").nth(i).click();
  await expect(d).toHaveCount(0);
}
const pctText = (s: string) => /(\d+)%/.exec(s)?.[1];

for (const [label, reduced] of [["", false], [" · 움직임 줄이기", true]] as const) {
  test.describe(`여행 물가 큰 제목 카운트업${label} (작업 0321)`, () => {
    test(`요구 ${reduced ? "4" : "2 · 5"}: 나라를 바꾸면 ${reduced ? "바로 최종 값" : "% 숫자만 직전 값 → 새 값 · 이름 · 높습니다/낮습니다 는 바로 · 밑줄이 다시 그어짐"}`, async ({ page }) => {
      if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
      await savePicked(page);
      await page.goto("/prices");
      await hydrated(page.locator(PRICES_H1));
      await settle(page, PRICES_H1);
      await startRec(page, PRICES_H1);
      let checked = 0;
      for (let i = 0; i < 5; i++) {
        const before = (await page.locator(PRICES_H1).innerText()).replace(/\s+/g, " ").trim();
        const t0 = await mark(page);
        await pickChip(page, i);
        await settle(page, PRICES_H1);
        const after = (await page.locator(PRICES_H1).innerText()).replace(/\s+/g, " ").trim();
        const all = await page.evaluate(() => (window as W).__rec ?? []);
        const frames = all.filter((f) => f.t >= t0 && f.emph.length > 0);
        // 퍼센트 문장끼리 · 숫자와 이름이 모두 달라진 바뀜만 봄
        if (!pctText(before) || !pctText(after) || pctText(before) === pctText(after) || skeleton(before) === skeleton(after)) continue;
        checked++;
        const a = Number(pctText(before));
        const b = Number(pctText(after));
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        const vals = frames.map((f) => num(f.emph[0] ?? ""));
        for (const f of frames) expect(f.emph[0], "% 형식").toMatch(/^\d+%$/);
        // 나라 이름 · 높습니다/낮습니다: 모든 프레임이 옛 문장 뼈대 아니면 새 문장 뼈대 — 섞이지 않음
        for (const f of frames) expect([skeleton(before), skeleton(after)], `문장 뼈대 '${f.text}'`).toContain(skeleton(f.text));
        expect(vals.at(-1), "끝은 새 값").toBe(b);
        const firstNew = frames.findIndex((f) => skeleton(f.text) === skeleton(after));
        expect(firstNew, "새 문장 뼈대가 나옴").toBeGreaterThanOrEqual(0);
        if (reduced) {
          expect(vals.every((v) => v === a || v === b), "움직임 줄이기 — 중간 값 없음").toBe(true);
          continue;
        }
        if (hi - lo >= 4) {
          expect(vals.some((v) => v > lo && v < hi), `${a}% → ${b}% 중간 값을 지남`).toBe(true);
          expect(Math.min(...vals) >= lo && Math.max(...vals) <= hi, "직전 값과 새 값 사이에서만 움직임(0 에서 시작하지 않음)").toBe(true);
          expect(vals[firstNew], "새 이름 · 말이 나오는 첫 프레임에서 숫자는 아직 끝 값이 아님(말은 바로 · 숫자는 카운트)").not.toBe(b);
        }
        // 밑줄이 다시 그어짐 — 새 문장이 나온 뒤 emph-sweep 애니메이션이 한 번은 돌고 있음
        expect(frames.slice(Math.max(0, firstNew - 3)).some((f) => f.sweep), "노란 밑줄(emph-sweep)이 다시 시작됨").toBe(true);
      }
      await stopRec(page);
      expect(checked, "숫자가 달라지는 나라 바꾸기를 한 번 이상 확인").toBeGreaterThan(0);
    });
  });
}

test.describe("여행 물가 큰 제목 — 서버 첫 그림 · 처음 모션 · 숫자 모양 (작업 0321)", () => {
  test("요구 4: 자바스크립트 없이도 서버가 그린 글이 최종 문장 — 켠 끝 문장과 같음", async ({ browser, page }) => {
    await page.goto("/prices");
    await hydrated(page.locator(PRICES_H1));
    await settle(page, PRICES_H1);
    const on = (await page.locator(PRICES_H1).innerText()).replace(/\s+/g, " ").trim();
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const p = await ctx.newPage();
    await p.goto(new URL("/prices", page.url()).toString());
    const off = (await p.locator(PRICES_H1).innerText()).replace(/\s+/g, " ").trim();
    await ctx.close();
    expect(off).toMatch(/한국보다 물가가 \d+% (낮|높)습니다/);
    expect(off).toBe(on);
  });

  test("요구 7: 처음 들어올 때 노란 밑줄 모션(emph-sweep)은 그대로", async ({ page }) => {
    await page.goto("/prices");
    await startRec(page, PRICES_H1);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 800)));
    const frames = await stopRec(page);
    expect(frames.some((f) => f.sweep), "처음 그려질 때 밑줄 애니메이션이 돎").toBe(true);
  });

  test("요구 5: 나라를 바꾸는 도중에도 숫자는 tabular-nums · % 형식", async ({ page }) => {
    await savePicked(page);
    await page.goto("/prices");
    await hydrated(page.locator(PRICES_H1));
    await settle(page, PRICES_H1);
    await pickChip(page, 1);
    await page.evaluate(() => new Promise((r) => setTimeout(r, 300)));
    const r = await tabularOk(page, PRICES_H1);
    expect(r.seen, "숫자 글자가 있음").toBeGreaterThan(0);
    expect(r.bad, "tabular-nums 가 아닌 숫자 요소").toEqual([]);
  });
});

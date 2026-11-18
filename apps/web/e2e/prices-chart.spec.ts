// 작업 0220 그래프 2D(시안 F) — /prices '한국 = 100' 자 e2e · 테스트 먼저
//   기준 캡처: .tmp/redesign-1118/F/shots/prices-1280.png · prices-390.png · prices-mid-700ms-1280.png · prices-mid-1300ms-1280.png
//   DOM 계약은 e2e/chart-helpers.ts 맨 위 주석(여행 물가 자): ruler[data-state] 안 ruler-bar · ruler-pin[data-value] > ruler-pin-value[data-final] · ruler-korea-line · ruler-korea-tag — 각각 data-reveal
//   옛 약속은 유지: ruler 의 data-lo · data-hi(자 양끝 숫자) · 핀의 data-x(%) · data-side(up|down 번갈아)
//   모양: 싼 쪽 파랑 → 한국 근처 옅게 → 비싼 쪽 빨강 그라데이션 자 · 나라마다 국기 원 + 이름 + 큰 숫자 · 노랑 '한국 100' 꼬리표 + 진한 세로선
//   움직임: 자 뻗음 → 나라 싼 순서대로 → 한국 100 선(→ 꼬리표) · 시안의 '다시 보기' 버튼 · '대략 모양입니다' 설명 글은 넣지 않음
import { type Page, expect, test } from "@playwright/test";
import { expectInsideViewport, reveal, scrollJustBelow, scrollTo, tid } from "./chart-helpers";

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const ready = async (page: Page) => (await tid(page, "ruler").count()) > 0;
const ruler = (page: Page) => tid(page, "ruler");

/** 자의 부분들을 프레임마다 기록 — 핀은 순서대로 여러 개라 따로 */
async function record(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __r: unknown[]; __raf: number };
    w.__r = [];
    const t0 = performance.now();
    const rv = (el: Element | null) => (el ? Number(el.getAttribute("data-reveal")) : Number.NaN);
    const tick = () => {
      const pins = [...document.querySelectorAll('[data-testid="ruler"] [data-testid="ruler-pin"]')];
      w.__r.push({
        t: performance.now() - t0,
        bar: rv(document.querySelector('[data-testid="ruler-bar"]')),
        line: rv(document.querySelector('[data-testid="ruler-korea-line"]')),
        tag: rv(document.querySelector('[data-testid="ruler-korea-tag"]')),
        pins: pins.map((p) => ({ v: Number(p.getAttribute("data-value")), r: rv(p), txt: p.querySelector('[data-testid="ruler-pin-value"]')?.textContent ?? "" })),
      });
      w.__raf = requestAnimationFrame(tick);
    };
    tick();
  });
}
type Rec = { t: number; bar: number; line: number; tag: number; pins: { v: number; r: number; txt: string }[] };
const stop = (page: Page) =>
  page.evaluate(() => {
    const w = window as unknown as { __r: unknown[]; __raf: number };
    cancelAnimationFrame(w.__raf);
    return w.__r as Rec[];
  });

test.describe("여행 물가 자 — 풍성한 2D (작업 0220 · 시안 F)", () => {
  test("끝나면 최종 모양 — 그라데이션 자 · 나라 핀마다 국기 · 이름 · 숫자(= 물가 값) · 한국 100 노랑 꼬리표(국기) · 세로선", async ({ page }) => {
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const r = ruler(page);
    await scrollTo(page, r);
    await page.waitForTimeout(6000);
    await expect(r).toHaveAttribute("data-state", "done");
    await expect(r).toHaveAttribute("role", "img");
    const bar = r.locator('[data-testid="ruler-bar"]');
    expect(await reveal(bar), "자").toBe(1);
    // 그라데이션 자 (파랑 → 빨강)
    expect(await bar.evaluate((el) => getComputedStyle(el).backgroundImage)).toMatch(/gradient/);
    const pins = r.locator('[data-testid="ruler-pin"]');
    const n = await pins.count();
    expect(n, "나라 핀").toBeGreaterThanOrEqual(2);
    for (let i = 0; i < n; i++) {
      const p = pins.nth(i);
      expect(await reveal(p), `핀 ${i + 1}`).toBe(1);
      await expect(p.locator("svg").first(), `핀 ${i + 1} 국기`).toBeVisible();
      const value = p.locator('[data-testid="ruler-pin-value"]');
      expect(await reveal(value), `핀 ${i + 1} 카운트업`).toBe(1);
      expect((await value.textContent())?.trim(), `핀 ${i + 1} 숫자가 최종 값`).toBe((await value.getAttribute("data-final"))?.trim());
      expect(Number(await p.getAttribute("data-value")), `핀 ${i + 1} 숫자 = data-value`).toBe(Number((await value.getAttribute("data-final"))?.trim()));
      expect((await p.textContent())?.trim().length ?? 0, `핀 ${i + 1} 이름 + 숫자 글`).toBeGreaterThan(2);
    }
    expect(await reveal(r.locator('[data-testid="ruler-korea-line"]')), "한국 100 선").toBe(1);
    const tag = r.locator('[data-testid="ruler-korea-tag"]');
    expect(await reveal(tag), "한국 100 꼬리표").toBe(1);
    await expect(tag).toContainText("한국 100");
    await expect(tag.locator("svg").first(), "꼬리표 국기").toBeVisible();
  });

  test("한국 100 선은 자 위 100 의 자리 · 핀은 값 비율 자리 · 시안의 '다시 보기' · '대략 모양' 글 없음", async ({ page }) => {
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const r = ruler(page);
    await scrollTo(page, r);
    await page.waitForTimeout(6000);
    const lo = Number(await r.getAttribute("data-lo"));
    const hi = Number(await r.getAttribute("data-hi"));
    const bar = (await r.locator('[data-testid="ruler-bar"]').boundingBox())!;
    const line = (await r.locator('[data-testid="ruler-korea-line"]').boundingBox())!;
    const want = bar.x + (bar.width * (100 - lo)) / (hi - lo);
    expect(Math.abs(line.x + line.width / 2 - want), "한국 100 선 위치").toBeLessThanOrEqual(3);
    const pins = r.locator('[data-testid="ruler-pin"]');
    for (let i = 0; i < (await pins.count()); i++) {
      const p = pins.nth(i);
      expect(Number(await p.getAttribute("data-x")), `핀 ${i + 1} 위치(%)`).toBeCloseTo(((Number(await p.getAttribute("data-value")) - lo) / (hi - lo)) * 100, 1);
    }
    await expect(page.getByRole("button", { name: "다시 보기" })).toHaveCount(0);
    await expect(page.getByText("대략 모양입니다", { exact: false })).toHaveCount(0);
  });

  test("자 · 핀 · 꼬리표가 화면 안 · 가로 넘침 0 · 서로 안 겹침 (넓은 화면 · 휴대폰)", async ({ page }) => {
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const r = ruler(page);
    await scrollTo(page, r);
    await page.waitForTimeout(6000);
    await expectInsideViewport(page, r, "자");
    const rb = (await r.boundingBox())!;
    const boxes = await r.evaluate((el) =>
      [...el.querySelectorAll('[data-testid="ruler-pin-text"], [data-testid="ruler-korea-tag"]')].map((e) => {
        const b = e.getBoundingClientRect();
        return { t: (e.textContent ?? "").trim(), x: b.left, y: b.top, r: b.right, b: b.bottom };
      }),
    );
    expect(boxes.length).toBeGreaterThanOrEqual(3);
    for (const a of boxes) {
      expect(a.x, `${a.t} 왼쪽`).toBeGreaterThanOrEqual(rb.x - 1);
      expect(a.r, `${a.t} 오른쪽`).toBeLessThanOrEqual(rb.x + rb.width + 1);
      expect(a.y, `${a.t} 위`).toBeGreaterThanOrEqual(rb.y - 1);
      expect(a.b, `${a.t} 아래`).toBeLessThanOrEqual(rb.y + rb.height + 1);
    }
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i];
        const b = boxes[j];
        const hit = Math.min(a.r, b.r) - Math.max(a.x, b.x) > 1 && Math.min(a.b, b.b) - Math.max(a.y, b.y) > 1;
        expect(hit, `${a.t} ~ ${b.t} 겹침`).toBe(false);
      }
    // 높이 — 시안은 넓은 화면 약 300px 이상 (위 핀 · 자 · 아래 핀이 다 들어감)
    expect(rb.height, "자 영역 높이").toBeGreaterThanOrEqual(isPhone(page) ? 230 : 280);
  });

  test("화면에 들어오기 전엔 시작 안 함(idle · 모든 부분 0) → 들어오면 재생 → 끝나면 done", async ({ page }) => {
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const r = ruler(page);
    await scrollJustBelow(page, r);
    await page.waitForTimeout(1500);
    await expect(r).toHaveAttribute("data-state", "idle");
    expect(await reveal(r.locator('[data-testid="ruler-bar"]')), "자가 이미 뻗음").toBe(0);
    expect(await reveal(r.locator('[data-testid="ruler-pin"]')), "핀이 이미 보임").toBe(0);
    expect(await reveal(r.locator('[data-testid="ruler-korea-line"]')), "한국 선이 이미 보임").toBe(0);
    await scrollTo(page, r);
    await expect(r).toHaveAttribute("data-state", "done", { timeout: 9000 });
  });

  test("순서 — 자 뻗음 → 나라가 싼 순서대로 → 한국 100 선 → 꼬리표 · 핀 숫자는 카운트업", async ({ page }) => {
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const r = ruler(page);
    await scrollJustBelow(page, r);
    await page.waitForTimeout(500);
    await record(page);
    await scrollTo(page, r);
    await page.waitForTimeout(6500);
    const fr = await stop(page);
    const first = (f: (x: Rec) => number, eps = 0.05) => fr.find((x) => f(x) > eps)?.t;
    const bar = first((x) => x.bar);
    const line = first((x) => x.line);
    const tag = first((x) => x.tag);
    expect(bar, "자가 끝내 안 뻗음").toBeDefined();
    expect(line, "한국 선이 끝내 안 나타남").toBeDefined();
    expect(tag, "꼬리표가 끝내 안 나타남").toBeDefined();
    const n = fr[fr.length - 1].pins.length;
    expect(n).toBeGreaterThanOrEqual(2);
    const pinStart = Array.from({ length: n }, (_, i) => ({ v: fr[fr.length - 1].pins[i].v, t: first((x) => x.pins[i]?.r ?? 0) }));
    for (const [i, p] of pinStart.entries()) expect(p.t, `핀 ${i + 1} 이(가) 끝내 안 나타남`).toBeDefined();
    const sorted = pinStart.slice().sort((a, b) => a.v - b.v);
    // 자가 먼저 · 싼 나라가 먼저(값이 작을수록 먼저 · 같으면 아무나) · 한국 선은 나라들 뒤 · 꼬리표는 선 뒤
    expect(bar as number, "자가 첫 핀보다 먼저").toBeLessThan(sorted[0].t as number);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].v === sorted[i - 1].v) continue;
      expect(sorted[i].t as number, `값 ${sorted[i].v} 핀이 더 싼 값 ${sorted[i - 1].v} 핀보다 먼저 나타남`).toBeGreaterThanOrEqual(sorted[i - 1].t as number);
    }
    const lastPin = Math.max(...pinStart.map((p) => p.t as number));
    expect(line as number, "한국 100 선은 나라들 다음").toBeGreaterThanOrEqual(lastPin);
    expect(tag as number, "꼬리표는 선 다음(같거나)").toBeGreaterThanOrEqual((line as number) - 1);
    // 자는 서서히 뻗음 (중간 진행 프레임)
    expect(fr.some((x) => x.bar > 0.2 && x.bar < 0.8), "자가 서서히 뻗음").toBe(true);
    // 핀 숫자 카운트업: 처음 보일 때 최종 값이 아님 · 끝나면 최종 값
    const lastF = fr[fr.length - 1];
    for (let i = 0; i < n; i++) {
      const startFrame = fr.find((x) => (x.pins[i]?.r ?? 0) > 0.05)!;
      const finalTxt = String(lastF.pins[i].v);
      if (lastF.pins[i].v >= 20) expect(startFrame.pins[i].txt.trim(), `핀 ${i + 1}: 나타나는 순간 이미 최종 숫자`).not.toBe(finalTxt);
      expect(lastF.pins[i].txt.trim(), `핀 ${i + 1}: 끝 숫자`).toBe(finalTxt);
    }
  });

  test("한 번만 — 위로 올라갔다 다시 와도 다시 뻗지 않음", async ({ page }) => {
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    const r = ruler(page);
    await scrollTo(page, r);
    await expect(r).toHaveAttribute("data-state", "done", { timeout: 9000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    await record(page);
    await scrollTo(page, r);
    await page.waitForTimeout(1500);
    const fr = await stop(page);
    for (const f of fr) {
      expect(f.bar, "자가 다시 줄어듦").toBeGreaterThanOrEqual(0.999);
      expect(f.line).toBeGreaterThanOrEqual(0.999);
      for (const p of f.pins) expect(p.r, "핀이 다시 숨음").toBeGreaterThanOrEqual(0.999);
    }
  });

  test("움직임 줄이기 — 처음부터 최종 모양 (done · 모든 부분 1 · 숫자 최종 값)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/prices");
    test.skip(!(await ready(page)), "자료 없음");
    await record(page);
    await scrollTo(page, ruler(page));
    await page.waitForTimeout(800);
    const fr = await stop(page);
    for (const f of fr) {
      expect(f.bar, `자가 처음부터 1 이 아님 (t=${f.t.toFixed(0)}ms)`).toBeGreaterThanOrEqual(0.999);
      expect(f.line).toBeGreaterThanOrEqual(0.999);
      expect(f.tag).toBeGreaterThanOrEqual(0.999);
      for (const p of f.pins) {
        expect(p.r).toBeGreaterThanOrEqual(0.999);
        expect(p.txt.trim()).toBe(String(p.v));
      }
    }
    await expect(ruler(page)).toHaveAttribute("data-state", "done");
  });

  test("자바스크립트를 꺼도 최종 모양이 보임 (자 · 핀 숫자 · 한국 100)", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/prices");
    if (!(await ready(page))) {
      await ctx.close();
      test.skip(true, "자료 없음");
    }
    const r = ruler(page);
    expect(await reveal(r.locator('[data-testid="ruler-bar"]'))).toBe(1);
    expect(await reveal(r.locator('[data-testid="ruler-korea-tag"]'))).toBe(1);
    const pins = r.locator('[data-testid="ruler-pin"]');
    for (let i = 0; i < (await pins.count()); i++) {
      const v = pins.nth(i).locator('[data-testid="ruler-pin-value"]');
      expect((await v.textContent())?.trim()).toBe((await v.getAttribute("data-final"))?.trim());
    }
    await ctx.close();
  });
});

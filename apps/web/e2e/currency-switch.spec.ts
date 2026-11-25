// 작업 0231 모션 7(통화 바꾸기 전환) + 4(글자판 굴러가기) + 사용자 추가 요구(고르면 위로 올라감) — 통화 상세 e2e · 테스트 먼저
//   기준: 스크린샷 .tmp/lead-motion-1119/03-currency-7-pick.png · 04 · 05 · 참고 구현 .tmp/motion-pages/m-currencies-USD.js · 원본 .tmp/motion-1119/switch/index.html
//   전환 = Next 클라이언트 이동(주소 /currencies/XXX · 정적 자료 · 실행 중 API 없음) + 전환 기억(직전 통화 값에서 새 값으로)
//   순서: 고름 → (환율 자리가 화면 위로 벗어나 있으면) 환율 자리까지 부드럽게 올라간 뒤 → 칩이 맨 앞으로 밀림 → 국기가 칩에서 제목 옆 국기 자리로 포물선으로 날아감 → 이름 · 제목 · 신호 글이 바뀜 → 큰 환율 · 1년 최저 · 최고 · 평균이 직전 값에서 카운트업 → 막대 위 비행기가 새 자리로(왼쪽이면 기수를 돌림) → '실제로 바꿀 때' 글자판이 굴러가고 입력 · 빠른 금액이 그 통화로 → 1년 그래프 · 물가 링크도 그 통화
//   DOM 계약(새로 생기는 것)
//     [data-testid="currency-kicker"] — 머리 맨 위 국기 라벨 줄(국기 svg + '이름 · 코드') · 환율 자리의 기준(스크롤은 이 줄이 메뉴 띠 아래 96px 근처에 오게)
//     [data-testid="flag-fly"] — 전환 중에만 있는 날아가는 국기(position fixed · 칩 국기 자리에서 kicker 국기 자리까지 포물선 · 끝나면 DOM 에서 빠짐)
//     [data-testid="route-plane"][data-heading="left|right"] — 비행기가 움직이는 동안 가는 방향(왼쪽이면 기수를 돌림 = left) · 기존 data-position 은 그대로(새 통화 값)
//     글자판 [data-testid="flap-board"](role=img · aria-label 최종 글 한 번)은 그대로 · 안 숫자는 0227 RollingNumber(굴러가는 칸 data-moving="true")
//   끝 상태 = 그 통화 페이지를 새로 불러온 것과 같음(kicker · 큰 환율 · 최저 · 최고 · 평균 · 입력 · 빠른 금액 · 글자판 글 · 물가 링크 · 그래프) — 아래 pageSnap
//   처음 들어옴 · 새로 고침 · 주소로 바로 옴은 전환이 아니므로 flag-fly · 글자판 굴러감 · 스크롤 이동 없음
//   움직임 줄이기면 스크롤 · 국기 · 카운트업 · 칩 밀림 없이 바로 최종
import { type Page, expect, test } from "@playwright/test";
import { listCodes, listLink, openSide } from "./currency-list";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const num = (s: string | null | undefined) => Number((s ?? "").replace(/[^\d.]/g, ""));
const norm = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

/** 그 통화 페이지의 끝 상태 한 장 — 전환 뒤 값이 새로 불러온 페이지와 같은지 비교 */
async function pageSnap(page: Page) {
  return page.evaluate(() => {
    const t = (sel: string) => (document.querySelector(sel)?.textContent ?? "").replace(/\s+/g, " ").trim();
    const fin = (sel: string) => document.querySelector(sel + ' [data-testid="count-up"]')?.getAttribute("data-final") ?? null;
    const input = document.querySelector('[data-testid="converter"] input') as HTMLInputElement | null;
    return {
      path: location.pathname.replace(/\/$/, ""),
      kicker: t('[data-testid="currency-kicker"]'),
      title: (document.querySelector('[data-testid="big-rate"] > span') as HTMLElement | null)?.innerText.replace(/\s+/g, " ").trim() ?? "",
      big: fin('[data-testid="big-rate"]'),
      min: fin('[data-testid="route-min"]'), max: fin('[data-testid="route-max"]'), avg: t('[data-testid="route-avg"]'),
      pos: document.querySelector('[data-testid="route-plane"]')?.getAttribute("data-position") ?? null,
      amount: input?.value ?? null,
      board: document.querySelector('[data-testid="converter-board"] [data-testid="flap-board"]')?.getAttribute("aria-label") ?? null,
      presets: [...document.querySelectorAll('[data-testid="converter"] [role="group"] button')].map((b) => (b.textContent ?? "").replace(/\s+/g, " ").trim()),
      note: t("#converter-note"),
      priceLink: [...document.querySelectorAll("a")].find((a) => /물가 보기/.test(a.textContent ?? ""))?.getAttribute("href") ?? null,
    };
  });
}

/** 1년 평균 줄을 화면에 넣고 세어 가는 움직임(약 1초 + 0.22초 기다림)이 끝나기를 기다림 (작업 0351) */
async function avgIntoView(page: Page) {
  await tid(page, "route-avg").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
}

/** 전환 동안 매 프레임 모음 — 클라이언트 이동은 문서가 이어지므로 같은 기록기가 계속 돎 */
const RECORD = `
  (() => {
    const w = window; w.__sw = []; w.__swStop = false; w.__swT0 = performance.now();
    const ctr = (r) => ({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
    const tick = () => {
      const k = document.querySelector('[data-testid="currency-kicker"]');
      const plane = document.querySelector('[data-testid="route-plane"]');
      const fly = document.querySelector('[data-testid="flag-fly"]');
      const track = plane && plane.parentElement ? plane.parentElement.getBoundingClientRect() : null;
      const chips = {};
      document.querySelectorAll('[data-testid="chip"]').forEach((e) => { chips[e.getAttribute("data-code")] = e.getBoundingClientRect().x; });
      const nav = document.querySelector("header");
      w.__sw.push({
        t: performance.now() - w.__swT0, path: location.pathname.replace(/\\/$/, ""), y: scrollY, nav: nav ? nav.getBoundingClientRect().bottom : 0,
        kTop: k ? k.getBoundingClientRect().top : null, kText: k ? k.textContent.replace(/\\s+/g, " ").trim() : null,
        big: document.querySelector('[data-testid="big-rate"] [data-testid="count-up"]')?.textContent ?? null,
        min: document.querySelector('[data-testid="route-min"] [data-testid="count-up"]')?.textContent ?? null,
        plane: plane && track ? { f: (ctr(plane.getBoundingClientRect()).x - track.x) / track.width, heading: plane.getAttribute("data-heading"), pos: plane.getAttribute("data-position") } : null,
        fly: fly ? ctr(fly.getBoundingClientRect()) : null,
        moving: document.querySelectorAll('[data-testid="converter"] [data-moving="true"]').length,
        chips,
      });
      if (!w.__swStop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })()
`;
type Fr = { t: number; path: string; y: number; nav: number; kTop: number | null; kText: string | null; big: string | null; min: string | null; plane: { f: number; heading: string | null; pos: string | null } | null; fly: { x: number; y: number } | null; moving: number; chips: Record<string, number> };
const startRec = (page: Page) => page.evaluate(RECORD);
const stopRec = (page: Page) => page.evaluate(() => { const w = window as unknown as { __sw: unknown[]; __swStop: boolean }; w.__swStop = true; return w.__sw; }) as Promise<Fr[]>;
const recNow = (page: Page) => page.evaluate(() => performance.now() - (window as unknown as { __swT0: number }).__swT0);

const chip = (page: Page, code: string) => tid(page, "chip").and(page.locator(`[data-code="${code}"]`));
const settle = async (page: Page, code: string, ms = 4500) => {
  await expect(page).toHaveURL(new RegExp(`/currencies/${code}/?$`), { timeout: 12000 });
  await page.waitForTimeout(ms);
};
/** 새로 불러온 그 통화 페이지의 끝 상태 */
async function freshSnap(page: Page, code: string) {
  const p = await page.context().newPage();
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.setViewportSize(page.viewportSize()!);
  await p.goto(`/currencies/${code}`);
  await p.waitForTimeout(1500);
  const s = await pageSnap(p);
  await p.close();
  return s;
}

test.describe("통화 바꾸기 전환 (작업 0231 · 모션 7 · 4)", () => {
  test("사이드바에서 고르면 사이드바가 닫히고 그 통화로 바뀜 — 끝 상태 = 그 통화 페이지를 새로 불러온 것과 같음 · 고른 표시가 옮겨 감 · 칩 맨 앞 (작업 0365: 맨 아래 표가 없어져 '위로 올라간 뒤 이동' 단계는 요구하지 않음)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/currencies/JPY");
    await page.waitForTimeout(800);
    await openSide(page);
    await listLink(page, "USD").click();
    await settle(page, "USD", 4000);
    await expect(tid(page, "currency-sidebar"), "사이드바가 닫힘").toBeHidden();
    await avgIntoView(page);
    expect(await pageSnap(page)).toEqual(await freshSnap(page, "USD"));
    await expect(listLink(page, "USD")).toHaveAttribute("aria-current", "page");
    await expect(listLink(page, "JPY")).not.toHaveAttribute("aria-current", "page");
    expect(await tid(page, "chip").first().getAttribute("data-code")).toBe("USD");
  });

  test("칩에서 고르면(환율 자리가 이미 보임) 올라가지 않고 — 국기가 칩에서 제목 옆 국기 자리까지 포물선으로 날아가고 → 글이 바뀜 → 큰 환율 · 최저가 직전 값에서 카운트업(끝 = 새 값)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/currencies/JPY");
    await page.waitForTimeout(1500);
    const prev = { big: num(await tid(page, "big-rate").getByTestId("count-up").getAttribute("data-final")), min: num(await tid(page, "route-min").getByTestId("count-up").getAttribute("data-final")) };
    const chipFlag = (await chip(page, "USD").locator("svg").first().boundingBox())!;
    const y0 = await page.evaluate(() => scrollY);
    await startRec(page);
    await page.waitForTimeout(150);
    const tClick = await recNow(page);
    await chip(page, "USD").click();
    await settle(page, "USD", 4500);
    const fr = (await stopRec(page)).filter((f) => f.t >= tClick - 20);
    // 스크롤은 그대로(이미 환율 자리가 보임)
    for (const f of fr) expect(Math.abs(f.y - y0), `불필요하게 스크롤됨 (t=${f.t.toFixed(0)})`).toBeLessThanOrEqual(2);
    // 날아가는 국기
    const flying = fr.filter((f) => f.fly);
    expect(flying.length, "날아가는 국기 프레임 수").toBeGreaterThanOrEqual(8);
    const s = flying[0].fly!;
    expect(Math.hypot(s.x - (chipFlag.x + chipFlag.width / 2), s.y - (chipFlag.y + chipFlag.height / 2)), "칩 국기 자리에서 출발(px)").toBeLessThanOrEqual(40);
    const kf = await tid(page, "currency-kicker").locator("svg").first().boundingBox();
    const e = flying[flying.length - 1].fly!;
    expect(Math.hypot(e.x - (kf!.x + kf!.width / 2), e.y - (kf!.y + kf!.height / 2)), "제목 옆 국기 자리에 도착(px)").toBeLessThanOrEqual(40);
    // 포물선 — 두 점을 이은 직선에서 벗어남
    const dx = e.x - s.x, dy = e.y - s.y, L = Math.hypot(dx, dy) || 1;
    const dev = Math.max(...flying.map((f) => Math.abs((f.fly!.x - s.x) * dy - (f.fly!.y - s.y) * dx) / L));
    expect(dev, "직선이 아니라 포물선으로 휨(px)").toBeGreaterThanOrEqual(12);
    const dur = flying[flying.length - 1].t - flying[0].t;
    expect(dur, `날아가는 시간 ${dur.toFixed(0)}ms`).toBeGreaterThanOrEqual(350);
    expect(dur).toBeLessThanOrEqual(1500);
    await expect(tid(page, "flag-fly"), "끝나면 DOM 에서 빠짐").toHaveCount(0);
    // 큰 환율: 직전 값에서 새 값으로 단조 카운트업
    const nextBig = num(await tid(page, "big-rate").getByTestId("count-up").getAttribute("data-final"));
    expect(nextBig).not.toBe(prev.big);
    const seq = fr.filter((f) => f.path === "/currencies/USD" && f.big).map((f) => num(f.big));
    const dir = Math.sign(nextBig - prev.big);
    const from = seq.findIndex((v) => Math.abs(v - prev.big) / prev.big < 0.01);
    expect(from, "직전 값에서 시작한 프레임이 있음").toBeGreaterThanOrEqual(0);
    const part = seq.slice(from);
    for (let i = 1; i < part.length; i++) expect((part[i] - part[i - 1]) * dir, `카운트업이 거꾸로 감 (${part[i - 1]} → ${part[i]})`).toBeGreaterThanOrEqual(-Math.abs(nextBig) * 0.0005);
    expect(part.some((v) => v !== prev.big && v !== nextBig), "중간 값을 지남").toBe(true);
    expect(part[part.length - 1]).toBe(nextBig);
    // 이름 줄(kicker)이 새 통화로
    expect(fr[fr.length - 1].kText).toContain("USD");
    // 순서: 국기가 날아가기 시작한 뒤에 큰 환율이 직전 값을 벗어남
    const tFly = flying[0].t;
    const tBig = fr.find((f) => f.path === "/currencies/USD" && f.big && Math.abs(num(f.big) - prev.big) / prev.big > 0.01)?.t ?? Infinity;
    expect(tFly, "국기가 날아간 뒤에 카운트업").toBeLessThanOrEqual(tBig + 50);
  });

  test("사이드바에서 고르면 비행기 끝 위치 = 새 통화 값(오늘 점 위치) (작업 0365: 움직이는 동안의 방향 검사는 칩 선택 쪽 테스트가 지킴)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/currencies/JPY");
    await page.waitForTimeout(1500);
    const oldPos = Number(await tid(page, "route-plane").getAttribute("data-position"));
    // 오늘 점 위치가 JPY 와 15%p 이상 다른 통화를 자료에서 고름(목록의 통화를 하나씩 새 탭으로 열어 읽음) — 그런 통화가 없을 때만 건너뜀
    const codes = (await listCodes(page)).filter((c) => c && c !== "JPY").slice(0, 14);
    let target: { code: string; pos: number } | null = null;
    const probe = await page.context().newPage();
    await probe.emulateMedia({ reducedMotion: "reduce" });
    for (const code of codes) {
      await probe.goto(`/currencies/${code}`);
      const v = await tid(probe, "route-plane").getAttribute("data-position").catch(() => null);
      if (v !== null && Math.abs(Number(v) - oldPos) >= 0.15) { target = { code, pos: Number(v) }; break; }
    }
    await probe.close();
    test.skip(!target, "JPY 와 오늘 점 위치가 15%p 이상 다른 통화가 없음(자료)");
    const { code, pos: newPos } = target!;
    await openSide(page);
    await listLink(page, code).click();
    await settle(page, code, 5000);
    await expect(tid(page, "currency-sidebar"), "사이드바가 닫힘").toBeHidden();
    const last = Number(await tid(page, "route-plane").getAttribute("data-position"));
    expect(Math.abs(last - newPos), `끝 위치 = 새 통화 값 (JPY ${oldPos} → ${code} ${newPos})`).toBeLessThanOrEqual(0.03);
  });

  test("'실제로 바꿀 때' — 글자판이 굴러가고(data-moving) 끝 글 · 입력 · 빠른 금액이 그 통화 · 끝 상태 전체가 그 통화 페이지를 새로 불러온 것과 같음 · 물가 링크 · 그래프", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/currencies/JPY");
    await page.waitForTimeout(1500);
    await startRec(page);
    await chip(page, "USD").click();
    await settle(page, "USD", 5000);
    const fr = await stopRec(page);
    expect(Math.max(...fr.map((f) => f.moving)), "글자판 굴러가는 칸이 한 번은 있음").toBeGreaterThan(0);
    expect(fr[fr.length - 1].moving, "끝에는 멈춤").toBe(0);
    await avgIntoView(page); // 작업 0351: 1년 평균 숫자는 화면에 들어올 때 세므로(use-count-up) 한 줄 답이 위에 생긴 뒤 노트북 높이에서는 줄이 첫 화면 아래 — 보이게 한 뒤 끝 상태를 잼
    const got = await pageSnap(page);
    const fresh = await freshSnap(page, "USD");
    expect(got).toEqual(fresh);
    expect(got.priceLink).toBe("/prices?currency=USD");
    expect(got.amount, "입력이 그 통화 기본 금액").toBe(fresh.amount);
  });

  test("다시 JPY 로(왼 · 오른쪽 방향이 바뀜) — 두 번째 전환도 같은 순서 · 끝 상태 = 새로 불러온 JPY · 칩 맨 앞은 JPY", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/currencies/JPY");
    await page.waitForTimeout(1200);
    await chip(page, "USD").click();
    await settle(page, "USD", 4500);
    await chip(page, "JPY").click();
    await settle(page, "JPY", 4500);
    await avgIntoView(page); // 작업 0351 (위와 같은 이유)
    expect(await pageSnap(page)).toEqual(await freshSnap(page, "JPY"));
    expect(await tid(page, "chip").evaluateAll((els) => els.sort((a, b) => a.getBoundingClientRect().x - b.getBoundingClientRect().x)[0].getAttribute("data-code"))).toBe("JPY");
    await expect(tid(page, "currency-chips").locator('a[aria-current="page"]')).toHaveAttribute("data-code", "JPY");
  });

  test("처음 들어옴 · 새로 고침은 전환이 아님 — 날아가는 국기 없음 · 글자판 굴러감 없음 · 스크롤 이동 없음", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.addInitScript(() => {
      const w = window as unknown as { __flyN: number; __mvN: number; __ys: number[] };
      w.__flyN = 0; w.__mvN = 0; w.__ys = [];
      document.addEventListener("DOMContentLoaded", () => { const tick = () => { w.__flyN += document.querySelectorAll('[data-testid="flag-fly"]').length; w.__mvN += document.querySelectorAll('[data-testid="converter"] [data-moving="true"]').length; w.__ys.push(scrollY); requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
    });
    await page.goto("/currencies/USD");
    await page.waitForTimeout(2500);
    await page.reload();
    await page.waitForTimeout(2500);
    const r = await page.evaluate(() => { const w = window as unknown as { __flyN: number; __mvN: number; __ys: number[] }; return { fly: w.__flyN, mv: w.__mvN, dy: Math.max(...w.__ys) - Math.min(...w.__ys) }; });
    expect(r.fly, "날아가는 국기").toBe(0);
    expect(r.mv, "글자판 굴러감").toBe(0);
    expect(r.dy, "스크롤 이동").toBeLessThanOrEqual(2);
    expect(await pageSnap(page)).toEqual(await freshSnap(page, "USD"));
  });

  test("움직임 줄이기 — 사이드바에서 고르면 국기 · 카운트업 · 글자판 · 칩 밀림 없이 바로 최종(주소 · 값 · 칩 · 목록 표시)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/currencies/JPY");
    await page.waitForTimeout(800);
    await startRec(page);
    await page.waitForTimeout(100);
    await openSide(page);
    await listLink(page, "USD").click();
    await expect(page).toHaveURL(/\/currencies\/USD\/?$/, { timeout: 4000 });
    await page.waitForTimeout(1200);
    const fr = await stopRec(page);
    expect(fr.filter((f) => f.fly).length, "날아가는 국기").toBe(0);
    expect(Math.max(...fr.map((f) => f.moving)), "굴러가는 칸").toBe(0);
    await expect(tid(page, "currency-sidebar"), "사이드바가 닫힘").toBeHidden();
    await avgIntoView(page);
    expect(await pageSnap(page)).toEqual(await freshSnap(page, "USD"));
    await expect(listLink(page, "USD")).toHaveAttribute("aria-current", "page");
    expect(await tid(page, "chip").first().getAttribute("data-code")).toBe("USD");
  });

  test("가로 넘침 0 · 콘솔 오류 없음 — 전환 앞뒤 (1280 · 390)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/currencies/JPY");
    await page.waitForTimeout(800);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), "전환 전").toBeLessThanOrEqual(1);
    await chip(page, "USD").click();
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), "전환 중").toBeLessThanOrEqual(1);
    await settle(page, "USD", 3500);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), "전환 뒤").toBeLessThanOrEqual(1);
    void isPhone;
    expect(errors).toEqual([]);
  });
});

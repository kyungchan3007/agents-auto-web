// 작업 0217 미리보기 뒤 고칠 것 1~3 — 테스트 먼저 (request.md 맨 아래 '미리보기 뒤 고칠 것')
//   1 · 2 (작업 0380 에 hero 새 모양 기준으로 다시 씀): 노트북 높이에서도 첫 화면 안에 hero 의 한 줄 · 입력창 · 작은 줄 · 칩이 들어옴 · 가로 넘침 0
//   3 환전   : 환전 목록이 화면에 들어오면 카드가 위에서부터 차례로 나타남 + 금액 카운트업 · 동그라미 이동이 같이 시작 · 한 번만 · 움직임 줄이기면 처음부터 최종 값
//   표시(기존): "home-hero" · "dest-list" · "dest-row" · "dest-rate"(data-final) · "dest-dot"(data-position)
import { type Page, expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";

test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
});

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhoneProject = (page: Page) => page.context().browser() !== null && (page.viewportSize()?.width ?? 0) < 640 && test.info().project.name === "휴대폰";

// ── 1 · 2 첫 화면 (작업 0380 · hero 새 모양) ───────────────────────────────────────
// 옛 검사(설명 문장 ↔ 탑승권 카드 간격 · 카드 안판 · 97% 줄이 첫 화면 안 · 휴대폰 위 여백 48px)는 hero 가 글 왼쪽 · 탑승권 오른쪽 · 높이 약 560px 로 바뀌어 맞지 않음.
// 모양 · 위치 · 크기는 새 테스트 없음(작업 종류 ②) — 여기서는 첫 화면에 hero 의 글 · 입력창 · 칩이 들어오고 가로로 넘치지 않는지만 본다.
//   표시: hero-lede · hero-sub · hero-search(입력창) · hero-chip(칩 넷) — 자세한 문구는 home-guide.spec.ts
const SCREENS = [
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1920, 950],
  [2560, 1440],
] as const;

test.describe("홈 첫 화면 — hero 글 · 입력창 · 칩이 첫 화면 안 · 가로 넘침 0", () => {
  for (const [width, height] of SCREENS) {
    test(`${width}×${height} — 한 줄 · 입력창 · 작은 줄 · 칩 아래 끝이 화면 높이 안 · 가로 넘침 0 · 큰 제목이 남아 있음`, async ({ page }) => {
      test.skip(isPhoneProject(page), "뷰포트를 직접 정하므로 넓은 화면 프로젝트에서만");
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      expect(await page.evaluate(() => window.scrollY), "스크롤 전 첫 화면").toBe(0);
      const bottom = async (loc: ReturnType<typeof tid>, name: string) => {
        const b = await loc.first().boundingBox();
        if (!b) throw new Error(`${name} 가 화면에 없음`);
        return b.y + b.height;
      };
      expect(await bottom(tid(page, "hero-lede"), "한 줄"), "한 줄 아래 끝").toBeLessThanOrEqual(height);
      expect(await bottom(tid(page, "hero-search"), "입력창"), "입력창 아래 끝").toBeLessThanOrEqual(height);
      expect(await bottom(tid(page, "hero-sub"), "작은 줄"), "작은 줄 아래 끝").toBeLessThanOrEqual(height);
      expect(await bottom(tid(page, "hero-chip").last(), "마지막 칩"), "마지막 칩 아래 끝").toBeLessThanOrEqual(height);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "가로 넘침").toBeLessThanOrEqual(0);
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();
      expect(await h1.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)), "큰 제목 글자 크기").toBeGreaterThanOrEqual(40);
    });
  }

  test("휴대폰 390 — 높이가 달라도 가로 넘침 0 · 큰 제목 · 입력창이 화면 폭 안", async ({ page }) => {
    test.skip(isPhoneProject(page), "뷰포트를 직접 정하므로 넓은 화면 프로젝트에서만");
    for (const height of [568, 667, 844, 1200]) {
      await page.setViewportSize({ width: 390, height });
      await page.goto("/");
      await page.waitForTimeout(300);
      const m = await page.evaluate(() => {
        const input = document.querySelector('[data-testid="hero-search"]') as HTMLElement;
        const r = input.getBoundingClientRect();
        return { right: r.right, left: r.left, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      expect(m.overflow, `${height} 가로 넘침`).toBeLessThanOrEqual(0);
      expect(m.left, `${height} 입력창 왼쪽`).toBeGreaterThanOrEqual(0);
      expect(m.right, `${height} 입력창 오른쪽`).toBeLessThanOrEqual(390);
    }
  });
});

// ── 3 환전 카드가 차례로 나타남 ─────────────────────────────────────────────────
// 줄(dest-row)의 실제 보임 정도 = 그 줄과 목록 사이 조상들의 opacity 곱 (카드 틀 · 줄 어느 쪽에 걸어도 같게 잼)
const RECORD = `
  (() => {
    const w = window;
    w.__frames = [];
    const rows = [...document.querySelectorAll('[data-testid="dest-row"]')];
    const eff = (el) => {
      let o = 1;
      for (let e = el; e && e !== document.body; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity);
      return o;
    };
    const t0 = performance.now();
    const tick = () => {
      w.__frames.push({
        t: performance.now() - t0,
        rows: rows.map((r) => {
          const rate = r.querySelector('[data-testid="dest-rate"]');
          const dot = r.querySelector('[data-testid="dest-dot"]');
          return { op: eff(r), text: rate ? rate.textContent : null, dotX: dot ? dot.getBoundingClientRect().x : null };
        }),
      });
      w.__raf = requestAnimationFrame(tick);
    };
    tick();
  })()
`;
type Frame = { t: number; rows: { op: number; text: string | null; dotX: number | null }[] };

async function openHome(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
}
const scrollListTo = (page: Page, top: number) =>
  page.evaluate((top) => {
    const el = document.querySelector('[data-testid="dest-list"]') as HTMLElement;
    window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - top);
  }, top);
const frames = (page: Page) => page.evaluate(() => (window as unknown as { __frames: Frame[] }).__frames);
const finals = (page: Page) => tid(page, "dest-rate").evaluateAll((els) => els.map((e) => e.getAttribute("data-final")));

test.describe("도착지별 환전 타이밍 — 카드가 위에서부터 차례로 나타남 (움직임 켜짐)", () => {
  test("목록이 화면에 들어오기 전에는 모든 카드가 투명 (보이지 않음)", async ({ page }) => {
    await openHome(page);
    // 목록 위 끝이 화면 아래 끝에서 40px 밖 — 아직 안 들어옴
    await scrollListTo(page, (page.viewportSize()?.height ?? 800) + 40);
    await page.waitForTimeout(1200);
    const ops = await tid(page, "dest-row").evaluateAll((rows) =>
      rows.map((r) => {
        let o = 1;
        for (let e: Element | null = r; e && e !== document.body; e = e.parentElement) o *= Number.parseFloat(getComputedStyle(e).opacity);
        return o;
      }),
    );
    expect(ops.length).toBeGreaterThanOrEqual(4);
    for (const [i, o] of ops.entries()) expect(o, `${i + 1}번째 카드가 들어오기 전에 이미 보임 (opacity ${o})`).toBeLessThan(0.05);
  });

  test("들어오면 앞 카드가 먼저 · 약 70ms 간격으로 차례로 보이고, 금액 카운트업(중간값 → 오늘 값) · 동그라미(가운데 → 오늘 자리)가 그 카드가 나타날 때 같이 시작", async ({ page }) => {
    if (!isPhoneProject(page)) await page.setViewportSize({ width: 1280, height: 1600 }); // 줄이 한 번에 여럿 들어오도록
    await openHome(page);
    await scrollListTo(page, (page.viewportSize()?.height ?? 800) + 40);
    await page.waitForTimeout(300);
    const finalTexts = await finals(page);
    await page.evaluate(RECORD);
    await page.waitForTimeout(200);
    await scrollListTo(page, 80); // 목록이 화면 안으로
    await page.waitForTimeout(3500);
    const fr = await frames(page);
    // 지금 화면 안에 들어온 줄만 (아래로 더 내려가야 나타나는 줄은 제외)
    const inView = await tid(page, "dest-row").evaluateAll((rows) => rows.map((r) => r.getBoundingClientRect().top < window.innerHeight - 40));
    const idx = inView.flatMap((v, i) => (v ? [i] : []));
    expect(idx.length, "화면 안에 들어온 줄 수").toBeGreaterThanOrEqual(isPhoneProject(page) ? 2 : 3); // 작업 0228: 접힌(알약) 카드는 문서가 짧아 스크롤이 아래 끝에서 멈춰 휴대폰에서는 펼친 뒤 보이는 줄이 2개일 수 있음
    const firstSeen = idx.map((i) => fr.find((f) => f.rows[i].op > 0.05)?.t);
    for (const [k, t] of firstSeen.entries()) expect(t, `${idx[k] + 1}번째 카드가 끝내 안 나타남`).toBeDefined();
    const ts = firstSeen as number[];
    // 위에서부터 차례로 (앞 카드가 먼저, 뒤 카드는 같거나 늦게)
    for (let k = 1; k < ts.length; k++) expect(ts[k], `${idx[k] + 1}번째가 ${idx[k - 1] + 1}번째보다 먼저 나타남`).toBeGreaterThanOrEqual(ts[k - 1]);
    // 간격: 평균 40~250ms (스크롤 프레임 오차를 넓게 잡음 — 설계 80~120ms)
    const avg = (ts[ts.length - 1] - ts[0]) / (ts.length - 1);
    expect(avg, `카드 사이 평균 간격 ${avg.toFixed(0)}ms`).toBeGreaterThanOrEqual(40);
    expect(avg, `카드 사이 평균 간격 ${avg.toFixed(0)}ms`).toBeLessThanOrEqual(250);
    // 서서히: 첫 카드가 투명에서 완전히 보이기까지 프레임을 거침 (0.05 → 0.95 사이 중간 값이 있었음)
    const mid = fr.some((f) => f.rows[idx[0]].op > 0.1 && f.rows[idx[0]].op < 0.9);
    expect(mid, "첫 카드가 서서히 나타남(중간 투명도 프레임)").toBe(true);
    // 카운트업 · 동그라미가 그 카드가 나타날 때 같이 시작: 처음 보이는 프레임에서는 아직 최종 값이 아님
    // 작업 0228: 금액은 90일 중간값에서 오늘 값으로 — 중간값(data-start)이 있는 줄만 나타나는 순간 최종 값이 아님 (없는 예전 응답은 카운트업 없이 오늘 값)
    const startAttrs = await tid(page, "dest-rate").evaluateAll((els) => els.map((e) => e.closest('[data-testid="dest-row"]') && e.getAttribute("data-start")));
    let rateIdx = -1;
    const rateOfRow = await tid(page, "dest-row").evaluateAll((rows) => rows.map((r) => !!r.querySelector('[data-testid="dest-rate"]')));
    for (const [k, i] of idx.entries()) {
      if (rateOfRow[i]) rateIdx++;
      if (!rateOfRow[i] || startAttrs[rateIdx] === null) continue;
      const f = fr.find((x) => x.t === ts[k])!;
      expect(f.rows[i].text, `${i + 1}번째 카드: 나타나는 순간 이미 최종 값`).not.toBe(finalTexts[i]);
    }
    const dotRows = await tid(page, "dest-dot").evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-position"))));
    const rowOfDot = await tid(page, "dest-row").evaluateAll((rows) => rows.map((r) => !!r.querySelector('[data-testid="dest-dot"]')));
    let checkedDots = 0;
    let dotIdx = -1;
    for (const [i, has] of rowOfDot.entries()) {
      if (!has) continue;
      dotIdx++;
      if (!idx.includes(i) || Math.abs(dotRows[dotIdx] - 0.5) < 0.15) continue; // 작업 0228: 동그라미는 가운데 선에서 출발 — 가운데에서 먼 줄만 눈에 띄게 움직임
      const k = idx.indexOf(i);
      const startFrame = fr.find((x) => x.t === ts[k])!;
      const endX = fr[fr.length - 1].rows[i].dotX!;
      expect(Math.abs(startFrame.rows[i].dotX! - endX), `${i + 1}번째 카드: 나타나는 순간 동그라미가 이미 제자리`).toBeGreaterThan(0.5);
      checkedDots++;
    }
    // 도착지가 모두 싼 쪽(위치 0.3 미만 · 2026-11-19 운영 자료 0 · 0.03 · 0.02 · 0.1)이면 눈에 띄게 움직일 동그라미가 없음 — 자료 때문에 못 재는 것이라 실패가 아니라 건너뜀 (작업 0226 gate 실패 확인)
    test.skip(checkedDots === 0, "움직임을 잴 만한 동그라미(위치 0.3 이상)가 있는 줄이 없음 — 자료");
  });

  test("끝나면 모든 카드가 완전히 보이고 · 금액 = 최종 값 · 동그라미 = 제자리(±1px)", async ({ page }) => {
    if (!isPhoneProject(page)) await page.setViewportSize({ width: 1280, height: 1600 });
    await openHome(page);
    await scrollListTo(page, 80);
    await page.waitForTimeout(3500);
    const rows = await tid(page, "dest-row").evaluateAll((els) =>
      els.map((r) => {
        let o = 1;
        for (let e: Element | null = r; e && e !== document.body; e = e.parentElement) o *= Number.parseFloat(getComputedStyle(e).opacity);
        const rate = r.querySelector('[data-testid="dest-rate"]');
        const dot = r.querySelector('[data-testid="dest-dot"]') as HTMLElement | null;
        const track = dot?.parentElement?.getBoundingClientRect();
        const d = dot?.getBoundingClientRect();
        return {
          op: o,
          text: rate?.textContent ?? null,
          final: rate?.getAttribute("data-final") ?? null,
          off: dot && track && d ? Math.abs(d.x + d.width / 2 - (track.x + track.width * Number(dot.getAttribute("data-position")))) : 0,
        };
      }),
    );
    for (const [i, r] of rows.entries()) {
      if (r.final === null) continue;
      expect(r.op, `${i + 1}번째 카드 투명도`).toBeGreaterThanOrEqual(0.99);
    }
    // 화면 밖(아래) 줄은 아직 안 나타났을 수 있으므로 화면 안 줄만 금액 · 동그라미 확인
    const inView = await tid(page, "dest-row").evaluateAll((els) => els.map((r) => r.getBoundingClientRect().top < window.innerHeight));
    for (const [i, r] of rows.entries()) {
      if (!inView[i] || r.final === null) continue;
      expect(r.text, `${i + 1}번째 금액`).toBe(r.final);
      expect(r.off, `${i + 1}번째 동그라미가 제자리에서 벗어난 거리`).toBeLessThanOrEqual(1);
    }
  });

  test("한 번만 — 다시 위로 올라갔다 내려와도 다시 숨거나 카운트업하지 않음", async ({ page }) => {
    if (!isPhoneProject(page)) await page.setViewportSize({ width: 1280, height: 1600 });
    await openHome(page);
    await scrollListTo(page, 80);
    await page.waitForTimeout(3500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.evaluate(RECORD);
    await scrollListTo(page, 80);
    await page.waitForTimeout(1500);
    const fr = await frames(page);
    const finalTexts = await finals(page);
    const inView = await tid(page, "dest-row").evaluateAll((els) => els.map((r) => r.getBoundingClientRect().top < window.innerHeight));
    for (const f of fr)
      for (const [i, r] of f.rows.entries()) {
        if (!inView[i]) continue;
        expect(r.op, `${i + 1}번째 카드가 다시 숨음 (t=${f.t.toFixed(0)}ms)`).toBeGreaterThanOrEqual(0.99);
        expect(r.text, `${i + 1}번째 금액이 다시 카운트업함 (t=${f.t.toFixed(0)}ms)`).toBe(finalTexts[i]);
      }
  });
});

test.describe("도착지별 환전 타이밍 — 움직임 줄이기 · 자바스크립트 꺼짐", () => {
  test("움직임 줄이기 — 처음부터 모든 카드가 보이고 · 금액 최종 값 · 동그라미 제자리 (깜빡임 · 카운트업 없음)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (!isPhoneProject(page)) await page.setViewportSize({ width: 1280, height: 1600 });
    await openHome(page);
    await page.evaluate(RECORD);
    await scrollListTo(page, 80);
    await page.waitForTimeout(1500);
    const fr = await frames(page);
    const finalTexts = await finals(page);
    expect(fr.length).toBeGreaterThan(10);
    for (const f of fr)
      for (const [i, r] of f.rows.entries()) {
        expect(r.op, `${i + 1}번째 카드가 처음부터 보이지 않음 (t=${f.t.toFixed(0)}ms)`).toBeGreaterThanOrEqual(0.99);
        if (finalTexts[i] !== null) expect(r.text, `${i + 1}번째 금액이 처음부터 최종 값이 아님 (t=${f.t.toFixed(0)}ms)`).toBe(finalTexts[i]);
      }
    // 동그라미는 끝까지 같은 자리 (움직이지 않음)
    for (const i of fr[0].rows.keys()) {
      const xs = fr.map((f) => f.rows[i].dotX).filter((x): x is number => x !== null);
      if (xs.length === 0) continue;
      // 스크롤로 화면 위치가 변하는 동안을 빼고, 스크롤이 끝난 뒤 프레임들만 비교
      const tail = xs.slice(-20);
      expect(Math.max(...tail) - Math.min(...tail), `${i + 1}번째 동그라미가 움직임`).toBeLessThanOrEqual(0.5);
    }
  });

  test("자바스크립트를 꺼도 카드가 처음부터 보임 (내용이 먼저 — 투명으로 시작하지 않음)", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await forceDefaultHero(page);
    await page.goto("/");
    const ops = await tid(page, "dest-row").evaluateAll((rows) =>
      rows.map((r) => {
        let o = 1;
        for (let e: Element | null = r; e && e !== document.body; e = e.parentElement) o *= Number.parseFloat(getComputedStyle(e).opacity);
        return o;
      }),
    );
    expect(ops.length).toBeGreaterThanOrEqual(4);
    for (const [i, o] of ops.entries()) expect(o, `${i + 1}번째 카드 (JS 꺼짐)`).toBeGreaterThanOrEqual(0.99);
    await ctx.close();
  });
});

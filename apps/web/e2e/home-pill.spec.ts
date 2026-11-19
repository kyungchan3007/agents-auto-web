// 작업 0228 모션 13번(요약 알약 펼치기) — 홈 '도착지별 환전 타이밍' e2e · 테스트 먼저
//   기준: 스크린샷 .tmp/lead-motion-1119/01-home-13.png · 참고 구현 .tmp/motion-pages/m-home.src.js · m-home.css · 원본 시안 .tmp/motion-1119/today2/index.html
//   DOM 계약
//     카드 [data-testid="dest-list"] 에 data-state="pill"(알약으로 접힘) | "expanding"(펼치는 중) | "final"(끝 · 지금 운영 카드와 같은 모양) — 서버 첫 그림 · 움직임 줄이기는 처음부터 "final" (속성이 없어도 됨 = final 로 봄)
//     알약 [data-testid="dest-pill"] — 카드 안 · pill 일 때와 expanding 동안에만 있음 · final 이면 없음(DOM 에서 빠짐)
//       국기 [data-testid="dest-pill-flag"] — 도착지(dest-row) 수만큼 · 글 [data-testid="dest-pill-text"] = "도착지 N곳 중 M곳이 최근 90일 중 싼 편" (N = dest-row 수 · M = 신호가 싼 편(하위 30% 이하 · 줄의 상태 글이 '… · 쌈')인 줄 수)
//     pill 일 때 카드: 높이 = 알약 높이(줄은 투명 · 가려짐) · 모서리 = 알약 반지름(높이의 절반) · expanding 동안 높이 → 끝 높이 · 모서리 → 24px
//     줄 기존 testid 그대로: dest-row · dest-rate(data-final · 시작이 중간값이면 data-start = 90일 중간값 숫자) · dest-dot(data-position) · dest-status · dest-flag · dest-city · dest-scale
//     시간(스크롤로 카드 윗부분이 들어온 때부터): 높이 약 0.46초 · 줄 0.07초 간격 · 점은 가운데 → 오늘 자리 0.62초 · 금액은 중간값 → 오늘 값 같은 시간 · 신호 글은 점이 도착한 뒤 · 전체 약 1초(끝은 1.9초 안)
//   끝 상태 = reduced-motion(= 지금 운영) 로 연 같은 쪽의 카드와 같음 — 높이 · 모서리 · 줄 글 · 줄 위치
//   빌드 시점 값만 씀 — 줄이 없는 환경에서는 건너뜀(줄은 지금 화면에도 있음 · 알약이 없어서 건너뛰지 않음)
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;

/** 카드의 매 프레임 모습을 모음 — 창 안에서 requestAnimationFrame 으로 */
const RECORD = `
  (() => {
    const w = window;
    w.__fr = []; w.__stopRec = false; w.__t0 = performance.now();
    const eff = (el, stop) => { let o = 1; for (let e = el; e && e !== stop; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
    const tick = () => {
      const card = document.querySelector('[data-testid="dest-list"]');
      if (card) {
        const cr = card.getBoundingClientRect();
        const pill = card.querySelector('[data-testid="dest-pill"]');
        w.__fr.push({
          t: performance.now() - w.__t0, state: card.getAttribute("data-state"), h: cr.height, radius: parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0,
          pill: pill ? eff(pill, document.body) : null,
          rows: [...card.querySelectorAll('[data-testid="dest-row"]')].map((r) => {
            const rate = r.querySelector('[data-testid="dest-rate"]'), dot = r.querySelector('[data-testid="dest-dot"]'), st = r.querySelector('[data-testid="dest-status"]');
            const track = dot && dot.parentElement ? dot.parentElement.getBoundingClientRect() : null;
            const d = dot ? dot.getBoundingClientRect() : null;
            return { op: eff(r, document.body), text: rate ? rate.textContent : null, dotC: d ? d.x + d.width / 2 : null, trackX: track ? track.x : null, trackW: track ? track.width : null, st: st ? eff(st, document.body) : null };
          }),
        });
      }
      if (!w.__stopRec) requestAnimationFrame(tick);
    };
    tick();
  })()
`;
type Row = { op: number; text: string | null; dotC: number | null; trackX: number | null; trackW: number | null; st: number | null };
type Frame = { t: number; state: string | null; h: number; radius: number; pill: number | null; rows: Row[] };
const startRec = (page: Page) => page.evaluate(RECORD);
const stopRec = (page: Page) => page.evaluate(() => { const w = window as unknown as { __fr: unknown[]; __stopRec: boolean }; w.__stopRec = true; return w.__fr; }) as Promise<Frame[]>;

async function openHome(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
}
/** 카드 위 끝이 화면 위에서 frac 만큼 내려온 자리에 오게 스크롤 */
const scrollCardTo = (page: Page, frac: number) =>
  page.evaluate((frac) => {
    const el = document.querySelector('[data-testid="dest-list"]') as HTMLElement;
    window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - window.innerHeight * frac);
  }, frac);
const cardTop = (page: Page) => page.evaluate(() => (document.querySelector('[data-testid="dest-list"]') as HTMLElement).getBoundingClientRect().top);
const hasRows = async (page: Page) => (await tid(page, "dest-row").count()) >= 2;
/** 카드 모습 한 장 — 끝 상태 비교용 */
const snapshot = (page: Page) =>
  page.evaluate(() => {
    const card = document.querySelector('[data-testid="dest-list"]') as HTMLElement;
    const cr = card.getBoundingClientRect();
    return {
      h: cr.height, w: cr.width, radius: getComputedStyle(card).borderTopLeftRadius, pills: card.querySelectorAll('[data-testid="dest-pill"]').length,
      styleAttr: card.getAttribute("style") ?? "",
      rows: [...card.querySelectorAll('[data-testid="dest-row"]')].map((r) => {
        const b = r.getBoundingClientRect();
        const dot = r.querySelector('[data-testid="dest-dot"]') as HTMLElement | null;
        const track = dot?.parentElement?.getBoundingClientRect();
        return {
          city: r.querySelector('[data-testid="dest-city"]')?.textContent?.trim() ?? "", text: r.querySelector('[data-testid="dest-rate"]')?.textContent?.trim() ?? "",
          status: r.querySelector('[data-testid="dest-status"]')?.textContent?.trim() ?? "", top: b.top - cr.top, h: b.height,
          dotOff: dot && track ? Math.abs(dot.getBoundingClientRect().x + dot.getBoundingClientRect().width / 2 - (track.x + track.width * Number(dot.getAttribute("data-position")))) : 0,
          opacity: (() => { let o = 1; for (let e: Element | null = r; e && e !== document.body; e = e.parentElement) o *= Number.parseFloat(getComputedStyle(e).opacity); return o; })(),
        };
      }),
    };
  });
/** 줄 안 '쌈' 상태 글의 수 = 알약의 M */
const cheapRows = (page: Page) => tid(page, "dest-status").evaluateAll((els) => els.filter((e) => /· 쌈$/.test((e.textContent ?? "").trim())).length);

test.describe("홈 도착지 카드 — 요약 알약 → 펼침 (작업 0228 · 모션 13번)", () => {
  test("카드가 화면 아래에 있으면 알약으로 접혀 있음 — 국기들 + '도착지 N곳 중 M곳이 최근 90일 중 싼 편' · M 은 줄의 '쌈' 수 · 줄은 안 보임", async ({ page }) => {
    if (!isPhone(page)) await page.setViewportSize({ width: 1280, height: 720 });
    await openHome(page);
    test.skip(!(await hasRows(page)), "도착지 자료 없음");
    expect(await cardTop(page), "준비: 카드가 아직 화면 아래").toBeGreaterThan((page.viewportSize()?.height ?? 800) * 0.95);
    await page.waitForTimeout(800);
    await expect(tid(page, "dest-list")).toHaveAttribute("data-state", "pill");
    const pill = tid(page, "dest-pill");
    await expect(pill).toHaveCount(1);
    const n = await tid(page, "dest-row").count();
    await expect(tid(page, "dest-pill-flag")).toHaveCount(n);
    const m = await cheapRows(page);
    await expect(tid(page, "dest-pill-text")).toHaveText(`도착지 ${n}곳 중 ${m}곳이 최근 90일 중 싼 편`);
    // 카드 높이 = 알약 높이 · 모서리 = 알약 반지름 · 줄은 안 보임
    const s = await snapshot(page);
    const pillBox = (await pill.boundingBox())!;
    expect(s.h, "알약 높이").toBeLessThanOrEqual(isPhone(page) ? 110 : 100);
    expect(s.h, "알약 높이").toBeGreaterThanOrEqual(40);
    expect(Math.abs(s.h - pillBox.height), "카드 높이 ≈ 알약 높이").toBeLessThanOrEqual(16);
    expect(Number.parseFloat(s.radius), "알약 모서리").toBeGreaterThanOrEqual(s.h / 2 - 2);
    for (const r of s.rows) expect(r.opacity, `${r.city} 줄이 알약 상태에서 보임`).toBeLessThan(0.05);
    // 글 · 국기는 알약 안 · 가로 넘침 0
    const card = (await tid(page, "dest-list").boundingBox())!;
    const textBox = (await tid(page, "dest-pill-text").boundingBox())!;
    expect(textBox.x).toBeGreaterThanOrEqual(card.x - 1);
    expect(textBox.x + textBox.width, "알약 글이 카드 밖").toBeLessThanOrEqual(card.x + card.width + 1);
    expect(textBox.y + textBox.height, "알약 글이 카드 아래로 나감").toBeLessThanOrEqual(card.y + card.height + 1);
    for (let i = 0; i < n; i++) {
      const f = (await tid(page, "dest-pill-flag").nth(i).boundingBox())!;
      expect(f.x + f.width, `국기 ${i + 1} 이 카드 밖`).toBeLessThanOrEqual(card.x + card.width + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), "가로 넘침").toBeLessThanOrEqual(1);
  });

  test("카드 윗부분이 들어오면 바로 펼침 — 반응 0.5초 안 · 높이 서서히(알약 → 끝) · 모서리 알약 → 24px · 끝은 1.9초 안 · 너무 빨리 끝나지 않음(0.7초 이상)", async ({ page }) => {
    if (!isPhone(page)) await page.setViewportSize({ width: 1280, height: 720 });
    await openHome(page);
    test.skip(!(await hasRows(page)), "도착지 자료 없음");
    await expect(tid(page, "dest-list")).toHaveAttribute("data-state", "pill");
    const pillH = (await snapshot(page)).h;
    await startRec(page);
    await page.waitForTimeout(150);
    const tScroll = await page.evaluate(() => performance.now() - (window as unknown as { __t0: number }).__t0);
    await scrollCardTo(page, 0.5);
    await page.waitForTimeout(2600);
    const fr = await stopRec(page);
    await expect(tid(page, "dest-list")).toHaveAttribute("data-state", "final");
    const finalH = fr[fr.length - 1].h;
    expect(finalH, "끝 높이가 알약보다 큼").toBeGreaterThan(pillH + 150);
    const after = fr.filter((f) => f.t >= tScroll);
    const startedAt = after.find((f) => f.h > pillH + 3)?.t;
    expect(startedAt, "펼침이 시작되지 않음").toBeDefined();
    expect(startedAt! - tScroll, "스크롤에서 펼침 시작까지(ms)").toBeLessThanOrEqual(500);
    const doneAt = after.find((f) => f.h >= finalH - 1 && f.state === "final")?.t;
    expect(doneAt, "펼침이 끝나지 않음").toBeDefined();
    expect(doneAt! - tScroll, "스크롤에서 끝까지(ms)").toBeLessThanOrEqual(1900);
    expect(doneAt! - tScroll, "너무 빨리 끝남(ms)").toBeGreaterThanOrEqual(700);
    // 높이는 서서히 — 중간 프레임이 여러 장 · 줄어들지 않음
    const mid = after.filter((f) => f.h > pillH + 8 && f.h < finalH - 8);
    expect(mid.length, "중간 높이 프레임 수").toBeGreaterThanOrEqual(4);
    for (let i = 1; i < after.length; i++) expect(after[i].h, `높이가 줄어듦 (t=${after[i].t.toFixed(0)})`).toBeGreaterThanOrEqual(after[i - 1].h - 1);
    // 모서리: 처음 알약 반지름 → 끝 24px
    expect(fr[0].radius, "처음 모서리").toBeGreaterThanOrEqual(pillH / 2 - 2);
    expect(fr[fr.length - 1].radius, "끝 모서리").toBeCloseTo(24, 0);
    expect(mid.some((f) => f.radius > 25 && f.radius < pillH / 2 - 1), "모서리가 중간 값을 거침").toBe(true);
    // 알약 글은 펼치는 동안 사라지고 끝에는 DOM 에서 빠짐
    expect(fr[fr.length - 1].pill, "끝에 알약이 남음").toBeNull();
  });

  test("줄이 0.07초 간격으로 차례로 · 점은 가운데 → 오늘 자리(0.62초) · 금액은 같은 시간에 같이 · 신호 글은 점이 도착한 뒤 마지막", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.setViewportSize({ width: 1280, height: 720 }); // 줄 모두를 한 화면에 — 휴대폰 프로젝트도 같은 폭으로 시간만 검사
    await openHome(page);
    test.skip(!(await hasRows(page)), "도착지 자료 없음");
    await expect(tid(page, "dest-list")).toHaveAttribute("data-state", "pill");
    await startRec(page);
    await page.waitForTimeout(150);
    await scrollCardTo(page, 0.1);
    await page.waitForTimeout(2800);
    const fr = await stopRec(page);
    const n = fr[0].rows.length;
    const first = (i: number) => fr.find((f) => f.rows[i].op > 0.05)?.t;
    const seen = Array.from({ length: n }, (_, i) => first(i));
    for (const [i, t] of seen.entries()) expect(t, `${i + 1}번째 줄이 끝내 안 나타남`).toBeDefined();
    const ts = seen as number[];
    for (let i = 1; i < n; i++) expect(ts[i], `${i + 1}번째가 ${i}번째보다 먼저 나타남`).toBeGreaterThanOrEqual(ts[i - 1]);
    const avg = (ts[n - 1] - ts[0]) / (n - 1);
    expect(avg, `줄 사이 평균 간격 ${avg.toFixed(0)}ms (설계 70ms)`).toBeGreaterThanOrEqual(35);
    expect(avg, `줄 사이 평균 간격 ${avg.toFixed(0)}ms (설계 70ms)`).toBeLessThanOrEqual(130);
    const finals = await tid(page, "dest-rate").evaluateAll((els) => els.map((e) => e.getAttribute("data-final")));
    const dotIdx: number[] = [];
    for (let i = 0; i < n; i++) if (fr[0].rows[i].dotC !== null) dotIdx.push(i);
    expect(dotIdx.length, "점이 있는 줄").toBeGreaterThanOrEqual(1);
    let checkedDot = 0;
    for (const i of dotIdx) {
      const lastRow = fr[fr.length - 1].rows[i];
      const centerX = lastRow.trackX! + lastRow.trackW! / 2;
      const finalX = lastRow.dotC!;
      const atShow = fr.find((f) => f.t === ts[i])!.rows[i];
      // 나타날 때 점은 가운데 선 근처 (트랙 폭의 8% 안)
      expect(Math.abs(atShow.dotC! - centerX) / lastRow.trackW!, `${i + 1}번째 줄: 나타날 때 점이 가운데에서 먼 자리`).toBeLessThanOrEqual(0.08);
      const arriveAt = fr.find((f) => f.t > ts[i] && Math.abs(f.rows[i].dotC! - finalX) <= 1)?.t;
      expect(arriveAt, `${i + 1}번째 줄 점이 도착하지 않음`).toBeDefined();
      if (Math.abs(finalX - centerX) / lastRow.trackW! > 0.15) {
        checkedDot++;
        const dur = arriveAt! - ts[i];
        expect(dur, `${i + 1}번째 줄 점 이동 시간 ${dur.toFixed(0)}ms (설계 620ms)`).toBeGreaterThanOrEqual(380);
        expect(dur, `${i + 1}번째 줄 점 이동 시간 ${dur.toFixed(0)}ms (설계 620ms)`).toBeLessThanOrEqual(1000);
      }
      // 금액: 같은 시간에 최종 값에 도착 (점 도착 ±200ms) · 나타날 때는 아직 최종 값 아님(카운트업 시작 값이 있는 줄)
      const textArrive = fr.find((f) => f.t > ts[i] && f.rows[i].text === finals[i])?.t;
      expect(textArrive, `${i + 1}번째 줄 금액이 최종 값에 도착하지 않음`).toBeDefined();
      expect(Math.abs(textArrive! - arriveAt!), `${i + 1}번째 줄 금액 · 점 도착 시각 차(ms)`).toBeLessThanOrEqual(220);
      // 신호 글은 마지막 — 점이 도착한 뒤(−60ms) 보이기 시작
      const stShown = fr.find((f) => f.rows[i].st !== null && f.rows[i].st! > 0.05 && f.t >= ts[i])?.t;
      if (stShown !== undefined) expect(stShown, `${i + 1}번째 줄 신호 글이 점 도착보다 먼저 나옴`).toBeGreaterThanOrEqual(arriveAt! - 60);
    }
    expect(checkedDot, "점 이동 시간을 잰 줄 수(가운데에서 먼 줄)").toBeGreaterThanOrEqual(1);
  });

  test("금액은 90일 중간값 → 오늘 값 카운트업 — 중간값이 있는 줄은 data-start · 시작 방향이 점 위치와 맞음(싼 쪽이면 중간값이 더 큼) · 멈추면 최종 값", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await openHome(page);
    test.skip(!(await hasRows(page)), "도착지 자료 없음");
    const info = await tid(page, "dest-row").evaluateAll((rows) =>
      rows.map((r) => ({ start: r.querySelector('[data-testid="dest-rate"]')?.getAttribute("data-start") ?? null, final: r.querySelector('[data-testid="dest-rate"]')?.getAttribute("data-final") ?? null, pos: r.querySelector('[data-testid="dest-dot"]')?.getAttribute("data-position") ?? null })),
    );
    const withStart = info.filter((x) => x.start !== null);
    expect(withStart.length, "중간값(data-start)이 있는 줄 — 중간값을 모두 못 구하면 카운트업이 없는 것").toBeGreaterThanOrEqual(1);
    for (const x of withStart) {
      const start = Number(x.start);
      const final = Number((x.final ?? "").replace(/[^\d.]/g, ""));
      expect(Number.isFinite(start) && start > 0, `시작 값 ${x.start}`).toBe(true);
      expect(Math.abs(start - final) / final, "시작 값이 오늘 값과 너무 다름(±50%)").toBeLessThan(0.5);
      if (x.pos !== null && Math.abs(Number(x.pos) - 0.5) > 0.05) {
        // 점이 싼 쪽(왼쪽 · 0.5 보다 작음)이면 오늘 값이 중간값보다 낮음 → 시작(중간값) > 최종
        expect((start - final) * (Number(x.pos) - 0.5), `점 위치 ${x.pos} 와 중간값 ${start} → 오늘 ${final} 방향이 어긋남`).toBeLessThanOrEqual(0);
      }
    }
    // 재생: 시작 프레임 값이 중간값 근처 · 단조 · 끝 최종
    await expect(tid(page, "dest-list")).toHaveAttribute("data-state", "pill");
    await startRec(page);
    await page.waitForTimeout(100);
    await scrollCardTo(page, 0.1);
    await page.waitForTimeout(2800);
    const fr = await stopRec(page);
    const num = (t: string | null) => Number((t ?? "").replace(/[^\d.]/g, ""));
    for (const [i, x] of info.entries()) {
      if (x.start === null) continue;
      const seq = fr.filter((f) => f.rows[i].op > 0.02).map((f) => num(f.rows[i].text));
      expect(seq.length, `${i + 1}번째 줄 표본`).toBeGreaterThan(5);
      const dir = Math.sign(num(x.final) - Number(x.start));
      for (let k = 1; k < seq.length; k++) expect((seq[k] - seq[k - 1]) * dir, `${i + 1}번째 줄 금액이 거꾸로 감 (${seq[k - 1]} → ${seq[k]})`).toBeGreaterThanOrEqual(-0.051);
      expect(Math.abs(seq[0] - Number(x.start)) / Math.abs(Number(x.start)), `${i + 1}번째 줄 시작 값 ${seq[0]} 가 중간값 ${x.start} 와 다름`).toBeLessThan(0.05);
      expect(fr[fr.length - 1].rows[i].text).toBe(x.final);
    }
  });

  test("끝 상태 = 지금 운영 카드 — 움직임 줄이기로 연 같은 쪽의 카드와 높이 · 모서리 · 줄 글 · 줄 위치가 같고 · 알약 · 인라인 높이 · 투명이 남지 않음", async ({ page, browser, baseURL }) => {
    if (!isPhone(page)) await page.setViewportSize({ width: 1280, height: 720 });
    await openHome(page);
    test.skip(!(await hasRows(page)), "도착지 자료 없음");
    await scrollCardTo(page, 0.1);
    await page.waitForTimeout(2800);
    const got = await snapshot(page);
    const vp = page.viewportSize()!;
    const ctx = await browser.newContext({ viewport: vp, reducedMotion: "reduce", baseURL, storageState: { cookies: [], origins: [{ origin: new URL(baseURL ?? "http://127.0.0.1:4399").origin, localStorage: [{ name: "flapfx:intro-off", value: "1" }] }] } });
    const ref = await ctx.newPage();
    await ref.goto("/");
    await ref.waitForLoadState("networkidle");
    await ref.waitForTimeout(400);
    const base = await snapshot(ref);
    await ctx.close();
    expect(got.pills, "끝에 알약이 남음").toBe(0);
    expect(got.styleAttr, "끝에 인라인 높이 · overflow 가 남음").not.toMatch(/height|overflow|border-radius/);
    expect(Math.abs(got.h - base.h), `카드 높이 ${got.h} ≠ 운영 ${base.h}`).toBeLessThanOrEqual(1);
    expect(got.radius).toBe(base.radius);
    expect(Number.parseFloat(got.radius)).toBeCloseTo(24, 0);
    expect(got.rows.length).toBe(base.rows.length);
    for (const [i, r] of got.rows.entries()) {
      expect(r.city).toBe(base.rows[i].city);
      expect(r.text, `${r.city} 금액`).toBe(base.rows[i].text);
      expect(r.status, `${r.city} 상태 글`).toBe(base.rows[i].status);
      expect(Math.abs(r.top - base.rows[i].top), `${r.city} 줄 위치`).toBeLessThanOrEqual(1);
      expect(Math.abs(r.h - base.rows[i].h), `${r.city} 줄 높이`).toBeLessThanOrEqual(1);
      expect(r.opacity, `${r.city} 투명도`).toBeGreaterThanOrEqual(0.99);
      expect(r.dotOff, `${r.city} 점이 제자리에서 벗어남`).toBeLessThanOrEqual(1);
    }
  });

  test("한 번만 — 끝난 뒤 위로 올라갔다 다시 와도 알약으로 접히지 않음 · 가로 넘침 0", async ({ page }) => {
    if (!isPhone(page)) await page.setViewportSize({ width: 1280, height: 720 });
    await openHome(page);
    test.skip(!(await hasRows(page)), "도착지 자료 없음");
    await scrollCardTo(page, 0.1);
    await page.waitForTimeout(2800);
    const h0 = (await snapshot(page)).h;
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    await startRec(page);
    await scrollCardTo(page, 0.1);
    await page.waitForTimeout(1500);
    const fr = await stopRec(page);
    for (const f of fr) {
      expect(f.state === "final" || f.state === null, `다시 접힘 (state ${f.state}, t=${f.t.toFixed(0)})`).toBe(true);
      expect(Math.abs(f.h - h0), "높이가 바뀜").toBeLessThanOrEqual(1);
      expect(f.pill).toBeNull();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), "가로 넘침").toBeLessThanOrEqual(1);
  });

  test("처음 화면에서 이미 카드가 보이면 알약에 멈추지 않고 바로 펼침 — 알약 상태가 0.4초를 넘지 않음 · 끝은 같은 모양", async ({ page }) => {
    await page.setViewportSize({ width: isPhone(page) ? 412 : 1280, height: 4200 });
    await page.addInitScript(RECORD.replace("(() => {", "document.addEventListener('DOMContentLoaded', () => {").replace(/\}\)\(\)\s*$/, "});"));
    await page.goto("/");
    test.skip(!(await hasRows(page)), "도착지 자료 없음");
    expect(await cardTop(page), "준비: 카드가 처음부터 보임").toBeLessThan(4200 * 0.9);
    await page.waitForTimeout(3500);
    const fr = await stopRec(page);
    expect(fr.length).toBeGreaterThan(20);
    const pillFrames = fr.filter((f) => f.state === "pill");
    if (pillFrames.length > 0) expect(pillFrames[pillFrames.length - 1].t - pillFrames[0].t, "알약 상태로 머문 시간(ms)").toBeLessThanOrEqual(400);
    await expect(tid(page, "dest-list")).toHaveAttribute("data-state", "final");
    expect((await snapshot(page)).pills).toBe(0);
  });

  test("움직임 줄이기 — 알약 없이 처음부터 최종 카드 (높이 · 줄 · 금액 · 점 그대로, 접힘 · 투명 없음)", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    if (!isPhone(page)) await page.setViewportSize({ width: 1280, height: 720 });
    await openHome(page);
    test.skip(!(await hasRows(page)), "도착지 자료 없음");
    await startRec(page);
    await scrollCardTo(page, 0.5);
    await page.waitForTimeout(1500);
    const fr = await stopRec(page);
    expect(fr.length).toBeGreaterThan(10);
    const h = fr[fr.length - 1].h;
    for (const f of fr) {
      expect(f.pill, "알약이 나타남").toBeNull();
      expect(f.state === "final" || f.state === null, `state ${f.state}`).toBe(true);
      expect(Math.abs(f.h - h), `높이가 변함 (t=${f.t.toFixed(0)})`).toBeLessThanOrEqual(1);
      for (const [i, r] of f.rows.entries()) expect(r.op, `${i + 1}번째 줄이 처음부터 안 보임`).toBeGreaterThanOrEqual(0.99);
    }
    await expect(tid(page, "dest-pill")).toHaveCount(0);
    const finals = await tid(page, "dest-rate").evaluateAll((els) => els.map((e) => e.getAttribute("data-final")));
    for (const f of fr) for (const [i, r] of f.rows.entries()) if (finals[i]) expect(r.text, `${i + 1}번째 금액 (t=${f.t.toFixed(0)})`).toBe(finals[i]);
  });

  test("자바스크립트를 꺼도 처음부터 최종 카드 — 알약 없음 · 줄이 보임", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/");
    test.skip(!(await hasRows(page)), "도착지 자료 없음");
    await expect(tid(page, "dest-pill")).toHaveCount(0);
    const s = await snapshot(page);
    expect(s.h).toBeGreaterThan(200);
    for (const r of s.rows) expect(r.opacity, `${r.city} (JS 꺼짐)`).toBeGreaterThanOrEqual(0.99);
    await ctx.close();
  });

  test("콘솔 오류 없음 · 알약 → 펼침 동안 가로 넘침 없음", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    if (!isPhone(page)) await page.setViewportSize({ width: 1280, height: 720 });
    await openHome(page);
    test.skip(!(await hasRows(page)), "도착지 자료 없음");
    await page.evaluate(() => { (window as unknown as { __ov: number }).__ov = 0; const t = () => { const w = window as unknown as { __ov: number; __ovStop?: boolean }; w.__ov = Math.max(w.__ov, document.documentElement.scrollWidth - window.innerWidth); if (!w.__ovStop) requestAnimationFrame(t); }; t(); });
    await scrollCardTo(page, 0.3);
    await page.waitForTimeout(2200);
    const ov = await page.evaluate(() => { (window as unknown as { __ovStop: boolean }).__ovStop = true; return (window as unknown as { __ov: number }).__ov; });
    expect(ov, "펼치는 동안 가로 넘침").toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
});

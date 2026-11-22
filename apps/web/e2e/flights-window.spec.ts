// 작업 0229 모션 1번(창밖으로 넘어가는 12달) — 여행 타이밍 /flights 새 구역 e2e · 테스트 먼저
//   기준: 스크린샷 .tmp/lead-motion-1119/02-flights-1.png · 참고 구현 .tmp/motion-pages/m-flights.js · 원본 시안 .tmp/motion-1119/window2/index.html
//   위치: hero(flights-hero) 바로 아래 새 구역 — hero.nextElementSibling = [data-testid="window-section"] · 그 다음이 작업 0234 의 항공권 출발일 달력(airfare-section) · 그 아래가 기존 flights-back · 날개 그림 없음
//   DOM 계약
//     window-section 안: 작은 제목 "창밖으로 보는 12달" · h2 "계절이 바뀌는 동안 항공료 지수도 오르내립니다" · 글 "1월부터 12월까지 같은 달의 국제항공료 지수를 창밖 계절과 함께 봅니다."
//     창 [data-testid="window-view"] role="img" aria-label="비행기 창밖 풍경. N월, 계절 · 한마디" · data-state="closed|opening|open" (서버 그림 · JS 꺼짐 · 움직임 줄이기는 처음부터 open 이어도 됨)
//       덮개 [data-testid="window-shade"] — 창 안을 덮는 층 · 열릴 때 transform 으로 위로 올라감 (덮은 비율 = 덮개 상자와 창 상자가 겹친 세로 길이 ÷ 창 높이 · 닫힘 1 → 열림 0 · 투명도로 가리는 방식 아님)
//         서버가 그린 첫 그림부터 닫힘(CSS @media (scripting: enabled) and (prefers-reduced-motion: no-preference) 안에서만 · JS 꺼짐 · 움직임 줄이기는 열린 모양)
//     오른쪽(휴대폰은 아래): 글자판 [data-testid="window-flap"] 글 "11월"(aria-hidden · 한 자리 달은 "1월") · [data-testid="window-season"] "가을" + 작은 글 "늦가을 · 건초" · [data-testid="window-tag"] ("N월 가장 쌈" · "N월 가장 비쌈" · 그 밖 달은 글 없음)
//       라벨 "이 달의 국제항공료 지수" · "국제항공료 지수 · 같은 달 평균" · 큰 숫자 [data-testid="window-value"] data-final="119.8" (소수 한 자리 · 달이 바뀌면 약 0.4초 카운트업 뒤 data-final 과 같은 글) · "2020년 = 100" · 비교 글 [data-testid="window-cmp"]
//       달 고르기 [data-testid="window-band"] role="group" aria-label="달 고르기" 안에 [data-testid="window-month"] 버튼(값이 있는 달마다) data-month=1~12 data-value="119.8" aria-pressed aria-label="N월 · 지수 119.8" · [data-testid="window-replay"] 버튼 "↻ 다시 보기" · [data-testid="window-note"] 설명 글
//   값: 홈 12달 막대와 같은 계산(같은 달 평균) — 가장 싼 달 · 가장 비싼 달 · 높낮이 순서가 홈과 같음 (단위 테스트가 값 · 문구를 확인: lib/window-months.test.ts)
//   움직임: 처음부터 닫힌 채 시작 → 화면에 보이면 바로(0.6초 안) 올라감 · 닫히는 모습은 보이면 안 됨(다른 페이지에서 클라이언트 이동으로 와도) · '다시 보기'를 누를 때만 닫혔다 열림 → 1월부터 12월까지 지나 가장 싼 달에서 멈춤
//   자료 없음(지수를 못 받음)이면 구역이 없음 · 건너뜀(자료 조건) — 구현이 없어서 건너뛰지 않음(hero 의 flights-ticket 은 지금 화면에도 있음)
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const SEASONS = [["겨울", "깊은 눈"], ["겨울", "녹는 눈"], ["봄", "새싹"], ["봄", "벚꽃"], ["봄", "신록 · 꽃밭"], ["여름", "물 댄 논"], ["여름", "장마 비"], ["여름", "한여름 뭉게구름"], ["가을", "익는 들"], ["가을", "단풍"], ["가을", "늦가을 · 건초"], ["겨울", "첫눈 · 불 켜진 집"]];

/** 덮은 비율 · 상태 · 글자판 글을 매 프레임 모음 (다른 페이지에서 클라이언트 이동으로 와도 이어서 모음) */
const RECORD = `
  (() => {
    const w = window; w.__wf = []; w.__wstop = false; w.__wt0 = performance.now();
    const tick = () => {
      const v = document.querySelector('[data-testid="window-view"]'), s = document.querySelector('[data-testid="window-shade"]');
      if (v && s) {
        const a = v.getBoundingClientRect(), b = s.getBoundingClientRect();
        const cover = a.height > 0 ? Math.max(0, Math.min(1, (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) / a.height)) : null;
        const f = document.querySelector('[data-testid="window-flap"]');
        w.__wf.push({ t: performance.now() - w.__wt0, cover, state: v.getAttribute("data-state"), flap: f ? f.textContent.trim() : null, top: a.top, h: a.height, vh: window.innerHeight });
      }
      if (!w.__wstop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  })()
`;
type Fr = { t: number; cover: number | null; state: string | null; flap: string | null; top: number; h: number; vh: number };
const startRec = (page: Page) => page.evaluate(RECORD);
const stopRec = (page: Page) => page.evaluate(() => { const w = window as unknown as { __wf: unknown[]; __wstop: boolean }; w.__wstop = true; return w.__wf; }) as Promise<Fr[]>;
const INIT = RECORD.replace("(() => {", "document.addEventListener('DOMContentLoaded', () => {").replace(/\}\)\(\)\s*$/, "});");
const visible = (f: Fr) => f.h > 0 && f.top < f.vh && f.top + f.h > 0;

const ready = async (page: Page) => {
  await page.goto("/flights");
  return (await tid(page, "window-section").count()) > 0 || (await tid(page, "flights-ticket").count()) > 0;
};
const months = async (page: Page) =>
  tid(page, "window-month").evaluateAll((els) => els.map((e) => ({ m: Number(e.getAttribute("data-month")), v: e.getAttribute("data-value") ?? "" })));
const extremes = (ms: { m: number; v: string }[]) => {
  let low = ms[0], high = ms[0];
  for (const x of ms) { if (Number(x.v) < Number(low.v)) low = x; if (Number(x.v) >= Number(high.v)) high = x; }
  return { low: low.m, high: high.m };
};
const scrollToWindow = (page: Page, frac: number) =>
  page.evaluate((f) => { const el = document.querySelector('[data-testid="window-view"]') as HTMLElement; window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - window.innerHeight * f); }, frac);
const waitOpen = (page: Page, ms = 6000) => expect.poll(async () => tid(page, "window-view").getAttribute("data-state"), { timeout: ms }).toBe("open");

test.describe("여행 타이밍 — 창밖으로 보는 12달 (작업 0229 · 모션 1번)", () => {
  test("hero 바로 아래 새 구역 · 문구 · 요소 · 날개 그림 없음 · hero 그대로", async ({ page }) => {
    await page.goto("/flights");
    await expect(tid(page, "window-section"), "새 구역").toHaveCount(1);
    const order = await page.evaluate(() => { const h = document.querySelector('[data-testid="flights-hero"]'); return [h?.nextElementSibling?.getAttribute("data-testid") ?? null, h?.nextElementSibling?.nextElementSibling?.getAttribute("data-testid") ?? null]; });
    expect(order, "hero 바로 아래가 새 구역 · 그 다음이 작업 0234 의 항공권 출발일 달력").toEqual(["window-section", "airfare-section"]);
    const back = await page.evaluate(() => { const a = document.querySelector('[data-testid="airfare-section"]'); return a?.nextElementSibling?.getAttribute("data-testid") ?? null; });
    expect(back, "달력 바로 아래는 기존 표 뒤 구간(flights-back)").toBe("flights-back");
    const sec = tid(page, "window-section");
    for (const t of ["창밖으로 보는 12달", "계절이 바뀌는 동안 항공료 지수도 오르내립니다", "1월부터 12월까지 같은 달의 국제항공료 지수를 창밖 계절과 함께 봅니다.", "이 달의 국제항공료 지수", "국제항공료 지수 · 같은 달 평균", "2020년 = 100", "↻ 다시 보기"]) await expect(sec, t).toContainText(t);
    await expect(sec.getByRole("heading", { level: 2 })).toHaveText("계절이 바뀌는 동안 항공료 지수도 오르내립니다");
    await expect(tid(page, "window-band")).toHaveAttribute("role", "group");
    await expect(tid(page, "window-band")).toHaveAttribute("aria-label", "달 고르기");
    await expect(tid(page, "window-note")).toContainText("통계청 국제항공료 지수 같은 달 평균");
    await expect(tid(page, "window-note")).toContainText("실제 요금이 아니며");
    await expect(tid(page, "window-replay")).toHaveText("↻ 다시 보기");
    // 날개 그림 없음 (사용자가 뺌)
    expect(await sec.evaluate((el) => ({ txt: /날개|wing/i.test(el.textContent ?? ""), el: el.querySelectorAll('[data-testid*="wing"], [aria-label*="날개"], [alt*="날개"], [class*="wing"]').length }))).toEqual({ txt: false, el: 0 });
    // hero 그대로
    await expect(tid(page, "flights-hero").getByRole("heading", { level: 1 })).toBeVisible();
    await expect(tid(page, "hero-board")).toHaveCount(1);
    expect(await tid(page, "window-month").count(), "값이 있는 달").toBeGreaterThanOrEqual(2);
  });

  test("지수 = 홈 12달 막대와 같은 값 — 가장 싼 달 · 가장 비싼 달 · 달 수 · 높낮이 순서가 홈과 같고, 값은 소수 한 자리", async ({ page }) => {
    test.skip(!(await ready(page)), "지수 자료 없음");
    const ms = await months(page);
    for (const x of ms) expect(x.v, `${x.m}월 값`).toMatch(/^\d+\.\d$/);
    const { low, high } = extremes(ms);
    await page.goto("/");
    test.skip((await tid(page, "year-bar").count()) === 0, "홈 12달 막대 없음");
    const home = await tid(page, "year-bar").evaluateAll((els) => els.map((e) => ({ m: Number(e.getAttribute("data-month")), tone: e.getAttribute("data-tone"), h: (e.querySelector("rect") ?? e).getBoundingClientRect().height })));
    const withData = home.filter((b) => b.tone !== "none");
    expect(ms.map((x) => x.m), "값이 있는 달이 홈과 같음").toEqual(withData.map((b) => b.m));
    expect(home.find((b) => b.tone === "low")?.m, "가장 싼 달 = 홈 노랑 막대").toBe(low);
    expect(home.find((b) => b.tone === "high")?.m, "가장 비싼 달 = 홈 빨강 막대").toBe(high);
    // 높낮이 순서: 값 순서와 홈 막대 높이 순서가 같음 (같은 값끼리는 제외)
    const byValue = [...ms].sort((a, b) => Number(a.v) - Number(b.v));
    for (let i = 1; i < byValue.length; i++) {
      if (Number(byValue[i].v) === Number(byValue[i - 1].v)) continue;
      const lo = home.find((b) => b.m === byValue[i - 1].m)!.h, hi = home.find((b) => b.m === byValue[i].m)!.h;
      expect(hi, `${byValue[i].m}월(${byValue[i].v}) 막대가 ${byValue[i - 1].m}월(${byValue[i - 1].v})보다 낮음`).toBeGreaterThanOrEqual(lo - 0.5);
    }
    // 홈의 말풍선 글과 같은 글 (작업 0276: '가장 저렴한 달' · '가장 비싼 달' — 달 이름은 글자판 · 눈금에 있음)
    await expect(page.locator("body")).toContainText("가장 저렴한 달");
    await expect(page.locator("body")).toContainText("가장 비싼 달");
  });

  test("달 고르기 — 글자판 · 계절 · 꼬리표 · 큰 숫자(카운트업 뒤 같은 값) · 비교 글 · 눌림 표시 · 창 설명이 함께 바뀜", async ({ page }) => {
    test.skip(!(await ready(page)), "지수 자료 없음");
    await waitOpen(page, 15000).catch(() => {});
    const ms = await months(page);
    const complete = ms.length === 12;
    const { low, high } = extremes(ms);
    const lowV = Number(ms.find((x) => x.m === low)!.v);
    const picks = [...new Set([ms[0].m, high, low, ms[Math.floor(ms.length / 2)].m, ms[ms.length - 1].m])];
    for (const m of picks) {
      await tid(page, "window-month").filter({ has: page.locator("xpath=.") }).and(page.locator(`[data-month="${m}"]`)).click();
      const v = ms.find((x) => x.m === m)!.v;
      const [season, desc] = SEASONS[m - 1];
      await expect(tid(page, "window-flap"), `${m}월 글자판`).toHaveText(`${m}월`, { timeout: 2000 });
      await expect(tid(page, "window-season")).toContainText(season);
      await expect(tid(page, "window-season")).toContainText(desc);
      await expect(tid(page, "window-value")).toHaveAttribute("data-final", v);
      await expect(tid(page, "window-value"), `${m}월 큰 숫자(카운트업 뒤)`).toHaveText(v, { timeout: 2000 });
      const tag = m === low ? "가장 저렴한 달" : m === high ? "가장 비싼 달" : "";
      await expect(tid(page, "window-tag")).toHaveText(tag);
      const diff = (Number(v) - lowV).toFixed(1);
      const span = complete ? "1년" : "받은 달";
      const cmp = m === low ? `${span === "1년" ? "1년 중" : "받은 달 중"} 가장 낮은 달` : m === high ? `${span === "1년" ? "1년 중" : "받은 달 중"} 가장 높은 달 · ${low}월보다 ${diff} 높음` : `${low}월보다 ${diff} 높음`;
      await expect(tid(page, "window-cmp")).toHaveText(cmp);
      const pressed = await tid(page, "window-month").evaluateAll((els) => els.filter((e) => e.getAttribute("aria-pressed") === "true").map((e) => Number(e.getAttribute("data-month"))));
      expect(pressed, `${m}월 눌림 표시`).toEqual([m]);
      await expect(tid(page, "window-view")).toHaveAttribute("aria-label", `비행기 창밖 풍경. ${m}월, ${season} · ${desc}`);
      await expect(tid(page, "window-month").and(page.locator(`[data-month="${m}"]`))).toHaveAttribute("aria-label", `${m}월 · 지수 ${v}`);
    }
  });

  test("서버가 그린 첫 그림부터 닫힘 — 높은 창에서 처음 프레임 덮개 가득 · 올라가기만 하고 다시 닫히지 않음 · 열린 뒤 data-state open", async ({ page }) => {
    await page.setViewportSize({ width: isPhone(page) ? 412 : 1280, height: 4200 });
    await page.addInitScript(INIT);
    await page.goto("/flights");
    test.skip((await tid(page, "window-section").count()) === 0 && (await tid(page, "flights-ticket").count()) === 0, "지수 자료 없음");
    await page.waitForTimeout(4000);
    const fr = (await stopRec(page)).filter((f) => f.cover !== null && visible(f));
    expect(fr.length, "표본").toBeGreaterThan(20);
    expect(fr[0].cover!, "첫 프레임 덮개").toBeGreaterThanOrEqual(0.95);
    expect(fr[0].state, "첫 프레임 상태").toBe("closed");
    for (let i = 1; i < fr.length; i++) expect(fr[i].cover!, `덮개가 다시 내려옴 (t=${fr[i].t.toFixed(0)}ms)`).toBeLessThanOrEqual(fr[i - 1].cover! + 0.02);
    expect(fr[fr.length - 1].cover!, "열린 뒤 덮개").toBeLessThanOrEqual(0.05);
    const openedAt = fr.find((f) => f.cover! < 0.9)?.t;
    expect(openedAt, "올라가기 시작하지 않음").toBeDefined();
    expect(fr.find((f) => f.cover! <= 0.05)?.t, "다 열리는 시각").toBeDefined();
    await expect(tid(page, "window-view")).toHaveAttribute("data-state", "open");
  });

  test("화면 아래에 있다가 보이면 바로 올라감 — 올라오기 전에는 닫힌 채 · 보이면 0.6초 안에 올라가기 시작 · 1.8초 안에 열림 · 다시 닫히지 않음", async ({ page }) => {
    if (!isPhone(page)) await page.setViewportSize({ width: 1280, height: 720 });
    test.skip(!(await ready(page)), "지수 자료 없음");
    await page.waitForTimeout(800);
    expect(await tid(page, "window-view").getAttribute("data-state"), "보이기 전 상태").toBe("closed");
    await startRec(page);
    await page.waitForTimeout(200);
    const t0 = await page.evaluate(() => performance.now() - (window as unknown as { __wt0: number }).__wt0);
    await scrollToWindow(page, 0.3);
    await page.waitForTimeout(3500);
    const fr = (await stopRec(page)).filter((f) => f.cover !== null);
    const before = fr.filter((f) => f.t < t0 - 20);
    for (const f of before) expect(f.cover!, "보이기 전 덮개").toBeGreaterThanOrEqual(0.95);
    const after = fr.filter((f) => f.t >= t0 && visible(f));
    expect(after[0].cover!, "보이는 첫 프레임 덮개").toBeGreaterThanOrEqual(0.9);
    const start = after.find((f) => f.cover! < 0.9)?.t;
    expect(start, "올라가기 시작하지 않음").toBeDefined();
    expect(start! - t0, "보인 뒤 올라가기 시작까지(ms)").toBeLessThanOrEqual(600);
    const done = after.find((f) => f.cover! <= 0.05)?.t;
    expect(done, "다 열리지 않음").toBeDefined();
    expect(done! - t0, "보인 뒤 열릴 때까지(ms)").toBeLessThanOrEqual(1800);
    for (let i = 1; i < after.length; i++) expect(after[i].cover!, `덮개가 다시 내려옴 (t=${after[i].t.toFixed(0)}ms)`).toBeLessThanOrEqual(after[i - 1].cover! + 0.02);
  });

  test("다른 페이지(홈)에서 클라이언트 이동으로 와도 닫히는 모습이 보이지 않음 — 창이 처음 나타나는 프레임부터 닫힘 · 올라가기만", async ({ page }) => {
    await page.setViewportSize({ width: isPhone(page) ? 412 : 1280, height: isPhone(page) ? 3600 : 2600 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    test.skip((await tid(page, "year-link").count()) === 0, "홈 12달 구역 없음");
    await startRec(page);
    await page.evaluate(() => { (window as unknown as { __spa: number }).__spa = 1; });
    await tid(page, "year-link").click(); // 홈 12달의 '항공료 그래프 자세히 ›' = Next 링크 (클라이언트 이동 · 메뉴의 링크는 문서를 새로 불러옴)
    await expect(page).toHaveURL(/\/flights\/?$/);
    expect(await page.evaluate(() => (window as unknown as { __spa?: number }).__spa), "클라이언트 이동이 아니라 문서를 새로 불러옴").toBe(1);
    await expect(page.locator("main")).toBeVisible();
    test.skip((await tid(page, "flights-ticket").count()) === 0, "지수 자료 없음"); // 자료가 없을 때만 (새 구역이 없어서가 아님)
    await page.waitForTimeout(3500);
    const fr = (await stopRec(page)).filter((f) => f.cover !== null && visible(f));
    expect(fr.length, "창이 보인 프레임").toBeGreaterThan(10);
    expect(fr[0].cover!, "창이 처음 보이는 프레임 덮개(닫힌 채 시작)").toBeGreaterThanOrEqual(0.95);
    for (let i = 1; i < fr.length; i++) expect(fr[i].cover!, `덮개가 다시 내려옴 — 닫히는 모습이 보임 (t=${fr[i].t.toFixed(0)}ms)`).toBeLessThanOrEqual(fr[i - 1].cover! + 0.02);
    expect(fr[fr.length - 1].cover!, "열림").toBeLessThanOrEqual(0.05);
  });

  test("'다시 보기'만 닫혔다 열림 — 누르면 덮개가 내려오고 → 1월부터 12월까지 지나 → 가장 싼 달에서 멈춤", async ({ page }) => {
    test.setTimeout(90000);
    if (!isPhone(page)) await page.setViewportSize({ width: 1280, height: 900 });
    test.skip(!(await ready(page)), "지수 자료 없음");
    await scrollToWindow(page, 0.2);
    await waitOpen(page, 15000);
    await page.waitForTimeout(500);
    const ms = await months(page);
    const { low } = extremes(ms);
    await startRec(page);
    await page.waitForTimeout(400);
    const idle = (await page.evaluate(() => (window as unknown as { __wf: Fr[] }).__wf)) as Fr[];
    for (const f of idle) expect(f.cover!, "누르기 전에 덮개가 움직임").toBeLessThanOrEqual(0.05);
    await tid(page, "window-replay").click();
    await expect.poll(async () => tid(page, "window-view").getAttribute("data-state"), { timeout: 3000 }).not.toBe("open");
    await waitOpen(page, 45000);
    await expect(tid(page, "window-flap")).toHaveText(`${low}월`, { timeout: 5000 });
    await page.waitForTimeout(600);
    const fr = (await stopRec(page)).filter((f) => f.cover !== null);
    // 덮개: 내려와 가득(닫힘) → 올라가 열림
    const maxCover = Math.max(...fr.filter((f) => f.t > 400).map((f) => f.cover!));
    expect(maxCover, "다시 보기에서 덮개가 눈에 띄게 내려오지 않음(시안: 닫힘 260ms 뒤 바로 올라가 가득 닫히기 전에 열림)").toBeGreaterThanOrEqual(0.7);
    expect(fr[fr.length - 1].cover!).toBeLessThanOrEqual(0.05);
    // 글자판 달 순서: 1월 → … → 12월 → 가장 싼 달 (연속 같은 글은 한 번으로)
    const seen: number[] = [];
    for (const f of fr) { const m = Number((f.flap ?? "").replace("월", "")); if (Number.isFinite(m) && m !== seen[seen.length - 1]) seen.push(m); }
    const expected = [...ms.map((x) => x.m), ...(ms[ms.length - 1].m === low ? [] : [low])];
    // 처음(누르기 전)에 보이던 달은 앞에 붙을 수 있으니 1월(첫 달)부터 비교
    const from = seen.indexOf(ms[0].m, seen.length > expected.length ? 1 : 0);
    expect(seen.slice(Math.max(0, from)), "재생 순서(글자판 달)").toEqual(expected);
    await expect(tid(page, "window-tag")).toHaveText("가장 저렴한 달");
    const pressed = await tid(page, "window-month").evaluateAll((els) => els.filter((e) => e.getAttribute("aria-pressed") === "true").map((e) => Number(e.getAttribute("data-month"))));
    expect(pressed).toEqual([low]);
  });

  test("움직임 줄이기 — 처음부터 열림 · 덮개 안 내려옴 · 달 고르기 · 다시 보기는 바로 가장 싼 달", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: isPhone(page) ? 412 : 1280, height: 4200 });
    await page.addInitScript(INIT);
    await page.goto("/flights");
    test.skip((await tid(page, "window-section").count()) === 0 && (await tid(page, "flights-ticket").count()) === 0, "지수 자료 없음");
    await page.waitForTimeout(1500);
    const fr = (await stopRec(page)).filter((f) => f.cover !== null && visible(f));
    expect(fr.length).toBeGreaterThan(10);
    for (const f of fr) expect(f.cover!, `덮개 (t=${f.t.toFixed(0)})`).toBeLessThanOrEqual(0.05); // 눈에 보이는 덮개로 확인 — 서버 그림의 data-state 속성은 하이드레이션 전에 closed 여도 됨(보이는 모양은 CSS 로 열림)
    await expect(tid(page, "window-view")).toHaveAttribute("data-state", "open"); // 하이드레이션 뒤에는 open
    const ms = await months(page);
    const { low } = extremes(ms);
    const other = ms.find((x) => x.m !== low)!;
    await tid(page, "window-month").and(page.locator(`[data-month="${other.m}"]`)).click();
    await expect(tid(page, "window-flap")).toHaveText(`${other.m}월`, { timeout: 300 });
    await expect(tid(page, "window-value")).toHaveText(other.v, { timeout: 300 });
    await tid(page, "window-replay").click();
    await expect(tid(page, "window-flap")).toHaveText(`${low}월`, { timeout: 400 });
    expect(await tid(page, "window-view").getAttribute("data-state")).toBe("open");
    await expect(tid(page, "window-tag")).toHaveText("가장 저렴한 달");
  });

  test("자바스크립트를 꺼도 — 창이 열린 모양 · 값 · 달 버튼이 보임 (닫힌 채 안 남음)", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 1280, height: 3000 } });
    const page = await ctx.newPage();
    await page.goto("/flights");
    test.skip((await tid(page, "window-section").count()) === 0 && (await tid(page, "flights-ticket").count()) === 0, "지수 자료 없음");
    const info = await page.evaluate(() => {
      const v = document.querySelector('[data-testid="window-view"]'), s = document.querySelector('[data-testid="window-shade"]');
      if (!v || !s) return null;
      const a = v.getBoundingClientRect(), b = s.getBoundingClientRect();
      return { cover: Math.max(0, Math.min(1, (Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)) / a.height)), value: document.querySelector('[data-testid="window-value"]')?.textContent?.trim() ?? "", months: document.querySelectorAll('[data-testid="window-month"]').length };
    });
    expect(info, "새 구역").not.toBeNull();
    expect(info!.cover, "덮개").toBeLessThanOrEqual(0.05);
    expect(info!.value).toMatch(/^\d+\.\d$/);
    expect(info!.months).toBeGreaterThanOrEqual(2);
    await ctx.close();
  });

  test("배치 · 가로 넘침 0 · 콘솔 오류 없음 — 넓은 화면은 창이 왼쪽 · 휴대폰은 창이 위", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    test.skip(!(await ready(page)), "지수 자료 없음");
    await scrollToWindow(page, 0.2);
    await waitOpen(page, 15000).catch(() => {});
    const w = (await tid(page, "window-view").boundingBox())!;
    const flap = (await tid(page, "window-flap").boundingBox())!;
    const band = (await tid(page, "window-band").boundingBox())!;
    const vp = page.viewportSize()!;
    if (isPhone(page)) expect(w.y + w.height, "휴대폰: 창이 위 · 글자판이 아래").toBeLessThanOrEqual(flap.y + 1);
    else expect(w.x + w.width, "넓은 화면: 창이 왼쪽 · 글자판이 오른쪽").toBeLessThanOrEqual(flap.x + 1);
    for (const [name, b] of [["창", w], ["글자판", flap], ["달 막대", band]] as const) {
      expect(b.x, `${name} 왼쪽`).toBeGreaterThanOrEqual(-1);
      expect(b.x + b.width, `${name} 오른쪽`).toBeLessThanOrEqual(vp.width + 1);
    }
    const btns = await tid(page, "window-month").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, w: r.width }; }));
    for (const [i, b] of btns.entries()) { expect(b.l, `${i + 1}번째 달 버튼`).toBeGreaterThanOrEqual(-1); expect(b.r).toBeLessThanOrEqual(vp.width + 1); }
    await tid(page, "window-month").nth(2).click();
    await tid(page, "window-replay").click();
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), "가로 넘침").toBeLessThanOrEqual(1);
    expect(errors).toEqual([]);
  });
});

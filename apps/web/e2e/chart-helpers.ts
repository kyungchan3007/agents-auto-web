// 작업 0216 그래프 2D(시안 F) — 그래프 e2e 공용 도구 (페이지마다 같은 계약을 같은 방법으로 검사)
//
// ── DOM 계약 (선 그래프: 여행 타이밍 · 통화 1년 흐름 · 직구 수입물가) ──────────────────────────────
//   <svg data-testid="line-chart" role="img" aria-label=… data-state="idle|playing|done">
//     [data-testid="chart-grid"]            옅은 가로선 · 날짜 세로 점선        data-reveal 0~1
//     [data-testid="chart-axis"]            눈금 글(값 · 날짜)                    data-reveal 0~1
//     [data-testid="chart-series"][data-series=<id>]   선 하나(묶음)
//        [data-testid="chart-line"]         선(왼쪽부터 그려짐)                   data-reveal 0~1
//        [data-testid="chart-area"]         선 아래 그라데이션 면(없을 수 있음) — fill 이 url(#…) · 차오름  data-reveal 0~1
//     [data-testid="chart-mark"][data-kind="max|min"][data-series=<id>]  최고/최저 점 + 꼬리표(글 포함)  data-reveal 0~1
//     [data-testid="chart-end"][data-series=<id>]     끝 점 + 말풍선
//        [data-testid="chart-end-dot"]      끝 큰 점                               data-reveal 0~1
//        [data-testid="chart-end-bubble"]   말풍선(이름 + 큰 숫자)                  data-reveal 0~1
//        [data-testid="chart-end-value"]    큰 숫자 글 · data-final = 최종 글 · 카운트업   data-reveal 0~1
//   · data-reveal 은 그 부분이 지금 얼마나 나타났는지 0(안 보임)~1(최종). 움직임 줄이기 · 서버 첫 그림에서는 처음부터 "1"
//   · data-state: 화면에 들어오기 전 "idle" · 재생 중 "playing" · 끝나면 "done" (한 번만 · 다시 idle 로 안 돌아감)
//
// ── DOM 계약 (여행 물가 자 — /prices) ───────────────────────────────────────────────────────────────
//   [data-testid="ruler"]  role="img" · data-state          (안에)
//     [data-testid="ruler-bar"]      그라데이션 자 막대(뻗음)                        data-reveal
//     [data-testid="ruler-pin"][data-value=<숫자>]  나라 핀(국기 원 · 이름 · 숫자) data-reveal · 안에 [data-testid="ruler-pin-value"] 카운트업 data-final
//     [data-testid="ruler-korea-line"]  한국 100 세로선                             data-reveal
//     [data-testid="ruler-korea-tag"]   '한국 100' 노랑 꼬리표(국기 포함)           data-reveal
import { type Locator, type Page, expect } from "@playwright/test";

export const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);

/** 요소의 data-reveal 숫자 (없으면 NaN) */
export const reveal = async (loc: Locator): Promise<number> => Number(await loc.first().getAttribute("data-reveal"));

/** 그래프(또는 자) 위 끝이 화면 위 끝에 오도록 스크롤 — 메뉴 띠(sticky) 밑에 깔리지 않게 여유 100px */
export async function scrollTo(page: Page, loc: Locator, top = 100): Promise<void> {
  await loc.evaluate((el, top) => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - top), top);
}

/** 화면 아래 끝에서 40px 밖(아직 안 들어옴)으로 스크롤 — 그래프가 보이기 전 상태를 재려고 */
export async function scrollJustBelow(page: Page, loc: Locator): Promise<void> {
  const h = page.viewportSize()?.height ?? 800;
  await scrollTo(page, loc, h + 40);
}

export type Frame = { t: number; v: Record<string, number> };

/**
 * 지정한 선택자들의 data-reveal 을 프레임마다 기록 (key → CSS 선택자 · 첫 번째 요소) — 호출 뒤에 스크롤하면 그 뒤 움직임이 담김
 * 읽기: await stopRecording(page) → Frame[]
 */
export async function startRecording(page: Page, selectors: Record<string, string>): Promise<void> {
  await page.evaluate((sel) => {
    const w = window as unknown as { __rev: { t: number; v: Record<string, number> }[]; __raf: number };
    w.__rev = [];
    const t0 = performance.now();
    const tick = () => {
      const v: Record<string, number> = {};
      for (const [k, s] of Object.entries(sel)) {
        const el = document.querySelector(s);
        v[k] = el ? Number(el.getAttribute("data-reveal")) : Number.NaN;
      }
      w.__rev.push({ t: performance.now() - t0, v });
      w.__raf = requestAnimationFrame(tick);
    };
    tick();
  }, selectors);
}
export async function stopRecording(page: Page): Promise<Frame[]> {
  return page.evaluate(() => {
    const w = window as unknown as { __rev: Frame[]; __raf: number };
    cancelAnimationFrame(w.__raf);
    return w.__rev;
  });
}

/** 처음으로 value > eps 가 된 시각 (없으면 undefined) */
export const firstAbove = (fr: Frame[], key: string, eps = 0.05): number | undefined => fr.find((f) => f.v[key] > eps)?.t;
/** 처음으로 value ≥ 0.999 가 된 시각 */
export const firstDone = (fr: Frame[], key: string): number | undefined => fr.find((f) => f.v[key] >= 0.999)?.t;

/** 화면 안 · 가로 넘침 0 · (선택) 그래프 상자가 화면 가로 안 */
export async function expectInsideViewport(page: Page, loc: Locator, name: string): Promise<void> {
  const b = await loc.boundingBox();
  if (!b) throw new Error(`${name} 이(가) 화면에 없음`);
  const vw = page.viewportSize()?.width ?? 0;
  expect(b.x, `${name} 왼쪽`).toBeGreaterThanOrEqual(-1);
  expect(b.x + b.width, `${name} 오른쪽`).toBeLessThanOrEqual(vw + 1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow, "가로 넘침").toBeLessThanOrEqual(0);
}

/** 그래프 안 모든 글(말풍선 · 꼬리표 · 눈금)이 svg 상자 안 — 잘림 없음 */
export async function expectTextsInside(chart: Locator): Promise<void> {
  const out = await chart.evaluate((svg) => {
    const box = svg.getBoundingClientRect();
    const bad: string[] = [];
    for (const t of svg.querySelectorAll("text")) {
      const r = t.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.left < box.left - 1 || r.right > box.right + 1 || r.top < box.top - 1 || r.bottom > box.bottom + 1) bad.push(`${t.textContent} (${Math.round(r.left - box.left)},${Math.round(r.top - box.top)})`);
    }
    return bad;
  });
  expect(out, "svg 밖으로 나간 글").toEqual([]);
}

/** 선 그래프 공통 검사 — 최종 모양(끝난 뒤) */
export async function expectLineChartFinal(page: Page, chart: Locator, opts: { series: string[]; ends?: Record<string, string>; areas?: string[]; marks?: boolean }): Promise<void> {
  await expect(chart).toHaveAttribute("data-state", "done");
  expect(await reveal(chart.locator('[data-testid="chart-grid"]')), "눈금").toBe(1);
  expect(await reveal(chart.locator('[data-testid="chart-axis"]')), "눈금 글").toBe(1);
  for (const id of opts.series) {
    const s = chart.locator(`[data-testid="chart-series"][data-series="${id}"]`);
    await expect(s, `선 묶음 ${id}`).toHaveCount(1);
    expect(await reveal(s.locator('[data-testid="chart-line"]')), `${id} 선`).toBe(1);
    const end = chart.locator(`[data-testid="chart-end"][data-series="${id}"]`);
    await expect(end, `${id} 끝 말풍선`).toHaveCount(1);
    expect(await reveal(end.locator('[data-testid="chart-end-dot"]')), `${id} 끝 점`).toBe(1);
    expect(await reveal(end.locator('[data-testid="chart-end-bubble"]')), `${id} 말풍선`).toBe(1);
    const val = end.locator('[data-testid="chart-end-value"]');
    expect(await reveal(val), `${id} 카운트업`).toBe(1);
    // 끝나면 큰 숫자 = 최종 글 (실제 값) — 기대값을 주면 그 글과도 같음
    const final = await val.getAttribute("data-final");
    expect((await val.textContent())?.trim(), `${id} 큰 숫자가 최종 값`).toBe(final?.trim());
    if (opts.ends?.[id]) expect(final?.trim(), `${id} 끝 값`).toBe(opts.ends[id]);
  }
  for (const id of opts.areas ?? []) {
    const area = chart.locator(`[data-testid="chart-series"][data-series="${id}"] [data-testid="chart-area"]`);
    await expect(area, `${id} 그라데이션 면`).toHaveCount(1);
    expect(await area.getAttribute("fill"), `${id} 면 색`).toMatch(/^url\(#.+\)$/);
    expect(await reveal(area), `${id} 면 차오름`).toBe(1);
  }
  if (opts.marks) {
    const marks = chart.locator('[data-testid="chart-mark"]');
    expect(await marks.count(), "최고/최저 점").toBeGreaterThanOrEqual(2);
    for (let i = 0; i < (await marks.count()); i++) expect(await reveal(marks.nth(i)), `점 ${i + 1}`).toBe(1);
  }
}

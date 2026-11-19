// 작업 0230 모션 3번(스크롤로 떠나는 물가 노선) — 여행 물가 /prices e2e · 테스트 먼저
//   기준: 스크린샷 .tmp/lead-motion-1119/06-prices-3.png · 참고 구현 .tmp/motion-pages/m-prices.js · m-prices.css · 원본 시안 .tmp/motion-1119/scale/index.html
//   정적 자(제목 "한국보다 싼 곳 · 비슷한 곳 · 비싼 곳" + 자 그림) 자리에 노선 — 노선 바로 아래로 기존 세 칸 목록 → 나라 더 보기 → 자료 없어 뺀 나라 줄이 그대로
//   DOM 계약
//     [data-testid="route-section"] — 노선 전체(스크롤 길이를 만드는 긴 칸) · 안에 작은 제목 "한국 = 100" · h2[data-testid="route-title"] "스크롤로 떠나는 물가 노선" · 글 "내릴수록 싼 나라에서 한국을 지나 비싼 나라로 갑니다 · 올리면 거꾸로 돌아옵니다"
//       [data-testid="route-stage"] — 화면에 붙어 있는 판(position: sticky · top = 메뉴 띠 바로 아래 · 세로 가운데 아님) · 높이 = 화면 − 메뉴 · 구역 높이 = 판 높이 + (정거장 수 − 1) × 정거장 사이 스크롤(넓은 화면 36vh · 휴대폰 30vh)
//       (휴대폰은 정거장 단추를 숨김 · 시안과 같음) [data-testid="route-stops"] 안 [data-testid="route-stop"] 단추(정거장마다 · data-country · data-value · data-active="true"(지금 정거장) · 누르면 그 정거장으로 스크롤)
//       [data-testid="route-ruler"] — 자 · [data-testid="route-pin"](한국 뺀 정거장마다 · data-country · data-value · data-side up|down) · [data-testid="route-kr-tag"] 글 "한국 100 기준" · [data-testid="route-plane"](동그라미 말 · aria-hidden · 가운데 x = 지금 값의 자 위 위치 · data-dir="forward|back" 스크롤 방향)
//       [data-testid="route-card"] 카드(data-moving="true" 정거장 사이를 지나는 중 · 아니면 없음/false) 안 route-card-name · route-card-meta("정거장 N / M · 띠 이름") · route-card-value(물가 숫자 글) · route-card-pct("63% 쌉니다" · "기준") · route-card-budget("약 37,000원") · route-card-signal("환율 하위 0% · 쌈" 또는 "환율 없음") · route-next("다음 정거장 → 이름" · 지나는 중에만)
//     정거장 = 지금 자의 핀(구간마다 맨 위 두 나라 · 아래 세 칸 목록의 맨 위 줄들) + 한국, 값 오름차순(한국은 100) · 값 = 아래 목록의 "물가 N (한국 100)" 과 같음(지어내지 않음) · 단위 테스트가 계산을 확인(lib/price-route.test.ts)
//     움직임 줄이기 · JS 꺼짐 = 정적 노선: 판이 고정되지 않고(sticky 아님) 정거장 카드가 모두 보임(route-card 가 정거장 수만큼) · 자 · 핀도 보임
//     서버가 그린 첫 그림부터 긴 스크롤 모양(CSS @media (scripting: enabled) and (prefers-reduced-motion: no-preference))
//   예산 카드 아래 끝 → 노선 제목(h2) 위 끝 = 넓은 화면 140px · 휴대폰 100px (지금 운영 정적 자와 같음 · 화면 높이와 상관없이)
//   자료가 없어 정거장이 없으면 노선 없음 · 건너뜀(자료 조건) — 구현이 없어서 건너뛰지 않음(price-bands 는 지금 화면에도 있음)
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const GAP = { wide: 140, phone: 100 };
const BANDNAME: Record<string, string> = { cheap: "한국보다 싼 곳", mid: "비슷한 곳", base: "기준", exp: "한국보다 비싼 곳" };

const ready = async (page: Page, url = "/prices") => {
  await page.goto(url);
  return (await tid(page, "price-bands").count()) > 0;
};

type Pin = { name: string; value: number; pill: string | null };
/** 아래 세 칸 목록(필터 반영)의 구간마다 맨 위 두 줄 — 노선 정거장이 이 나라들이어야 함 */
async function listPins(page: Page): Promise<Pin[]> {
  const pins = await tid(page, "price-bands").locator("section").evaluateAll((secs) =>
    secs.flatMap((s) =>
      Array.from(s.querySelectorAll("li")).slice(0, 2).map((li) => {
        const t = (li as HTMLElement).innerText;
        const name = t.split("\n")[0].trim();
        const v = Number((t.match(/물가\s*(\d+)\s*\(한국 100\)/) ?? [])[1]);
        const pill = (t.match(/환율 [^\n]*·[^\n]*/) ?? [])[0] ?? null;
        return { name, value: v, pill };
      }),
    ),
  );
  return pins.sort((a, b) => a.value - b.value);
}
const expectedStops = (pins: Pin[]) => {
  const before = pins.filter((p) => p.value < 100);
  const after = pins.filter((p) => p.value >= 100);
  return [...before.map((p) => ({ ...p, kr: false })), { name: "한국", value: 100, pill: null, kr: true }, ...after.map((p) => ({ ...p, kr: false }))];
};
const stopsOf = (page: Page) => tid(page, "route-stop").evaluateAll((els) => els.map((e) => ({ country: e.getAttribute("data-country") ?? "", value: Number(e.getAttribute("data-value")), text: (e.textContent ?? "").trim(), active: e.getAttribute("data-active") === "true" })));

/** 진행률 p(0~1)로 스크롤 — 판이 메뉴 띠 아래에 붙은 뒤 구역 안에서 얼마나 내려왔는지 */
const goProgress = (page: Page, p: number) =>
  page.evaluate((p) => {
    document.documentElement.style.scrollBehavior = "auto";
    const sec = document.querySelector('[data-testid="route-section"]') as HTMLElement;
    const st = document.querySelector('[data-testid="route-stage"]') as HTMLElement;
    const nav = document.querySelector("header")!.getBoundingClientRect().bottom;
    const span = sec.getBoundingClientRect().height - st.getBoundingClientRect().height;
    window.scrollTo(0, window.scrollY + sec.getBoundingClientRect().top - (nav - p * span));
  }, p);
const settle = (page: Page, ms = 1100) => page.waitForTimeout(ms);
const text = async (page: Page, id: string) => ((await tid(page, id).first().innerText()) ?? "").replace(/\s+/g, " ").trim();

test.describe("여행 물가 — 스크롤로 떠나는 물가 노선 (작업 0230 · 모션 3번)", () => {
  test("정적 자 자리에 노선 — 바로 아래가 세 칸 목록 · 정적 자 제목 · 자 그림은 없어짐 · 문구", async ({ page }) => {
    test.skip(!(await ready(page)), "물가 자료 없음");
    await expect(tid(page, "route-section"), "노선").toHaveCount(1);
    const next = await page.evaluate(() => { const s = document.querySelector('[data-testid="route-section"]')!; const n = s.nextElementSibling; return { hasBands: !!n?.querySelector('[data-testid="price-bands"]'), top: s.getBoundingClientRect().bottom + scrollY, bandsTop: (document.querySelector('[data-testid="price-bands"]') as HTMLElement).getBoundingClientRect().top + scrollY }; });
    expect(next.hasBands, "노선 바로 다음 칸 안에 세 칸 목록").toBe(true);
    expect(next.bandsTop, "목록이 노선 아래").toBeGreaterThanOrEqual(next.top - 1);
    await expect(page.getByText("한국보다 싼 곳 · 비슷한 곳 · 비싼 곳", { exact: true })).toHaveCount(0);
    await expect(tid(page, "ruler")).toHaveCount(0);
    const sec = tid(page, "route-section");
    for (const t of ["한국 = 100", "스크롤로 떠나는 물가 노선", "내릴수록 싼 나라에서 한국을 지나 비싼 나라로 갑니다 · 올리면 거꾸로 돌아옵니다"]) await expect(sec, t).toContainText(t);
    await expect(sec.getByRole("heading", { level: 2 })).toHaveText("스크롤로 떠나는 물가 노선");
    // 머리 · 예산 카드는 그대로
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(tid(page, "budget")).toBeVisible();
  });

  test("정거장 = 아래 목록의 맨 위 나라들 + 한국(값 오름차순) · 값은 목록의 '물가 N' 과 같음 · 핀은 위 · 아래 번갈아", async ({ page }) => {
    test.skip(!(await ready(page)), "물가 자료 없음");
    const exp = expectedStops(await listPins(page));
    const got = await stopsOf(page);
    expect(got.length, "정거장 수").toBe(exp.length);
    expect(got.map((g) => g.value)).toEqual(exp.map((e) => e.value));
    for (const [i, e] of exp.entries()) expect(got[i].text, `${i + 1}번째 정거장 이름`).toContain(e.name);
    expect(got.filter((g) => g.country === "KR").length).toBe(1);
    const pins = await tid(page, "route-pin").evaluateAll((els) => els.map((e) => ({ c: e.getAttribute("data-country"), v: Number(e.getAttribute("data-value")), side: e.getAttribute("data-side") })));
    expect(pins.length, "한국 뺀 정거장마다 핀").toBe(exp.length - 1);
    for (let i = 1; i < pins.length; i++) expect(pins[i].side, "핀 위 · 아래 번갈아").not.toBe(pins[i - 1].side);
    await expect(tid(page, "route-kr-tag")).toContainText("한국 100 기준");
  });

  test("노선 화면은 메뉴 띠 바로 아래에 고정(세로 가운데 아님) · 정거장 사이 스크롤 길이 36vh(넓은 화면) · 30vh(휴대폰)", async ({ page }) => {
    if (!isPhone(page)) await page.setViewportSize({ width: 1280, height: 800 });
    test.skip(!(await ready(page)), "물가 자료 없음");
    const n = await tid(page, "route-stop").count();
    const m = await page.evaluate(() => {
      const sec = document.querySelector('[data-testid="route-section"]') as HTMLElement, st = document.querySelector('[data-testid="route-stage"]') as HTMLElement;
      return { sec: sec.getBoundingClientRect().height, stage: st.getBoundingClientRect().height, vh: window.innerHeight, pos: getComputedStyle(st).position };
    });
    expect(m.pos).toBe("sticky");
    const step = (m.sec - m.stage) / (n - 1);
    expect((step / m.vh) * 100, "정거장 사이 스크롤(vh)").toBeCloseTo(isPhone(page) ? 30 : 36, 0);
    for (const p of [0.1, 0.5, 0.9]) {
      await goProgress(page, p);
      await page.waitForTimeout(150);
      const g = await page.evaluate(() => ({ stageTop: (document.querySelector('[data-testid="route-stage"]') as HTMLElement).getBoundingClientRect().top, nav: document.querySelector("header")!.getBoundingClientRect().bottom, stageH: (document.querySelector('[data-testid="route-stage"]') as HTMLElement).getBoundingClientRect().height, vh: window.innerHeight }));
      expect(Math.abs(g.stageTop - g.nav), `진행 ${p}: 판 위 끝이 메뉴 띠 바로 아래`).toBeLessThanOrEqual(1.5);
      expect(g.stageTop + g.stageH, "판이 화면 안").toBeLessThanOrEqual(g.vh + 1.5);
    }
  });

  test("정거장마다 도착하면 — 카드(이름 · 정거장 N / M · 숫자 · 비교 · 예산 · 환율 알약) · 단추 · 말(동그라미)이 그 정거장 자리 · 움직이는 중 아님", async ({ page }) => {
    test.skip(!(await ready(page)), "물가 자료 없음");
    const exp = expectedStops(await listPins(page));
    const n = exp.length;
    for (let i = 0; i < n; i++) {
      await goProgress(page, i / (n - 1));
      await settle(page);
      const e = exp[i];
      const band = e.kr ? "base" : e.value / 100 < 0.9 ? "cheap" : e.value / 100 > 1.1 ? "exp" : "mid";
      await expect(tid(page, "route-card-name"), `${i + 1}번째 이름`).toHaveText(e.name);
      await expect(tid(page, "route-card-meta")).toHaveText(`정거장 ${i + 1} / ${n} · ${BANDNAME[band]}`);
      expect(Number((await text(page, "route-card-value")).replace(/\s/g, "")), "물가 숫자(앞 빈 칸은 0 글자가 숨은 칸이어도 됨)").toBe(e.value);
      await expect(tid(page, "route-card-pct")).toHaveText(e.value === 100 ? /^기준/ : e.value < 100 ? `${100 - e.value}% 쌉니다` : `${e.value - 100}% 비쌉니다`);
      await expect(tid(page, "route-card-budget")).toContainText(`약 ${(e.value * 1000).toLocaleString("ko-KR")}원`);
      const signal = e.kr ? "한국 100 기준" : e.pill && /^환율 .*·/.test(e.pill) ? e.pill : "환율 없음";
      await expect(tid(page, "route-card-signal")).toContainText(signal);
      const stops = await stopsOf(page);
      expect(stops.map((s) => s.active), `${i + 1}번째 정거장 단추 켜짐`).toEqual(stops.map((_, k) => k === i));
      expect(await tid(page, "route-card").getAttribute("data-moving")).not.toBe("true");
      // 말(동그라미) = 그 정거장 핀(한국은 '한국 100' 꼬리표) 자리
      const plane = (await tid(page, "route-plane").boundingBox())!;
      const target = e.kr ? (await tid(page, "route-kr-tag").boundingBox())! : (await tid(page, "route-pin").nth(i - (i > exp.findIndex((x) => x.kr) ? 1 : 0)).boundingBox())!;
      expect(Math.abs(plane.x + plane.width / 2 - (target.x + target.width / 2)), `${i + 1}번째 말 위치(px)`).toBeLessThanOrEqual(isPhone(page) ? 12 : 8);
    }
  });

  test("정거장 사이를 지나는 중 — 카드 data-moving · '다음 정거장 → 이름' · 말이 두 정거장 사이", async ({ page }) => {
    test.skip(!(await ready(page)), "물가 자료 없음");
    const exp = expectedStops(await listPins(page));
    const n = exp.length;
    const i = Math.min(1, n - 2);
    await goProgress(page, (i + 0.5) / (n - 1));
    await page.waitForTimeout(500);
    await expect(tid(page, "route-card")).toHaveAttribute("data-moving", "true");
    const next = await text(page, "route-next");
    expect([exp[i].name, exp[i + 1].name].some((nm) => next === `다음 정거장 → ${nm}`), `다음 정거장 글 "${next}"`).toBe(true);
    // 말 x: 두 정거장 자리 사이
    const xOf = async (idx: number) => {
      const e = exp[idx];
      if (e.kr) { const b = (await tid(page, "route-kr-tag").boundingBox())!; return b.x + b.width / 2; }
      const k = idx - (idx > exp.findIndex((x) => x.kr) ? 1 : 0);
      const b = (await tid(page, "route-pin").nth(k).boundingBox())!;
      return b.x + b.width / 2;
    };
    const plane = (await tid(page, "route-plane").boundingBox())!;
    const px = plane.x + plane.width / 2;
    const [a, b] = [await xOf(i), await xOf(i + 1)];
    expect(px, "말이 두 정거장 사이").toBeGreaterThanOrEqual(Math.min(a, b) - 3);
    expect(px).toBeLessThanOrEqual(Math.max(a, b) + 3);
  });

  test("올리면 거꾸로 — 말 방향 data-dir back · 내리면 forward", async ({ page }) => {
    test.skip(!(await ready(page)), "물가 자료 없음");
    await goProgress(page, 0.6);
    await page.waitForTimeout(400);
    await goProgress(page, 0.4);
    await page.waitForTimeout(400);
    await expect(tid(page, "route-plane")).toHaveAttribute("data-dir", "back");
    await goProgress(page, 0.7);
    await page.waitForTimeout(400);
    await expect(tid(page, "route-plane")).toHaveAttribute("data-dir", "forward");
  });

  test("낮은 창에서도 카드 아래가 잘리지 않음 — 1280×720 · 1366×768 · 390×667 에서 판 · 카드 아래 끝이 화면 안 (처음 · 가운데 · 끝)", async ({ page }) => {
    // 판은 화면 − 메뉴 높이라, 안쪽 내용(제목 · 자 · 카드)이 그보다 크면 아래가 잘림(builder 가 적은 한계 · 작업 0230 lead 확인 요청)
    const sizes = isPhone(page) ? [[390, 667], [390, 844]] : [[1280, 720], [1366, 768], [1280, 900]];
    for (const [w, h] of sizes) {
      await page.setViewportSize({ width: w, height: h });
      test.skip(!(await ready(page)), "물가 자료 없음");
      for (const p of [0, 0.5, 1]) {
        await goProgress(page, p);
        await page.waitForTimeout(900);
        const m = await page.evaluate(() => {
          const stage = (document.querySelector('[data-testid="route-stage"]') as HTMLElement).getBoundingClientRect();
          const card = document.querySelector('[data-testid="route-card"]') as HTMLElement;
          let last = 0;
          card.querySelectorAll("*").forEach((e) => { const r = e.getBoundingClientRect(); if (r.height > 0) last = Math.max(last, r.bottom); });
          return { vh: window.innerHeight, stageBottom: stage.bottom, cardBottom: card.getBoundingClientRect().bottom, contentBottom: last };
        });
        expect(m.cardBottom, `${w}×${h} 진행 ${p}: 카드 아래 끝(${Math.round(m.cardBottom)})이 화면 높이(${m.vh}) 안`).toBeLessThanOrEqual(m.vh + 1);
        expect(m.contentBottom, `${w}×${h} 진행 ${p}: 카드 안 글 아래 끝이 화면 안`).toBeLessThanOrEqual(m.vh + 1);
        expect(m.cardBottom, `${w}×${h} 진행 ${p}: 카드가 판 밖으로 나가 잘림`).toBeLessThanOrEqual(m.stageBottom + 1);
      }
    }
  });

  test("정거장 단추를 누르면 그 정거장으로 — 카드가 바뀜", async ({ page }) => {
    test.skip(isPhone(page), "휴대폰은 정거장 단추를 숨김(시안 m-prices.css: 좁은 화면 .stops display none)");
    test.skip(!(await ready(page)), "물가 자료 없음");
    const exp = expectedStops(await listPins(page));
    await goProgress(page, 0);
    await settle(page, 600);
    const k = exp.length - 1;
    await tid(page, "route-stop").nth(k).click();
    await expect(tid(page, "route-card-name"), "마지막 정거장").toHaveText(exp[k].name, { timeout: 6000 });
    await tid(page, "route-stop").nth(2).click();
    await expect(tid(page, "route-card-name")).toHaveText(exp[2].name, { timeout: 6000 });
  });

  test("예산 카드 아래 끝 → 노선 제목(h2) 위 끝 간격 = 지금 운영 정적 자와 같음(넓은 화면 140px · 휴대폰 100px) · 화면 높이를 바꿔도 같음", async ({ page }) => {
    const heights = isPhone(page) ? [700, 844, 915] : [720, 900, 1300];
    const gaps: number[] = [];
    for (const h of heights) {
      await page.setViewportSize({ width: isPhone(page) ? 390 : 1280, height: h });
      if (!(await ready(page))) test.skip(true, "물가 자료 없음");
      const g = await page.evaluate(() => (document.querySelector('[data-testid="route-title"]') as HTMLElement).getBoundingClientRect().top - (document.querySelector('[data-testid="budget"]') as HTMLElement).getBoundingClientRect().bottom);
      gaps.push(g);
      expect(Math.abs(g - (isPhone(page) ? GAP.phone : GAP.wide)), `높이 ${h}: 간격 ${g}px`).toBeLessThanOrEqual(2);
    }
    expect(Math.max(...gaps) - Math.min(...gaps), "화면 높이에 따라 변함").toBeLessThanOrEqual(1);
  });

  test("노선 아래 — 기존 세 칸 목록 · 나라 더 보기 · (자료 없어 뺀 나라 줄)이 그대로 이어짐", async ({ page }) => {
    test.skip(!(await ready(page)), "물가 자료 없음");
    await expect(tid(page, "price-bands").locator("section")).toHaveCount(3);
    await expect(page.getByText("나라 더 보기").first()).toBeVisible();
    const sec = (await tid(page, "route-section").boundingBox())!;
    const bands = (await tid(page, "price-bands").boundingBox())!;
    expect(bands.y, "목록이 노선 구역 아래").toBeGreaterThanOrEqual(sec.y + sec.height - 1);
  });

  test("통화로 거르기(?currency=EUR) — 노선 정거장이 걸러진 목록의 맨 위 나라들 + 한국", async ({ page }) => {
    test.skip(!(await ready(page, "/prices?currency=EUR")), "물가 자료 없음");
    test.skip((await tid(page, "price-bands").count()) === 0, "거른 목록이 비어 있음");
    await page.waitForTimeout(600);
    const exp = expectedStops(await listPins(page));
    const got = await stopsOf(page);
    expect(got.map((g) => g.value)).toEqual(exp.map((e) => e.value));
    for (const [i, e] of exp.entries()) expect(got[i].text).toContain(e.name);
  });

  test("움직임 줄이기 — 고정 없이 정적 노선: 정거장 카드가 모두 보이고 판이 sticky 가 아님", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    test.skip(!(await ready(page)), "물가 자료 없음");
    const exp = expectedStops(await listPins(page));
    expect(await tid(page, "route-stage").evaluate((e) => getComputedStyle(e).position), "고정되지 않음").not.toBe("sticky");
    const vis = await tid(page, "route-card").evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height > 0).length);
    expect(vis, "보이는 정거장 카드 수").toBe(exp.length);
    await expect(tid(page, "route-ruler")).toBeVisible();
    expect(await tid(page, "route-pin").count()).toBe(exp.length - 1);
    const sec = await tid(page, "route-section").boundingBox();
    expect(sec!.height, "긴 스크롤 칸이 없음").toBeLessThan((page.viewportSize()?.height ?? 800) * 0.9 * exp.length);
  });

  test("자바스크립트를 꺼도 — 정적 노선(정거장 카드 모두 · 자 · 핀 · 한국 100 꼬리표) · 아래 목록", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/prices");
    test.skip((await tid(page, "price-bands").count()) === 0, "물가 자료 없음");
    await expect(tid(page, "route-section")).toBeVisible();
    expect(await tid(page, "route-stage").evaluate((e) => getComputedStyle(e).position)).not.toBe("sticky");
    expect(await tid(page, "route-card").count()).toBeGreaterThanOrEqual(3);
    await expect(tid(page, "route-ruler")).toBeVisible();
    await expect(tid(page, "route-kr-tag")).toContainText("한국 100 기준");
    await expect(tid(page, "price-bands")).toBeVisible();
    await ctx.close();
  });

  test("끝까지 스크롤하며 — 가로 넘침 0 · 말이 화면 안 · 콘솔 오류 없음 (1280 · 390)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    test.skip(!(await ready(page)), "물가 자료 없음");
    const vw = page.viewportSize()!.width;
    for (const p of [0, 0.17, 0.33, 0.5, 0.67, 0.83, 1]) {
      await goProgress(page, p);
      await page.waitForTimeout(450);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `진행 ${p} 가로 넘침`).toBeLessThanOrEqual(1);
      const pl = (await tid(page, "route-plane").boundingBox())!;
      expect(pl.x, `진행 ${p} 말 왼쪽`).toBeGreaterThanOrEqual(-1);
      expect(pl.x + pl.width, `진행 ${p} 말 오른쪽`).toBeLessThanOrEqual(vw + 1);
    }
    expect(errors).toEqual([]);
  });
});

// 작업 0230 모션 3번 → 작업 0266(스크롤 고정을 풀고 나라 단추로 고르기) — 여행 물가 /prices e2e · 테스트 먼저
//   사용자 결정(작업 0266 · 시안 40번 "고정을 푼 모습"): 노선이 화면에 붙어 스크롤로 정거장이 바뀌던 방식을 없애고, 나라 단추를 눌러 고름 · 구간은 내용만큼의 높이
//   DOM 계약(작업 0266 · 0230 의 표시 이름을 그대로 씀 — 바꾸지 않음)
//     [data-testid="route-section"] — 노선 전체 · aria-label 또는 aria-labelledby 가 새 제목 "나라별 물가 노선" · h2[data-testid="route-title"] "나라별 물가 노선" · 설명 "나라 이름을 누르면 그 나라로 갑니다 · 싼 나라에서 한국을 지나 비싼 나라 순서입니다"
//       [data-testid="route-stage"] — 판(고정되지 않음: position sticky 아님)
//       [data-testid="route-stops"] 안 [data-testid="route-stop"] 단추(정거장마다 · data-country · data-value · data-active="true"(지금 정거장) · 누르면 그 정거장으로 비행기 · 카드가 바뀜) — 휴대폰에서도 보임(가로로 밀 수 있는 한 줄)
//       [data-testid="route-ruler"] 자 · "route-pin"(한국 뺀 정거장마다) · "route-kr-tag"(글 "한국 100 기준") · "route-plane"(가운데 x = 지금 값의 자 위 위치 · data-dir)
//       [data-testid="route-card"] 카드 안 route-card-name · route-card-meta("정거장 N / M · 띠 이름") · route-card-value · route-card-pct · route-card-budget · route-card-signal
//     처음에는 첫 정거장(가장 싼 나라)이 골라져 있음 · 스크롤로는 바뀌지 않음 · 값이 같은 나라 사이(작업 0251)는 비행기가 가만히
//     자바스크립트가 꺼져도 첫 정거장 카드와 자(물가 자)가 보임
//   노선 구간과 아래 세 칸 목록 사이 간격: 넓은 화면 96px · 휴대폰 72px (다른 구간과 같음 · 굵은 남색 선은 그대로)
//   위치를 재는 검사는 한 번만 재지 않고 최종 배치(움직임 · 하이드레이션 뒤)까지 다시 재며 기다림 (작업 0260 흔들림 교훈)
import { type Page, expect, test } from "@playwright/test";
import { hydrated } from "./helpers";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const BANDNAME: Record<string, string> = { cheap: "한국보다 싼 곳", mid: "비슷한 곳", base: "기준", exp: "한국보다 비싼 곳" };

const ready = async (page: Page, url = "/prices") => {
  await page.goto(url);
  return (await tid(page, "price-bands").count()) > 0;
};

type Pin = { name: string; value: number; pill: string | null };
/** 아래 세 칸 목록(필터 반영)의 구간마다 맨 위 두 줄 — 노선 정거장이 이 나라들이어야 함 */
async function listPins(page: Page): Promise<Pin[]> {
  // 줄이 아직 최종 배치가 되기 전에는 innerText 첫 줄에 이름 · 물가 · 알약이 한 줄로 붙어 읽힘('인도 국기인도물가 37 (한국 100)환율 없음') — 첫 줄이 이름뿐인 최종 모양이 되기를 기다림 (작업 0242)
  const rows = () => tid(page, "price-bands").locator("section").evaluateAll((secs) => secs.flatMap((s) => Array.from(s.querySelectorAll("li")).slice(0, 2).map((li) => (li as HTMLElement).innerText)));
  await expect.poll(async () => (await rows()).every((t) => t.includes("\n") && !t.split("\n")[0].includes("물가") && /물가\s*\d+\s*\(한국 100\)/.test(t)), { message: "나라 줄이 최종 모양으로 그려지기를 기다림" }).toBe(true);
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

const text = async (page: Page, id: string) => ((await tid(page, id).first().innerText()) ?? "").replace(/\s+/g, " ").trim();
const NEW_TITLE = "나라별 물가 노선";
const NEW_DESC = "나라 이름을 누르면 그 나라로 갑니다 · 싼 나라에서 한국을 지나 비싼 나라 순서입니다";

/** 정거장이 그려지고(하이드레이션 뒤) 단추가 둘 이상일 때까지 기다림 */
async function stopsReady(page: Page) {
  await hydrated(tid(page, "route-stage"));
  await expect.poll(() => tid(page, "route-stop").count(), { message: "정거장 단추가 그려지기를 기다림" }).toBeGreaterThan(1);
}
/** 정거장 k 의 자 위 표시(핀 · 한국은 '한국 100' 꼬리표) 가운데 x */
async function stopX(page: Page, exp: ReturnType<typeof expectedStops>, k: number) {
  const kr = exp.findIndex((x) => x.kr);
  const loc = exp[k].kr ? tid(page, "route-kr-tag") : tid(page, "route-pin").nth(k - (k > kr ? 1 : 0));
  const b = (await loc.boundingBox())!;
  return b.x + b.width / 2;
}
const planeX = async (page: Page) => { const b = (await tid(page, "route-plane").boundingBox())!; return b.x + b.width / 2; };
/** 단추로 k 번째 정거장을 고르고 → 카드 · 단추 켜짐 · 비행기가 그 자리에 설 때까지(움직임이 끝난 최종 배치) 기다림 */
async function pickStop(page: Page, exp: ReturnType<typeof expectedStops>, k: number) {
  await tid(page, "route-stop").nth(k).scrollIntoViewIfNeeded();
  await tid(page, "route-stop").nth(k).click();
  await expect(tid(page, "route-card-name"), `${k + 1}번째 정거장 카드 이름`).toHaveText(exp[k].name, { timeout: 8000 });
  await expect.poll(async () => Math.abs((await planeX(page)) - (await stopX(page, exp, k))), { message: `${k + 1}번째 정거장 비행기 위치(px)`, timeout: 8000 }).toBeLessThanOrEqual(isPhone(page) ? 12 : 8);
  expect((await stopsOf(page)).map((x) => x.active), `${k + 1}번째 단추 켜짐`).toEqual((await stopsOf(page)).map((_, i) => i === k));
}

test.describe("여행 물가 — 나라 단추로 고르는 물가 노선 (작업 0266 · 스크롤 고정 해제)", () => {
  test("정적 자 자리에 노선 — 바로 아래가 세 칸 목록 · 새 제목 · 새 설명 · aria-label · 옛 문구 없음", async ({ page }) => {
    test.skip(!(await ready(page)), "물가 자료 없음");
    await expect(tid(page, "route-section"), "노선").toHaveCount(1);
    const next = await page.evaluate(() => { const s = document.querySelector('[data-testid="route-section"]')!; const n = s.nextElementSibling; return { hasBands: !!n?.querySelector('[data-testid="price-bands"]'), top: s.getBoundingClientRect().bottom + scrollY, bandsTop: (document.querySelector('[data-testid="price-bands"]') as HTMLElement).getBoundingClientRect().top + scrollY }; });
    expect(next.hasBands, "노선 바로 다음 칸 안에 세 칸 목록").toBe(true);
    expect(next.bandsTop, "목록이 노선 아래").toBeGreaterThanOrEqual(next.top - 1);
    await expect(page.getByText("한국보다 싼 곳 · 비슷한 곳 · 비싼 곳", { exact: true })).toHaveCount(0);
    await expect(tid(page, "ruler")).toHaveCount(0);
    const sec = tid(page, "route-section");
    for (const t of [NEW_TITLE, NEW_DESC]) await expect(sec, t).toContainText(t);
    await expect(sec.getByRole("heading", { level: 2 })).toHaveText(NEW_TITLE);
    await expect(tid(page, "route-title")).toHaveText(NEW_TITLE);
    for (const old of ["스크롤로 떠나는 물가 노선", "올리면 거꾸로 돌아옵니다", "내릴수록 싼 나라에서"]) await expect(sec, `옛 문구 ${old}`).not.toContainText(old);
    // 구간의 이름(aria-label 또는 aria-labelledby 가 가리키는 글)도 새 제목에 맞음
    const name = await sec.evaluate((el) => el.getAttribute("aria-label") ?? (el.getAttribute("aria-labelledby") ? (document.getElementById(el.getAttribute("aria-labelledby")!)?.textContent ?? "") : ""));
    expect(name, "구간 이름").toContain(NEW_TITLE);
    expect(name).not.toContain("스크롤");
    // 작업 0251 ㄷ: 제목 위 작은 라벨 "한국 = 100" 은 없음(눈금 · 카드의 다른 문구는 그대로)
    await expect(sec.getByText("한국 = 100", { exact: true }), "제목 위 라벨 없음").toHaveCount(0);
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

  test("스크롤 고정 없음 — 판이 sticky 가 아니고 구간 높이가 화면 여러 장이 아님(내용만큼)", async ({ page }) => {
    if (!isPhone(page)) await page.setViewportSize({ width: 1280, height: 800 });
    test.skip(!(await ready(page)), "물가 자료 없음");
    await stopsReady(page);
    expect(await tid(page, "route-stage").evaluate((e) => getComputedStyle(e).position), "고정되지 않음").not.toBe("sticky");
    // 구간(노선) 높이: 하이드레이션 · 글꼴이 자리 잡은 최종 높이가 되기를 기다림 · 넓은 화면은 화면 한 장 이하 · 휴대폰은 한 장의 1.2배 이하(여러 장이 아님)
    const vh = page.viewportSize()!.height;
    const limit = isPhone(page) ? vh * 1.2 : vh;
    await expect.poll(async () => (await tid(page, "route-section").boundingBox())!.height, { message: `구간 높이(px) ≤ ${Math.round(limit)}`, timeout: 8000 }).toBeLessThanOrEqual(limit);
  });

  test("처음에는 첫 정거장(가장 싼 나라) · 스크롤해도 정거장이 바뀌지 않음", async ({ page }) => {
    if (!isPhone(page)) await page.setViewportSize({ width: 1280, height: 800 });
    test.skip(!(await ready(page)), "물가 자료 없음");
    const exp = expectedStops(await listPins(page));
    await stopsReady(page);
    await expect(tid(page, "route-card-name"), "처음 카드").toHaveText(exp[0].name);
    await expect(tid(page, "route-card-meta")).toHaveText(new RegExp(`^정거장 1 / ${exp.length} · `));
    expect((await stopsOf(page)).map((x) => x.active), "처음에는 첫 단추만 켜짐").toEqual(exp.map((_, i) => i === 0));
    const x0 = await planeX(page);
    // 구간을 가로질러 스크롤 — 카드 · 단추 · 비행기가 그대로
    const box = (await tid(page, "route-section").boundingBox())!;
    const top = await page.evaluate(() => window.scrollY);
    for (const dy of [0, box.y + box.height * 0.3, box.y + box.height * 0.8, box.y + box.height + 600]) {
      await page.evaluate(([y, t]) => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, t + y); }, [dy, top] as const);
      await page.waitForTimeout(500);
      await expect(tid(page, "route-card-name"), `스크롤 ${Math.round(dy)}px 뒤 카드`).toHaveText(exp[0].name);
      expect((await stopsOf(page)).map((x) => x.active)).toEqual(exp.map((_, i) => i === 0));
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await tid(page, "route-card").scrollIntoViewIfNeeded();
    expect(Math.abs((await planeX(page)) - x0), "비행기도 그대로").toBeLessThanOrEqual(1.5);
  });

  test("나라 단추를 누르면 — 카드(이름 · 정거장 N / M · 숫자 · 비교 · 예산 · 환율 알약) · 단추 · 비행기가 그 나라로 · 마지막 · 가운데 · 처음으로 다시", async ({ page }) => {
    test.skip(!(await ready(page)), "물가 자료 없음");
    const exp = expectedStops(await listPins(page));
    const n = exp.length;
    await stopsReady(page);
    for (const k of [n - 1, 2, 0].filter((v, i, a) => v >= 0 && v < n && a.indexOf(v) === i)) {
      await pickStop(page, exp, k);
      const e = exp[k];
      const band = e.kr ? "base" : e.value / 100 < 0.9 ? "cheap" : e.value / 100 > 1.1 ? "exp" : "mid";
      await expect(tid(page, "route-card-meta")).toHaveText(new RegExp(`^정거장 ${k + 1} / ${n} · ${BANDNAME[band]}( · \\d{4}년 자료)?$`));
      await expect.poll(async () => Number((await text(page, "route-card-value")).replace(/\s/g, "")), { message: "물가 숫자(숫자가 넘어가는 움직임이 끝난 값)" }).toBe(e.value);
      await expect(tid(page, "route-card-pct")).toHaveText(e.value === 100 ? /^기준/ : e.value < 100 ? `${100 - e.value}% 쌉니다` : `${e.value - 100}% 비쌉니다`);
      await expect(tid(page, "route-card-budget")).toContainText(`약 ${(e.value * 1000).toLocaleString("ko-KR")}원`);
      const signal = e.kr ? "한국 100 기준" : e.pill && /^환율 .*·/.test(e.pill) ? e.pill : "환율 없음";
      await expect(tid(page, "route-card-signal")).toContainText(signal);
      expect(await tid(page, "route-card").getAttribute("data-moving"), "움직이는 중 아님").not.toBe("true");
    }
  });

  test("같은 값인 이웃 나라로 옮겨도 비행기는 가만히(작업 0251) — 나라(카드 · 이름)만 바뀜", async ({ page }) => {
    test.skip(!(await ready(page)), "물가 자료 없음");
    const exp = expectedStops(await listPins(page));
    const k = exp.findIndex((e, i) => i > 0 && e.value === exp[i - 1].value);
    test.skip(k < 1, "값이 같은 이웃 나라가 없음");
    await stopsReady(page);
    await pickStop(page, exp, k - 1);
    const before = await planeX(page);
    const flipBefore = await tid(page, "route-plane").evaluate((e) => getComputedStyle(e.querySelector("svg") ?? e).transform);
    await tid(page, "route-stop").nth(k).click();
    // 옮겨 가는 동안 · 끝난 뒤 모두 비행기 가운데 x 가 그대로 · 좌우로 뒤집히지 않음
    for (let i = 0; i < 8; i++) {
      expect(Math.abs((await planeX(page)) - before), `옮겨 가는 중 ${i}`).toBeLessThanOrEqual(1.5);
      await page.waitForTimeout(100);
    }
    await expect(tid(page, "route-card-name")).toHaveText(exp[k].name, { timeout: 8000 });
    expect(Math.abs((await planeX(page)) - before), "끝난 뒤").toBeLessThanOrEqual(1.5);
    expect(await tid(page, "route-plane").evaluate((e) => getComputedStyle(e.querySelector("svg") ?? e).transform), "좌우 뒤집힘 없음").toBe(flipBefore);
  });

  test("휴대폰 — 나라 단추 줄이 제목 아래에 보이고 가로로 밀 수 있음 · 문서가 가로로 넘치지 않음 · 누르면 바뀜", async ({ page }) => {
    test.skip(!isPhone(page), "휴대폰 전용");
    test.skip(!(await ready(page)), "물가 자료 없음");
    const exp = expectedStops(await listPins(page));
    await stopsReady(page);
    const stops = tid(page, "route-stops");
    await stops.scrollIntoViewIfNeeded();
    await expect(stops, "휴대폰에도 단추 줄").toBeVisible();
    await expect(tid(page, "route-stop").first()).toBeVisible();
    // 제목 아래
    const [tb, sb] = [(await tid(page, "route-title").boundingBox())!, (await stops.boundingBox())!];
    expect(sb.y, "단추 줄은 제목 아래").toBeGreaterThanOrEqual(tb.y + tb.height - 1);
    // 줄 안에서만 가로로 넘치고(밀 수 있음) 문서는 안 넘침
    const m = await stops.evaluate((el) => ({ over: getComputedStyle(el).overflowX, sw: el.scrollWidth, cw: el.clientWidth }));
    expect(["auto", "scroll"], "단추 줄 안에서 가로 스크롤").toContain(m.over);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "문서 가로 넘침").toBeLessThanOrEqual(0);
    // 끝쪽 단추도 눌러 고를 수 있음
    await pickStop(page, exp, exp.length - 1);
  });

  test("끝까지 스크롤하며 — 가로 넘침 0 · 비행기가 화면 안 · 콘솔 오류 없음 (1280 · 휴대폰)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    test.skip(!(await ready(page)), "물가 자료 없음");
    await stopsReady(page);
    const vw = page.viewportSize()!.width;
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      await page.evaluate((y) => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, y); }, total * p);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `위치 ${p} 가로 넘침`).toBeLessThanOrEqual(1);
    }
    await tid(page, "route-card").scrollIntoViewIfNeeded();
    const pl = (await tid(page, "route-plane").boundingBox())!;
    expect(pl.x, "비행기 왼쪽").toBeGreaterThanOrEqual(-1);
    expect(pl.x + pl.width, "비행기 오른쪽").toBeLessThanOrEqual(vw + 1);
    expect(errors).toEqual([]);
  });

  test("노선 구간 아래 간격 — 아래 세 칸 목록 구간과 넓은 화면 96px · 휴대폰 72px (다른 구간과 같음) · 굵은 선은 그대로", async ({ page }) => {
    if (!isPhone(page)) await page.setViewportSize({ width: 1280, height: 800 });
    test.skip(!(await ready(page)), "물가 자료 없음");
    await stopsReady(page);
    const want = isPhone(page) ? 72 : 96;
    // 노선 구간 아래 끝 → 다음 구간(세 칸 목록 칸 · 위 굵은 선 포함) 위 끝 · 최종 배치까지 기다림
    await expect
      .poll(async () => page.evaluate(() => { const s = document.querySelector('[data-testid="route-section"]') as HTMLElement; const n = s.nextElementSibling as HTMLElement; return Math.round((n.getBoundingClientRect().top - s.getBoundingClientRect().bottom) * 10) / 10; }), { message: `노선 ↔ 아래 구간 간격(px) = ${want}`, timeout: 8000 })
      .toBeGreaterThanOrEqual(want - 1);
    const gap = await page.evaluate(() => { const s = document.querySelector('[data-testid="route-section"]') as HTMLElement; const n = s.nextElementSibling as HTMLElement; return n.getBoundingClientRect().top - s.getBoundingClientRect().bottom; });
    expect(Math.abs(gap - want), `간격 ${gap}px`).toBeLessThanOrEqual(1);
    // 굵은 선(3px)이 아래 구간 위에 그대로 있음
    const line = await page.evaluate(() => { const n = (document.querySelector('[data-testid="route-section"]') as HTMLElement).nextElementSibling as HTMLElement; const c = getComputedStyle(n); const first = getComputedStyle(n.firstElementChild as HTMLElement); return Math.max(parseFloat(c.borderTopWidth), parseFloat(first.borderTopWidth)); });
    expect(line, "굵은 선").toBeGreaterThanOrEqual(2.5);
  });

  test("정거장 카드의 아래 테두리가 잘리지 않고 보임 — 카드를 감싼 칸이 카드 아래 끝을 자르지 않음 · 카드 아래 테두리 두께 > 0", async ({ page }) => {
    test.skip(!(await ready(page)), "물가 자료 없음");
    await stopsReady(page);
    await tid(page, "route-card").scrollIntoViewIfNeeded();
    await expect
      .poll(
        () =>
          tid(page, "route-card").evaluate((card) => {
            const cr = card.getBoundingClientRect();
            const bw = parseFloat(getComputedStyle(card).borderBottomWidth);
            // 카드 아래 끝을 자를 수 있는 조상(overflow 가 보임이 아닌 칸) — 그 아래 끝이 카드 아래 끝보다 아래여야 함
            let clipped = false;
            for (let e = card.parentElement; e && e !== document.body; e = e.parentElement) {
              const st = getComputedStyle(e);
              if (/(hidden|clip|auto|scroll)/.test(st.overflowY) && e.getBoundingClientRect().bottom < cr.bottom - 0.01) clipped = true;
            }
            return { bw, clipped };
          }),
        { message: "카드 아래 테두리가 보임", timeout: 8000 },
      )
      .toEqual({ bw: expect.any(Number), clipped: false });
    expect(await tid(page, "route-card").evaluate((c) => parseFloat(getComputedStyle(c).borderBottomWidth)), "카드 아래 테두리 두께").toBeGreaterThan(0);
  });

  test("예산 카드 아래 끝 → 노선 제목(h2) 위 끝 — 겹치지 않고(간격 > 0) 화면 높이를 바꿔도 같음", async ({ page }) => {
    const heights = isPhone(page) ? [700, 844, 915] : [720, 900, 1300];
    const gaps: number[] = [];
    for (const h of heights) {
      await page.setViewportSize({ width: isPhone(page) ? 390 : 1280, height: h });
      if (!(await ready(page))) test.skip(true, "물가 자료 없음");
      await stopsReady(page);
      const g = await page.evaluate(() => (document.querySelector('[data-testid="route-title"]') as HTMLElement).getBoundingClientRect().top - (document.querySelector('[data-testid="budget"]') as HTMLElement).getBoundingClientRect().bottom);
      gaps.push(g);
      expect(g, `높이 ${h}: 간격 ${g}px`).toBeGreaterThan(0);
    }
    expect(Math.max(...gaps) - Math.min(...gaps), "화면 높이에 따라 변함").toBeLessThanOrEqual(1);
  });

  test("노선 아래 — 기존 세 칸 목록 · 나라 더 보기 · (자료 없어 뺀 나라 줄)이 그대로 이어짐", async ({ page }) => {
    test.skip(!(await ready(page)), "물가 자료 없음");
    await expect(tid(page, "price-bands").locator("section")).toHaveCount(3);
    await expect(page.getByText("나라 더 보기").first()).toBeVisible();
    await stopsReady(page);
    await expect
      .poll(async () => { const sec = (await tid(page, "route-section").boundingBox())!; const bands = (await tid(page, "price-bands").boundingBox())!; return bands.y - (sec.y + sec.height); }, { message: "목록이 노선 구간 아래", timeout: 8000 })
      .toBeGreaterThanOrEqual(-1);
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

  test("움직임 줄이기 — 고정 없이 단추로 고르기가 그대로 됨(움직임만 없음 또는 모든 카드를 펼친 정적 노선) · 첫 정거장 카드가 보임", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    test.skip(!(await ready(page)), "물가 자료 없음");
    const exp = expectedStops(await listPins(page));
    expect(await tid(page, "route-stage").evaluate((e) => getComputedStyle(e).position), "고정되지 않음").not.toBe("sticky");
    const visible = async () => tid(page, "route-card").evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().height > 0).length);
    expect(await visible(), "보이는 정거장 카드가 있음").toBeGreaterThanOrEqual(1);
    await expect(tid(page, "route-ruler")).toBeVisible();
    expect(await tid(page, "route-pin").count()).toBe(exp.length - 1);
    const sec = (await tid(page, "route-section").boundingBox())!;
    expect(sec.height, "긴 스크롤 칸이 없음").toBeLessThan((page.viewportSize()?.height ?? 800) * 2);
    // 카드가 하나만 보이는 방식이면 단추로 고르기가 됨
    if ((await visible()) === 1) {
      await stopsReady(page);
      await pickStop(page, exp, exp.length - 1);
    }
  });

  test("자바스크립트를 꺼도 — 첫 정거장 카드 · 자(핀 · 한국 100 꼬리표)가 보임 · 아래 목록", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await page.goto("/prices");
    test.skip((await tid(page, "price-bands").count()) === 0, "물가 자료 없음");
    await expect(tid(page, "route-section")).toBeVisible();
    expect(await tid(page, "route-stage").evaluate((e) => getComputedStyle(e).position)).not.toBe("sticky");
    const exp = expectedStops(await listPins(page));
    const first = tid(page, "route-card").first();
    await expect(first, "첫 정거장 카드").toBeVisible();
    await expect(first.locator('[data-testid="route-card-name"]'), "첫 정거장 = 가장 싼 나라").toHaveText(exp[0].name);
    await expect(first.locator('[data-testid="route-card-value"]')).toContainText(/\d/);
    await expect(tid(page, "route-ruler")).toBeVisible();
    await expect(tid(page, "route-kr-tag")).toContainText("한국 100 기준");
    await expect(tid(page, "price-bands")).toBeVisible();
    await ctx.close();
  });
});

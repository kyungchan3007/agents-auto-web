// 작업 0234 — 여행 타이밍(/flights) "항공권 출발일 달력" 새 구역 e2e · 테스트 먼저 (R1 ~ R8)
//   요청 원문: .agents/specs/0234-airfare-calendar/request.md · 요구 R1 ~ R12: prd.md · 구조: sdd.md
//   기준: 스크린샷 .tmp/handoff-1120/airfare-1280.png · airfare-390.png · airfare-flying.png · airfare-no-scroll.png · airfare-picked-old-layout.png (주 저장소)
//   참고 구현: .tmp/motion-pages/m-airfare.src.js · m-airfare.css (시안)
//
//   DOM 계약 (※ 이름은 시안의 구조를 testid 로 옮긴 이 테스트의 가정 — 다르게 하면 lead 에게 알려 테스트를 맞춤)
//     구역 [data-testid="airfare-section"] aria-labelledby="airfare-title" — window-section 바로 다음 형제 (R1)
//       라벨 "항공권 출발일 달력" · h2 #airfare-title "언제 떠나면 쌀까 — 인천 출발 1주 왕복" · 설명 [data-testid="airfare-lede"] 한 줄 (R2)
//       도시 칩 [data-testid="airfare-chip"] 버튼 · data-airport="NRT" · aria-pressed · 안에 국기 [data-testid="airfare-chip-flag"] + 도시 이름 (R2)
//       자료가 없으면(빌드 때 못 받음) 구역은 있되 [data-testid="airfare-empty"] "아직 받지 못했습니다" · 칩 · 날짜 띠 · 숫자 없음 (R10)
//     탑승권 [data-testid="airfare-pass"]: 꼬리표 airfare-tag("가장 싼 출발"|"고른 출발") · 도착 airfare-to(공항 코드 포함) · 출발 airfare-dep · 돌아옴 airfare-ret ("12.29(화)" 모양)
//       글자판 airfare-board — aria-hidden · data-final="274873" · 자리마다 굴러감 · 읽는 글 airfare-price-sr "274,873원 · 12월 29일(화) 출발 1주 왕복" (R3)
//       파인 동그라미(구멍 · 노치 · 펀치) 없음: 탑승권 안에 testid 에 hole · notch · punch 가 든 것이 없음
//     머리 문장 airfare-head "도쿄는 12월 29일(화) 출발이 가장 쌉니다" · 풀이 airfare-sub (R4)
//     날짜 띠: 밀기 칸 airfare-scroll · 날짜 칸 airfare-day(버튼 · data-depart · data-tier="low|mid|high" · data-best="true"|없음 · aria-pressed) 안에 요일 airfare-day-wd · 날짜 airfare-day-dt · 가격 airfare-day-pr("27.5" 만 원)
//       범위 글 airfare-range · ‹ airfare-prev · › airfare-next · 고른 날 표시 airfare-sel (파랑 둥근 네모 · 위치 = 칸 실제 픽셀(left transform px · width px · 퍼센트 금지)) · 비행기 airfare-plane (R5 · R8)
//     요일 막대 airfare-week-row ×7(월 → 일) · 채움 airfare-week-fill · 요약 airfare-fact ×2(이름표 dt · 큰 값 dd.big · 풀이 dd.say) · 안내 airfare-note (R6 · R7)
//   자료: e2e/fixtures/airfare-calendar.json (도쿄 NRT · 오사카 KIX · 방콕 BKK · 파리 CDG · 각 42일 · 받은 날 2026-11-19) — 고정 자료로 빌드해야 함(e2e/fixture-api.mjs 머리말)
//     고정 자료가 아닌 빌드(운영 API 에는 아직 airfare 가 없어 CI 도 해당)에서는 값 의존 테스트를 건너뜀 · AIRFARE_FIXTURE=1 이면 건너뛰지 않고 실패로 셈
//     값(고정 자료): 도쿄 가장 싼 날 12-29(화) 274,873 · 오사카 12-02 227,700 · 방콕 11-24 446,200 · 파리 11-27 813,200 · 날짜 11-20 ~ 12-31(42일)
//   칸 수: 넓은 화면(1280) 14일 · 휴대폰(390) 7일 · 화면 크기는 이 파일이 정함(기기 프로젝트의 크기를 쓰지 않음) · 넓은 화면 프로젝트만 실행(휴대폰 프로젝트는 건너뜀)
import { type Page, expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

type Day = { depart: string; return: string; price: number };
const fixture = JSON.parse(readFileSync(fileURLToPath(new URL("./fixtures/airfare-calendar.json", import.meta.url)), "utf8")) as { fetchedOn: string; cities: { airport: string; city: string; days: Day[] }[] };

const FIXTURE_REQUIRED = process.env.AIRFARE_FIXTURE === "1";
const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const SIZES = [
  { name: "1280", viewport: { width: 1280, height: 900 }, perView: 14 },
  { name: "390", viewport: { width: 390, height: 844 }, perView: 7 },
];
const city = (airport: string) => fixture.cities.find((c) => c.airport === airport)!;
const best = (airport: string) => city(airport).days.reduce((a, b) => (b.price < a.price ? b : a));
const WD = ["일", "월", "화", "수", "목", "금", "토"];
const md2 = (iso: string) => `${iso.slice(5, 7)}.${iso.slice(8, 10)}(${WD[new Date(`${iso}T00:00:00Z`).getUTCDay()]})`;
const CHIP: Record<string, string> = { NRT: "도쿄", KIX: "오사카", BKK: "방콕", CDG: "파리" };

async function openFlights(page: Page) {
  await page.goto("/flights");
  await page.waitForLoadState("load");
}
const hasData = async (page: Page) => (await tid(page, "airfare-chip").count()) > 0;
/** 값 의존 테스트 앞에서: 고정 자료가 아니면 건너뜀 (AIRFARE_FIXTURE=1 이면 실패로 셈) */
async function needData(page: Page) {
  await openFlights(page);
  const ok = await hasData(page);
  if (FIXTURE_REQUIRED) expect(ok, "고정 자료로 빌드한 사이트여야 함 (fixture-api.mjs)").toBe(true);
  else test.skip(!ok, "고정 자료가 아닌 빌드 — 달력 자료 없음");
}
const scrollToSection = (page: Page) => tid(page, "airfare-section").scrollIntoViewIfNeeded();
const chip = (page: Page, airport: string) => page.locator(`[data-testid="airfare-chip"][data-airport="${airport}"]`);
const pressed = async (page: Page) => page.locator('[data-testid="airfare-chip"][aria-pressed="true"]').getAttribute("data-airport");
/** 칸 · 표시 · 비행기 · 판 글자를 매 프레임 모음 (requestAnimationFrame) */
const RECORD = `
  (() => {
    const w = window; w.__af = []; w.__afstop = false; w.__aft0 = performance.now();
    const q = (s, r = document) => r.querySelector('[data-testid="' + s + '"]');
    const tick = () => {
      const sel = q("airfare-sel"), plane = q("airfare-plane"), pass = q("airfare-pass"), sc = q("airfare-scroll");
      const cells = [...document.querySelectorAll('[data-testid="airfare-day"]')];
      if (sel && sc) {
        const s = sel.getBoundingClientRect(), cs = getComputedStyle(sel), scr = sc.getBoundingClientRect();
        const selVisible = s.width > 0 && parseFloat(cs.opacity) > 0.5 && cs.visibility !== "hidden" && cs.display !== "none";
        w.__af.push({
          t: performance.now() - w.__aft0, scrollLeft: sc.scrollLeft,
          sel: { visible: selVisible, cx: s.left + s.width / 2, w: s.width, op: parseFloat(cs.opacity) },
          plane: plane ? { op: parseFloat(getComputedStyle(plane).opacity), cx: plane.getBoundingClientRect().left } : null,
          passOp: pass ? parseFloat(getComputedStyle(pass).opacity) : null,
          passX: pass ? pass.getBoundingClientRect().left : null,
          cells: cells.map((c) => {
            const r = c.getBoundingClientRect(), dt = q("airfare-day-dt", c), pr = q("airfare-day-pr", c), wd = q("airfare-day-wd", c);
            const eff = (el) => { let o = 1; for (let e = el; e && e !== document.body; e = e.parentElement) o *= parseFloat(getComputedStyle(e).opacity); return o; };
            return { d: c.getAttribute("data-depart"), cx: r.left + r.width / 2, l: r.left, w: r.width, inView: r.right > scr.left && r.left < scr.right,
              dtColor: dt ? getComputedStyle(dt).color : null, prColor: pr ? getComputedStyle(pr).color : null, wdColor: wd ? getComputedStyle(wd).color : null, op: eff(c), dtText: dt ? dt.textContent.trim() : null };
          }),
          fills: [...document.querySelectorAll('[data-testid="airfare-week-fill"]')].map((f) => f.getBoundingClientRect().width),
        });
      }
      if (!w.__afstop) requestAnimationFrame(tick);
    };
    tick();
  })()
`;
type Cell = { d: string; cx: number; l: number; w: number; inView: boolean; dtColor: string | null; prColor: string | null; wdColor: string | null; op: number; dtText: string | null };
type Fr = { t: number; scrollLeft: number; sel: { visible: boolean; cx: number; w: number; op: number }; plane: { op: number; cx: number } | null; passOp: number | null; passX: number | null; cells: Cell[]; fills: number[] };
const startRec = (page: Page) => page.evaluate(RECORD);
const stopRec = (page: Page) => page.evaluate(() => { const w = window as unknown as { __af: unknown[]; __afstop: boolean }; w.__afstop = true; return w.__af; }) as Promise<Fr[]>;
const WHITE = "rgb(255, 255, 255)";
const overlapsSel = (f: Fr, c: Cell) => f.sel.visible && Math.abs(f.sel.cx - c.cx) <= c.w * 0.5;

for (const size of SIZES) {
  test.describe(`항공권 출발일 달력 · ${size.name}`, () => {
    test.use({ viewport: size.viewport });
    test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name === "휴대폰", "화면 크기는 이 파일이 정함 — 휴대폰 프로젝트는 건너뜀"));

    // ───────── R1 · R2 · R10 (자료와 상관없이 항상) ─────────
    test("R1 구역 위치 — 창밖 12달(window-section) 바로 아래 · 기존 구역은 그대로", async ({ page }) => {
      await openFlights(page);
      await expect(tid(page, "flights-hero")).toHaveCount(1);
      const win = tid(page, "window-section");
      if ((await win.count()) === 0) test.skip(true, "창밖 12달 구역이 자료 조건으로 없음");
      const next = await win.evaluate((el) => el.nextElementSibling?.getAttribute("data-testid"));
      expect(next).toBe("airfare-section");
      await expect(tid(page, "flights-ticket")).toHaveCount(1); // 기존 hero 탑승권 · 빼거나 바꾸지 않음
      const order = await page.evaluate(() => ["flights-hero", "window-section", "airfare-section"].map((id) => document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().top ?? NaN));
      expect(order[0]).toBeLessThan(order[1]);
      expect(order[1]).toBeLessThan(order[2]);
    });

    test("R10 자료 유무 — 있으면 칩 · 탑승권 · 날짜 띠 / 없으면 '아직 받지 못했습니다' 와 숫자 없음 (지어내지 않음)", async ({ page }) => {
      await openFlights(page);
      const section = tid(page, "airfare-section");
      await expect(section).toHaveCount(1);
      const data = await hasData(page);
      if (data) {
        await expect(tid(page, "airfare-empty")).toHaveCount(0);
        await expect(tid(page, "airfare-day").first()).toBeAttached();
      } else {
        await expect(tid(page, "airfare-empty")).toContainText("아직 받지 못했습니다");
        for (const id of ["airfare-chip", "airfare-day", "airfare-pass", "airfare-board"]) await expect(tid(page, id), id).toHaveCount(0);
        expect(await section.innerText()).not.toMatch(/\d{2,3},\d{3}원/); // 가격 숫자를 만들지 않음
      }
    });

    test("R2 제목 위 라벨 · 제목 · 설명 한 줄 · 도시 칩(국기 + 이름)", async ({ page }) => {
      await openFlights(page);
      const section = tid(page, "airfare-section");
      await expect(section).toContainText("항공권 출발일 달력");
      await expect(page.locator("#airfare-title")).toHaveText("언제 떠나면 쌀까 — 인천 출발 1주 왕복");
      await expect(section).toHaveAttribute("aria-labelledby", "airfare-title");
      const label = await section.evaluate((el) => {
        const t = el.querySelector("#airfare-title")!.getBoundingClientRect().top;
        const l = [...el.querySelectorAll("p, span")].find((n) => n.textContent?.trim() === "항공권 출발일 달력")?.getBoundingClientRect().top;
        return { t, l: l ?? Number.NaN };
      });
      expect(label.l, "라벨은 제목 위").toBeLessThan(label.t);
      if (!(await hasData(page))) return;
      await expect(tid(page, "airfare-lede")).toBeVisible();
      const chips = tid(page, "airfare-chip");
      expect(await chips.count()).toBeGreaterThan(0);
      if (FIXTURE_REQUIRED) await expect(chips).toHaveCount(fixture.cities.length);
      for (const c of await chips.all()) {
        await expect(c.locator('[data-testid="airfare-chip-flag"]')).toBeVisible();
        const a = (await c.getAttribute("data-airport")) ?? "";
        if (CHIP[a]) await expect(c).toContainText(CHIP[a]);
      }
      expect(await page.locator('[data-testid="airfare-chip"][aria-pressed="true"]').count()).toBe(1);
    });

    // ───────── R3 · R4 · R5 · R6 · R7 (고정 자료) ─────────
    test("R3 탑승권 — 꼬리표 · ICN → 도착 공항 · 출발 · 돌아옴 · 글자판 가격 · 파인 동그라미 없음", async ({ page }) => {
      await needData(page);
      const b = best("NRT");
      expect(await pressed(page)).toBe("NRT"); // 첫 도시 = 고정 자료 첫 도시
      await expect(tid(page, "airfare-tag")).toHaveText("가장 싼 출발");
      await expect(tid(page, "airfare-pass")).toContainText("ICN");
      await expect(tid(page, "airfare-to")).toContainText("NRT");
      await expect(tid(page, "airfare-dep")).toHaveText(md2(b.depart));
      await expect(tid(page, "airfare-ret")).toHaveText(md2(b.return));
      await expect(tid(page, "airfare-board")).toHaveAttribute("data-final", String(b.price));
      await expect(tid(page, "airfare-board")).toHaveAttribute("aria-hidden", "true");
      await expect(tid(page, "airfare-price-sr")).toHaveText(`${b.price.toLocaleString("ko-KR")}원 · 12월 29일(화) 출발 1주 왕복`);
      const holes = await tid(page, "airfare-pass").evaluate((el) => [...el.querySelectorAll("[data-testid]")].map((n) => n.getAttribute("data-testid") ?? "").filter((t) => /hole|notch|punch/i.test(t)));
      expect(holes, "파인 동그라미 없음").toEqual([]);
    });

    test("R4 머리 문장 · 풀이 한 줄 — 도시를 바꾸면 따라 바뀜", async ({ page }) => {
      await needData(page);
      await expect(tid(page, "airfare-head")).toHaveText("도쿄는 12월 29일(화) 출발이 가장 쌉니다");
      await expect(tid(page, "airfare-sub")).toHaveText("12.29 → 01.05 왕복 · 가장 비싼 11월 23일(월) 출발(685,748원)보다 410,875원 쌈");
      await scrollToSection(page);
      await chip(page, "BKK").click();
      await expect(tid(page, "airfare-head")).toHaveText("방콕은 11월 24일(화) 출발이 가장 쌉니다");
      await chip(page, "CDG").click();
      await expect(tid(page, "airfare-head")).toHaveText("파리는 11월 27일(금) 출발이 가장 쌉니다");
    });

    test("R5 날짜 띠 — 칸 구성 · 칸 수 · ‹ › · 가장 싼 날 · 가격 색(아래 1/4 · 위 1/4)", async ({ page }) => {
      await needData(page);
      await scrollToSection(page);
      await page.waitForTimeout(1500);
      const days = tid(page, "airfare-day");
      await expect(days).toHaveCount(42);
      const first = days.first();
      await expect(first.locator('[data-testid="airfare-day-wd"]')).toHaveText("오늘");
      await expect(first.locator('[data-testid="airfare-day-dt"]')).toHaveText("20");
      await expect(first.locator('[data-testid="airfare-day-pr"]')).toHaveText((389700 / 10000).toFixed(1));
      // 보이는 칸 수 = 넓은 화면 14 · 휴대폰 7
      const visible = await page.evaluate(() => {
        const sc = document.querySelector('[data-testid="airfare-scroll"]')!.getBoundingClientRect();
        return [...document.querySelectorAll('[data-testid="airfare-day"]')].filter((c) => { const r = c.getBoundingClientRect(); return r.left >= sc.left - 1 && r.right <= sc.right + 1; }).length;
      });
      expect(visible).toBe(size.perView);
      // 가장 싼 날 노랑 테두리 · 가격 색 단계
      const bestDay = tid(page, "airfare-day").and(page.locator('[data-best="true"]'));
      await expect(bestDay).toHaveCount(1);
      await expect(bestDay).toHaveAttribute("data-depart", "2026-12-29");
      const border = await bestDay.evaluate((el) => { const s = getComputedStyle(el); return { c: s.borderTopColor, w: parseFloat(s.borderTopWidth), shadow: s.boxShadow, outline: s.outlineColor }; });
      expect(border.w > 0 || border.shadow !== "none" || border.outline !== "rgb(0, 0, 0)", "가장 싼 날 테두리").toBe(true);
      const sorted = city("NRT").days.map((d) => d.price).sort((a, b) => a - b);
      const q1 = sorted[Math.floor(sorted.length * 0.25)], q3 = sorted[Math.floor(sorted.length * 0.75)];
      for (const d of city("NRT").days) {
        const want = d.price <= q1 ? "low" : d.price >= q3 ? "high" : "mid";
        await expect(page.locator(`[data-testid="airfare-day"][data-depart="${d.depart}"]`), d.depart).toHaveAttribute("data-tier", want);
      }
      const colors = await page.evaluate(() => {
        const col = (t: string) => { const c = document.querySelector(`[data-testid="airfare-day"][data-tier="${t}"]:not([aria-pressed="true"]) [data-testid="airfare-day-pr"]`); return c ? getComputedStyle(c).color : null; };
        return { low: col("low"), mid: col("mid"), high: col("high") };
      });
      const rgb = (s: string | null) => (s?.match(/\d+/g) ?? []).slice(0, 3).map(Number);
      const [lr, , lb] = rgb(colors.low), [hr, , hb] = rgb(colors.high);
      expect(lb, "싼 편은 파랑 쪽").toBeGreaterThan(lr);
      expect(hr, "비싼 편은 빨강 쪽").toBeGreaterThan(hb);
      expect(colors.mid).not.toBe(WHITE);
      // ‹ › 버튼 · 범위 글
      await expect(tid(page, "airfare-prev")).toBeDisabled();
      await expect(tid(page, "airfare-range")).toContainText("11월 20일");
      await tid(page, "airfare-next").click();
      await expect.poll(() => tid(page, "airfare-scroll").evaluate((el) => el.scrollLeft), { timeout: 3000 }).toBeGreaterThan(20);
      await expect(tid(page, "airfare-prev")).toBeEnabled();
      await tid(page, "airfare-prev").click();
      await expect.poll(() => tid(page, "airfare-scroll").evaluate((el) => el.scrollLeft), { timeout: 3000 }).toBeLessThan(5);
    });

    test("R5 옆으로 밀기 — 가로로 밀 수 있음 · 문서가 가로로 넘치지 않음", async ({ page }) => {
      await needData(page);
      await scrollToSection(page);
      const m = await tid(page, "airfare-scroll").evaluate((el) => ({ sw: el.scrollWidth, cw: el.clientWidth, ox: getComputedStyle(el).overflowX }));
      expect(m.sw).toBeGreaterThan(m.cw);
      expect(["auto", "scroll"]).toContain(m.ox);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });

    test("R6 요일별 평균 막대 · 요약 두 항목", async ({ page }) => {
      await needData(page);
      await scrollToSection(page);
      await page.waitForTimeout(1500);
      const rows = tid(page, "airfare-week-row");
      await expect(rows).toHaveCount(7);
      expect(await rows.evaluateAll((els) => els.map((e) => e.textContent?.trim().slice(0, 1)))).toEqual(["월", "화", "수", "목", "금", "토", "일"]);
      const widths = await tid(page, "airfare-week-fill").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
      expect(Math.min(...widths)).toBeGreaterThan(0);
      expect(new Set(widths.map((w) => Math.round(w))).size).toBeGreaterThan(1); // 길이가 다름
      const facts = tid(page, "airfare-fact");
      await expect(facts).toHaveCount(2);
      await expect(facts.nth(0)).toContainText("가장 싼 요일");
      await expect(facts.nth(0)).toContainText(/(월|화|수|목|금|토|일)요일/);
      await expect(facts.nth(0)).toContainText(/출발 평균 \d+\.\d만 원으로, 가장 비싼 .요일보다 \d+\.\d만 원 쌉니다\./);
      await expect(facts.nth(1)).toContainText("출발일에 따른 차이");
      await expect(facts.nth(1)).toContainText("최대 2.5배");
      await expect(facts.nth(1)).toContainText("가장 싼 날 27.5만 원부터 가장 비싼 날 68.6만 원까지 벌어집니다.");
      expect(await tid(page, "airfare-section").innerText()).not.toMatch(/구글|싼 날로 표시/);
    });

    test("R7 맨 아래 한 줄 — 받은 날 · 제공처 설명 · 구글 링크 없음", async ({ page }) => {
      await needData(page);
      await expect(tid(page, "airfare-note")).toHaveText("11월 19일에 받은 가격이며, 실제 결제 가격과 다를 수 있습니다.");
      const section = tid(page, "airfare-section");
      const text = await section.innerText();
      expect(text).not.toMatch(/Google|구글 항공권|SerpApi|serpapi|3일 \/ 42일|싼 날로 표시/);
      expect(await section.locator('a[href*="google"], a[href*="serpapi"]').count()).toBe(0);
      const noteBottom = await page.evaluate(() => { const n = document.querySelector('[data-testid="airfare-note"]')!.getBoundingClientRect().bottom; const s = document.querySelector('[data-testid="airfare-section"]')!.getBoundingClientRect(); return { n, s: s.bottom }; });
      expect(noteBottom.s - noteBottom.n, "안내는 구역 맨 아래").toBeLessThan(200);
    });

    // ───────── R8 움직임 ─────────
    test("R8 고른 날 표시 위치는 칸의 실제 픽셀 자리 — 칸 가운데와 1px 안 · 너비 같음 · 퍼센트 아님 (사파리 16px 어긋남)", async ({ page }) => {
      await needData(page);
      await scrollToSection(page);
      await page.waitForTimeout(2500);
      const check = async (label: string) => {
        const r = await page.evaluate(() => {
          const sel = document.querySelector('[data-testid="airfare-sel"]') as HTMLElement;
          const cell = document.querySelector('[data-testid="airfare-day"][aria-pressed="true"]') as HTMLElement;
          const s = sel.getBoundingClientRect(), c = cell.getBoundingClientRect();
          return { dx: Math.abs(s.left + s.width / 2 - (c.left + c.width / 2)), dw: Math.abs(s.width - c.width), left: sel.style.left, width: sel.style.width, transform: sel.style.transform };
        });
        expect(r.dx, `${label} 가운데 차이`).toBeLessThanOrEqual(1);
        expect(r.dw, `${label} 너비 차이`).toBeLessThanOrEqual(1);
        expect(`${r.left} ${r.width} ${r.transform}`, `${label} 퍼센트 금지`).not.toContain("%");
        expect(r.width === "" || /px$/.test(r.width), `${label} 너비는 px`).toBe(true);
      };
      await check("처음");
      await tid(page, "airfare-day").nth(20).click();
      await page.waitForTimeout(900);
      await check("고른 뒤");
      await page.setViewportSize({ width: size.viewport.width === 1280 ? 1100 : 360, height: size.viewport.height });
      await page.waitForTimeout(600);
      await check("너비 바꾼 뒤");
    });

    test("R8 날짜를 누르면 파랑이 그 칸으로 미끄러지고 탑승권 날짜 · 글자판 가격 · 꼬리표가 바뀜", async ({ page }) => {
      await needData(page);
      await scrollToSection(page);
      await page.waitForTimeout(2500);
      const target = city("NRT").days[18]; // 12-08
      const cell = page.locator(`[data-testid="airfare-day"][data-depart="${target.depart}"]`);
      await cell.scrollIntoViewIfNeeded();
      await startRec(page);
      await cell.click();
      await page.waitForTimeout(900);
      const fr = await stopRec(page);
      const centers = fr.map((f) => f.sel.cx);
      const end = fr.at(-1)!.cells.find((c) => c.d === target.depart)!.cx;
      expect(Math.abs(centers.at(-1)! - end)).toBeLessThanOrEqual(1);
      expect(Math.max(...centers) - Math.min(...centers), "미끄러진 거리").toBeGreaterThan(fr[0].cells[0].w);
      expect(centers.filter((x, i) => i > 0 && Math.abs(x - centers[i - 1]) > 0.5).length, "여러 프레임에 걸쳐 이동").toBeGreaterThan(3);
      await expect(tid(page, "airfare-tag")).toHaveText("고른 출발");
      await expect(tid(page, "airfare-dep")).toHaveText(md2(target.depart));
      await expect(tid(page, "airfare-ret")).toHaveText(md2(target.return));
      await expect(tid(page, "airfare-board")).toHaveAttribute("data-final", String(target.price));
      await expect(tid(page, "airfare-sub")).toContainText("고른 날");
      await expect(cell).toHaveAttribute("aria-pressed", "true");
      // 가장 싼 날을 다시 누르면 꼬리표가 돌아옴
      const b = best("NRT");
      await page.locator(`[data-testid="airfare-day"][data-depart="${b.depart}"]`).click();
      await expect(tid(page, "airfare-tag")).toHaveText("가장 싼 출발");
      await expect(tid(page, "airfare-board")).toHaveAttribute("data-final", String(b.price));
    });

    test("R8 글자색 — 파랑 표시 위에서만 흰색 · 파랑이 없을 때 날짜 · 가격은 늘 보임 (도시를 바꾸는 내내)", async ({ page }) => {
      await needData(page);
      await scrollToSection(page);
      await page.waitForTimeout(2500);
      const sequence = ["BKK", "CDG", "KIX", "NRT"];
      for (const a of sequence) {
        await startRec(page);
        await chip(page, a).click();
        await page.waitForTimeout(2600);
        const fr = await stopRec(page);
        for (const f of fr) {
          for (const c of f.cells.filter((x) => x.inView)) {
            const white = c.dtColor === WHITE || c.prColor === WHITE;
            if (white) expect(overlapsSel(f, c), `${a} t=${Math.round(f.t)} ${c.d} 흰 글자인데 파랑 표시 아래가 아님`).toBe(true);
            if (!overlapsSel(f, c)) expect(c.dtColor, `${a} t=${Math.round(f.t)} ${c.d} 날짜 글자가 흰색`).not.toBe(WHITE);
          }
        }
        const last = fr.at(-1)!;
        const bd = best(a);
        const bc = last.cells.find((c) => c.d === bd.depart)!;
        expect(overlapsSel(last, bc), `${a} 끝: 파랑이 가장 싼 날`).toBe(true);
        expect(bc.dtColor, `${a} 끝: 고른 칸 글자 흰색`).toBe(WHITE);
        expect(last.cells.filter((c) => c.dtColor === WHITE).length, `${a} 끝: 흰 글자는 고른 칸 하나`).toBe(1);
      }
    });

    test("R8 도시를 바꿀 때 띠가 흘러가야 하면 — 날짜는 그대로 · 파랑 없음 → 비행기 → 내려앉는 순간 파랑 (두 번째 비행도 보임)", async ({ page }) => {
      await needData(page);
      await scrollToSection(page);
      await page.waitForTimeout(2500);
      for (const [from, to] of [["NRT", "BKK"], ["BKK", "NRT"]] as const) {
        expect(await pressed(page)).toBe(from);
        const before = await page.evaluate(() => [...document.querySelectorAll('[data-testid="airfare-day-dt"]')].map((e) => e.textContent?.trim()));
        const scrollBefore = await tid(page, "airfare-scroll").evaluate((el) => el.scrollLeft);
        await startRec(page);
        await chip(page, to).click();
        await page.waitForTimeout(3200);
        const fr = await stopRec(page);
        const after = await page.evaluate(() => [...document.querySelectorAll('[data-testid="airfare-day-dt"]')].map((e) => e.textContent?.trim()));
        expect(after, `${from}→${to} 날짜가 그대로`).toEqual(before);
        // 날짜가 떠오르는 움직임은 처음 한 번만 — 도시를 바꿀 때 보이는 칸은 흐려지지 않음
        for (const f of fr) for (const c of f.cells.filter((x) => x.inView)) expect(c.op, `${to} t=${Math.round(f.t)} ${c.d} 흐려짐`).toBeGreaterThan(0.95);
        // 띠가 실제로 흘러감(보던 자리에서 출발)
        expect(Math.abs(fr[0].scrollLeft - scrollBefore), "보던 자리에서 출발").toBeLessThan(40);
        const moved = Math.max(...fr.map((f) => f.scrollLeft)) - Math.min(...fr.map((f) => f.scrollLeft));
        expect(moved, "띠가 흘러감").toBeGreaterThan(size.perView * 5);
        // 비행기: 흐르는 동안 보임 · 그동안 파랑 표시 없음 · 내려앉은 뒤 파랑
        const flying = fr.filter((f) => (f.plane?.op ?? 0) > 0.5);
        expect(flying.length, `${from}→${to} 비행기가 보인 프레임`).toBeGreaterThan(10);
        expect(flying.every((f) => !f.sel.visible), "비행 중에는 파랑 표시 없음").toBe(true);
        const landIdx = fr.findIndex((f, i) => i > fr.indexOf(flying[0]) && f.sel.visible);
        expect(landIdx, "내려앉은 뒤 파랑이 나타남").toBeGreaterThan(0);
        const lastFlight = fr.indexOf(flying.at(-1)!);
        expect(landIdx - lastFlight, "비행기가 내려앉는 순간 파랑 (몇 프레임 안)").toBeLessThanOrEqual(8);
        const bd = best(to);
        const landed = fr[landIdx];
        expect(overlapsSel(landed, landed.cells.find((c) => c.d === bd.depart)!), "파랑이 가장 싼 날 위").toBe(true);
        // 파랑이 나타나기 전에는 흰 글자 없음
        for (const f of fr.slice(0, landIdx)) expect(f.cells.some((c) => c.inView && (c.dtColor === WHITE || c.prColor === WHITE)), `t=${Math.round(f.t)} 파랑 없는데 흰 글자`).toBe(false);
        // 비행기 사라짐 — 끝에는 보이지 않음
        expect(fr.at(-1)!.plane?.op ?? 0).toBeLessThan(0.05);
      }
    });

    test("R8 도시를 바꿔도 띠가 움직이지 않으면 — 기다리지 않고 바로 파랑(앞서 고른 칸에서 미끄러져 옴) · 비행기 없음", async ({ page }) => {
      await needData(page);
      await scrollToSection(page);
      await page.waitForTimeout(2500);
      await chip(page, "BKK").click(); // 방콕 → 파리: 둘 다 띠 맨 앞에 놓여 띠가 움직이지 않음
      await page.waitForTimeout(3200);
      expect(await pressed(page)).toBe("BKK");
      const scrollBefore = await tid(page, "airfare-scroll").evaluate((el) => el.scrollLeft);
      await startRec(page);
      await chip(page, "CDG").click();
      await page.waitForTimeout(1500);
      const fr = await stopRec(page);
      const moved = Math.max(...fr.map((f) => f.scrollLeft)) - Math.min(...fr.map((f) => f.scrollLeft));
      expect(moved, "띠는 움직이지 않음").toBeLessThan(4);
      expect(Math.abs(fr.at(-1)!.scrollLeft - scrollBefore)).toBeLessThan(4);
      expect(Math.max(...fr.map((f) => f.plane?.op ?? 0)), "비행기 없음").toBeLessThan(0.05);
      const bd = best("CDG");
      const firstShown = fr.findIndex((f) => f.sel.visible);
      expect(firstShown, "파랑이 바로 보임").toBeGreaterThanOrEqual(0);
      expect(fr[firstShown].t, "기다리지 않음(0.3초 안)").toBeLessThan(300);
      const target = (f: Fr) => f.cells.find((c) => c.d === bd.depart)!.cx;
      const last = fr.at(-1)!;
      expect(Math.abs(last.sel.cx - target(last))).toBeLessThanOrEqual(1);
      // 앞서 고른 칸(방콕 가장 싼 날)에서 미끄러져 옴
      const prevBest = best("BKK").depart;
      const early = fr[firstShown];
      expect(Math.abs(early.sel.cx - early.cells.find((c) => c.d === prevBest)!.cx), "앞서 고른 칸 근처에서 시작").toBeLessThan(early.cells[0].w * 2);
      expect(Math.abs(early.sel.cx - target(early)), "처음에는 목표에서 떨어져 있음").toBeGreaterThan(early.cells[0].w);
      // 글자는 파랑과 같은 순간에만 흰색 (미끄러지는 동안에도)
      for (const f of fr) for (const c of f.cells.filter((x) => x.inView)) {
        if (c.dtColor === WHITE) expect(overlapsSel(f, c), `t=${Math.round(f.t)} ${c.d}`).toBe(true);
        if (!overlapsSel(f, c)) expect(c.dtColor).not.toBe(WHITE);
      }
      expect(last.cells.filter((c) => c.dtColor === WHITE).length).toBe(1);
    });

    test("R8 처음 화면에 들어올 때만 — 날짜가 왼쪽부터 떠오르고 · 탑승권은 왼쪽에서 들어오고 · 요일 막대가 자람", async ({ page }) => {
      await needData(page);
      await page.addInitScript(RECORD.replace("(() => {", "document.addEventListener('DOMContentLoaded', () => {").replace(/\}\)\(\)\s*$/, "});"));
      await openFlights(page);
      await page.waitForTimeout(300);
      await scrollToSection(page);
      await page.waitForTimeout(3000);
      const fr = await stopRec(page);
      expect(fr.filter((f) => f.cells.some((c) => c.inView)).length).toBeGreaterThan(20);
      // 날짜: 첫 칸이 마지막 보이는 칸보다 먼저 나타남(왼쪽부터) · 한때는 흐렸음
      const inViewIdx = (f: Fr) => f.cells.map((c, i) => (c.inView ? i : -1)).filter((i) => i >= 0);
      const t90 = (idx: number) => fr.find((f) => f.cells[idx] && f.cells[idx].op > 0.9)?.t ?? Number.POSITIVE_INFINITY;
      const idxs = inViewIdx(fr.at(-1)!);
      expect(fr.some((f) => f.cells[idxs[0]].op < 0.5), "처음에는 날짜가 아직 없음").toBe(true);
      expect(t90(idxs[0]), "왼쪽 칸이 먼저").toBeLessThan(t90(idxs[Math.min(idxs.length - 1, 8)]));
      // 탑승권: 왼쪽에서 들어옴(처음에는 최종 자리보다 왼쪽 · 흐림) → 제자리
      const finalX = fr.at(-1)!.passX!;
      expect(Math.min(...fr.filter((f) => f.passX !== null).map((f) => f.passX!)), "탑승권이 왼쪽에서 들어옴").toBeLessThan(finalX - 20);
      expect(Math.abs(fr.at(-1)!.passX! - finalX)).toBeLessThan(1);
      expect(fr.at(-1)!.passOp).toBeGreaterThan(0.99);
      // 요일 막대: 자람 — 처음 너비가 끝 너비보다 훨씬 작음
      const grow = fr.filter((f) => f.fills.length === 7);
      expect(grow.length).toBeGreaterThan(0);
      const endW = grow.at(-1)!.fills;
      expect(Math.min(...grow.map((f) => f.fills[0])), "막대가 자람").toBeLessThan(endW[0] * 0.5);
      // 도시를 바꾸면 날짜 떠오름이 다시 일어나지 않음 (R8 첫 줄과 같은 규칙 — 위 흘러가는 테스트가 확인) · 탑승권도 다시 들어오지 않음
      await startRec(page);
      await chip(page, "KIX").click();
      await page.waitForTimeout(1500);
      const again = await stopRec(page);
      expect(Math.min(...again.map((f) => f.passX ?? finalX)), "탑승권이 다시 들어오지 않음").toBeGreaterThan(finalX - 2);
      expect(Math.min(...again.map((f) => f.passOp ?? 1))).toBeGreaterThan(0.99);
    });

    test("R8 움직임 줄이기(prefers-reduced-motion) — 움직임 없이 바로 최종 상태", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await needData(page);
      await scrollToSection(page);
      await startRec(page);
      await page.waitForTimeout(250);
      const first = (await stopRec(page))[0];
      // 들어오자마자: 탑승권 제자리 · 날짜 모두 보임 · 파랑이 가장 싼 날 위 · 비행기 없음 · 막대는 최종 너비
      expect(first.passOp).toBeGreaterThan(0.99);
      expect(first.cells.filter((c) => c.inView).every((c) => c.op > 0.99)).toBe(true);
      const bd = best("NRT");
      const bc = first.cells.find((c) => c.d === bd.depart)!;
      expect(first.sel.visible).toBe(true);
      expect(Math.abs(first.sel.cx - bc.cx)).toBeLessThanOrEqual(1);
      expect(first.fills.every((w) => w > 20)).toBe(true);
      await expect(tid(page, "airfare-board")).toHaveAttribute("data-final", String(bd.price));
      // 도시를 바꿔도 바로 끝 상태: 비행기 없음 · 띠가 바로 그 자리 · 파랑이 바로 가장 싼 날
      await startRec(page);
      await chip(page, "BKK").click();
      await page.waitForTimeout(500);
      const fr = await stopRec(page);
      expect(Math.max(...fr.map((f) => f.plane?.op ?? 0))).toBeLessThan(0.05);
      const b2 = best("BKK");
      const late = fr.at(-1)!;
      expect(Math.abs(late.sel.cx - late.cells.find((c) => c.d === b2.depart)!.cx)).toBeLessThanOrEqual(1);
      const settled = fr.find((f) => f.t > 120)!;
      expect(settled.sel.visible, "0.12초 뒤에는 이미 파랑").toBe(true);
      expect(Math.abs(settled.sel.cx - settled.cells.find((c) => c.d === b2.depart)!.cx), "미끄러지지 않고 바로").toBeLessThanOrEqual(1);
      await expect(tid(page, "airfare-board")).toHaveAttribute("data-final", String(b2.price));
      // 날짜를 눌러도 바로
      const t = city("BKK").days[20];
      await page.locator(`[data-testid="airfare-day"][data-depart="${t.depart}"]`).click();
      await page.waitForTimeout(150);
      const sel = await page.evaluate((d) => {
        const s = document.querySelector('[data-testid="airfare-sel"]')!.getBoundingClientRect();
        const c = document.querySelector(`[data-testid="airfare-day"][data-depart="${d}"]`)!.getBoundingClientRect();
        return Math.abs(s.left + s.width / 2 - (c.left + c.width / 2));
      }, t.depart);
      expect(sel).toBeLessThanOrEqual(1);
    });
  });
}

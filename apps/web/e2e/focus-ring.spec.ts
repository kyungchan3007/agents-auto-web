// 작업 0271(패치) — 키보드 초점 고리를 지키는 기능 e2e (사용자가 정한 조건: 시안 43번 · 작업 0269)
//   키보드(Tab)로 옮겨 갔을 때 고리가 보여야 함: outline-style 이 none 이 아님 · 굵기 2px · 바깥 간격 2px(날짜 칸처럼 칸이 서로 붙은 곳 · 잘리는 곳은 안쪽 -4px)
//   색: 밝은 면 위에서는 파랑 #2438A8 · 파란(#2438A8) · 남색(#16246E) 면 위에서는 흰색 #FFFFFF(투명도 없는 흰색)
//   0269 가 놓친 곳: 출발일 달력(도시 칩 · 앞뒤 단추 · 날짜 칸)은 층 밖 all:unset 이 공용 고리를 이겨 고리가 아예 없었음 → 공용 규칙을 층 밖 규칙이 이기는 곳이 다시 생기지 않게 대상 화면을 Tab 으로 끝까지 걸으며 모든 초점 요소를 검사
//   마우스 · 손가락으로 누를 때는 고리가 없어야 함(:focus-visible 아님)
//   제외: /geo · /log(대상 아님) · 보이지 않는 입력(라벨이 고리를 그림: [data-ring-host])
import { type Page, expect, test } from "@playwright/test";

const BLUE = "rgb(36, 56, 168)";
const NAVY = "rgb(22, 36, 110)";
const WHITE = "rgb(255, 255, 255)";
const PAGES = ["/", "/flights", "/prices", "/currencies/USD", "/calc", "/about"];
const MAX_TABS = 220;

type Stop = { key: string; label: string; testid: string; tag: string; style: string; width: number; offset: number; color: string; surface: string; hostRing: boolean };

/** 페이지를 Tab 으로 끝까지 걸으며 초점이 간 요소마다 고리 값 · 놓인 면의 색을 기록 */
async function walk(page: Page): Promise<Stop[]> {
  const stops: Stop[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < MAX_TABS; i++) {
    await page.keyboard.press("Tab");
    const s = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const cs = getComputedStyle(el);
      // 고리가 놓이는 면: 바깥 고리(간격 ≥ 0)는 요소 바깥이라 부모 쪽 면 · 안쪽 고리(음수 간격)는 요소 자신의 면 (흰 입력 칸이 파란 띠 위에 있으면 고리는 파란 면 위)
      const outer = (parseFloat(cs.outlineOffset) || 0) >= 0;
      const surface = (() => {
        for (let p: HTMLElement | null = outer ? el.parentElement : el; p; p = p.parentElement) {
          const m = getComputedStyle(p).backgroundColor.match(/rgba?\(([^)]+)\)/);
          if (m) {
            const [r, g, b, a = "1"] = m[1].split(",").map((x) => x.trim());
            if (Number(a) > 0.5) return `rgb(${r}, ${g}, ${b})`;
          }
        }
        return "rgb(255, 255, 255)";
      })();
      const rect = el.getBoundingClientRect();
      const host = el.closest("[data-ring-host]") as HTMLElement | null;
      const label = `${el.tagName.toLowerCase()}${el.dataset.testid ? `[${el.dataset.testid}]` : ""} "${(el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 18)}"`;
      return {
        key: `${label}@${Math.round(rect.left)},${Math.round(rect.top + window.scrollY)}`,
        label,
        testid: el.dataset.testid ?? "",
        tag: el.tagName.toLowerCase(),
        style: cs.outlineStyle,
        width: parseFloat(cs.outlineWidth) || 0,
        offset: parseFloat(cs.outlineOffset) || 0,
        color: cs.outlineColor,
        surface,
        hostRing: !!host && getComputedStyle(host).outlineStyle !== "none" && (parseFloat(getComputedStyle(host).outlineWidth) || 0) > 0,
      };
    });
    if (!s) continue;
    if (seen.has(s.key)) break; // 한 바퀴 돌았음
    seen.add(s.key);
    stops.push(s);
  }
  return stops;
}

/** 이 요소가 고리를 직접 그리지 않고 라벨(data-ring-host)이 그리는 보이지 않는 입력인지 */
const hostDrawn = (s: Stop) => s.hostRing && s.style === "none";

test.describe("키보드 초점 고리 (작업 0269 → 0271)", () => {
  for (const path of PAGES) {
    test(`${path} — Tab 으로 가는 모든 요소에 고리가 있음(none 아님 · 2px · 간격 2px 또는 안쪽 -4px) · 색은 밝은 면 파랑 · 파란 · 남색 면 흰색`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const stops = await walk(page);
      expect(stops.length, "Tab 으로 닿은 요소 수").toBeGreaterThan(3);
      const bad: string[] = [];
      for (const s of stops) {
        if (hostDrawn(s)) continue;
        const dark = s.surface === BLUE || s.surface === NAVY;
        const want = dark ? WHITE : BLUE;
        const issues: string[] = [];
        if (s.style === "none") issues.push("고리 없음(outline none)");
        else {
          if (Math.abs(s.width - 2) > 0.1) issues.push(`굵기 ${s.width}px`);
          if (s.offset !== 2 && s.offset !== -4) issues.push(`간격 ${s.offset}px`);
          if (s.color !== want) issues.push(`색 ${s.color} (${dark ? "파란 · 남색" : "밝은"} 면 위 → ${want})`);
        }
        if (issues.length) bad.push(`${s.label}: ${issues.join(" · ")}`);
      }
      expect(bad, `고리가 규칙과 다른 곳 ${bad.length}곳`).toEqual([]);
    });
  }

  test("/flights 출발일 달력 — 도시 칩 · 앞뒤 단추 · 날짜 칸 모두 Tab 으로 닿고 고리가 있음 · 날짜 칸은 칸 안쪽(-4px)", async ({ page }) => {
    await page.goto("/flights");
    await page.waitForLoadState("networkidle");
    const stops = await walk(page);
    const chips = stops.filter((s) => s.testid === "airfare-chip");
    const days = stops.filter((s) => s.testid === "airfare-day");
    const nav = stops.filter((s) => s.testid === "airfare-prev" || s.testid === "airfare-next");
    test.skip(chips.length + days.length + nav.length === 0, "출발일 달력 자료 없음");
    expect(chips.length, "도시 칩에 닿음").toBeGreaterThan(0);
    expect(days.length, "날짜 칸에 닿음").toBeGreaterThan(0);
    expect(nav.length, "앞뒤 단추에 닿음(맨 앞에서는 앞 단추가 꺼져 있어 뒤 단추만)").toBeGreaterThan(0);
    for (const s of [...chips, ...nav, ...days]) {
      expect(s.style, `${s.label} 고리`).not.toBe("none");
      expect(s.width, `${s.label} 굵기`).toBeCloseTo(2, 1);
      expect(s.color, `${s.label} 색`).toBe(BLUE);
    }
    for (const s of [...chips, ...nav]) expect(s.offset, `${s.label} 바깥 간격`).toBe(2);
    for (const s of days) expect(s.offset, `${s.label} 칸 안쪽 간격`).toBe(-4);
  });

  test("로고 · 메뉴 · 도시 칩 · 입력 칸 · select 도 같은 고리 — 대상 화면 몇 곳에서 반드시 닿음", async ({ page }) => {
    const reached: Record<string, number> = { 로고: 0, "메뉴 링크 · 버튼": 0, "홈 도시 칩": 0, "입력 칸(input)": 0, select: 0 };
    for (const path of ["/", "/prices", "/calc"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      for (const s of await walk(page)) {
        if (hostDrawn(s)) continue;
        if (/^a "flapfx|^a "$/i.test(s.label) || s.label.startsWith('a "flapfx')) reached["로고"]++;
        if (s.tag === "button" && /메뉴/.test(s.label)) reached["메뉴 링크 · 버튼"]++;
        if (s.testid === "pick-chip") reached["홈 도시 칩"]++;
        if (s.tag === "input") reached["입력 칸(input)"]++;
        if (s.tag === "select") reached["select"]++;
        if (["input", "select"].includes(s.tag) || s.testid === "pick-chip") {
          const dark = s.surface === BLUE || s.surface === NAVY;
          expect(s.style, `${path} ${s.label} 고리`).not.toBe("none");
          expect(s.color, `${path} ${s.label} 색(남색이 아니라 규칙의 파랑)`).toBe(dark ? WHITE : BLUE);
        }
      }
    }
    expect(reached["입력 칸(input)"], "입력 칸에 닿음").toBeGreaterThan(0);
    expect(reached["select"], "select 에 닿음").toBeGreaterThan(0);
    expect(reached["홈 도시 칩"], "홈 도시 칩에 닿음").toBeGreaterThan(0);
  });

  test("마우스로 누를 때는 고리가 없음 — 누른 단추 · 링크에 :focus-visible 고리가 안 그려짐", async ({ page }) => {
    await page.goto("/currencies/USD");
    await page.waitForLoadState("networkidle");
    const btn = page.locator('[data-testid="year-flow"] button[aria-pressed]').first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click(); // 마우스 클릭(포인터)
    const r = await btn.evaluate((el) => ({ fv: el.matches(":focus-visible"), style: getComputedStyle(el).outlineStyle, width: parseFloat(getComputedStyle(el).outlineWidth) || 0 }));
    expect(r.fv, "마우스로 누르면 :focus-visible 이 아님").toBe(false);
    expect(r.style === "none" || r.width === 0, "그래서 고리가 없음").toBe(true);
  });
});

// 작업 0396 — 나라 물가 요약 칸(시안 B) · 환율 없음 안내를 방문자 말로 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   값은 운영 API 에서 빌드 때 받은 것 — 베트남(VNM)은 수출입은행이 동(VND)을 주지 않아 환율 없음 · 일본(JPY)은 있음
//   builder 가 다는 표시(data-testid) — shared/facts/facts-card.tsx 의 FactsCard id="country" (홈은 id="hero" 로 같은 부품 · 지금 testid 그대로)
//     country-facts           요약 칸(글래스) 루트 · 나라 페이지 머리 구역 왼쪽 설명 아래(900 이상 왼쪽 칸 · 899 이하 설명 아래 흐름)
//     country-facts-title     "{나라}" (예 "일본") · 옆에 "오늘 기준"
//     country-fact-rate / country-fact-tenk / country-fact-price   오늘 환율 · 1만원이면 · 물가 — 환율 없는 나라는 rate · tenk 칸이 아예 없음(빈 칸 · "-" 로 남기지 않음)
//     country-fact-bar(role=img) · country-fact-position   90일 막대 + "오늘은 90일 중 … (n%의 날보다 낮음)" — 환율 없는 나라는 둘 다 없음
//     country-facts-note      환율 없는 나라의 한 줄 "{나라} 환율은 아직 제공되지 않습니다" (환율이 있으면 없음)
//   예산 카드: [data-testid="budget"] · 환율 없는 나라의 안내 [data-testid="data-empty"] — 제목만 + 링크("그동안 볼 수 있는 것") · 이름표 · 이유 문단 없음
import { type Locator, type Page, expect, test } from "@playwright/test";
import { hydrated } from "./helpers";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const box = async (loc: Locator, name: string) => {
  const b = await loc.first().boundingBox();
  if (!b) throw new Error(`${name} 가 화면에 없음`);
  return b;
};
// 문서 기준 위치(스크롤과 무관) — 입력을 채우면 화면이 스크롤되어 뷰포트 기준 y 가 바뀜
const docBox = async (loc: Locator, name: string) => {
  const b = await box(loc, name);
  const sy = await loc.first().page().evaluate(() => window.scrollY);
  return { ...b, y: b.y + sy };
};
// 왼쪽 칸의 마지막 상자 아래 끝(문서 기준) — 작업 0397 로 한 줄 답 상자를 지워 요약 칸이 마지막
const leftBottom = async (page: Page) => {
  const f = await docBox(tid(page, "country-facts"), "facts");
  return f.y + f.height;
};
const hScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const BAD = [/한국수출입은행이/, /30분마다/, /사이트를 새로 만들/, /자료 없음 · /, /\d{4}-\d{2}-\d{2} \d{2}:\d{2} 확인/];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("flapfx:intro-off", "1"));
});

test.describe("일본(환율 있음) — 숫자 셋 + 90일 막대", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prices/JPN");
  });

  test("요약 칸: 제목 일본 · 오늘 환율 · 1만원이면 · 물가 · 막대 · 위치 문장 · 안내 한 줄 없음", async ({ page }) => {
    const c = tid(page, "country-facts");
    await expect(c).toBeVisible();
    await expect(tid(page, "country-facts-title")).toHaveText(/^일본/);
    await expect(c).toContainText("오늘 기준");
    await expect(tid(page, "country-fact-rate")).toContainText(/\d[\d,.]*원/);
    await expect(tid(page, "country-fact-rate")).toContainText("1엔");
    await expect(tid(page, "country-fact-tenk")).toContainText(/[\d,]+/);
    await expect(tid(page, "country-fact-tenk")).toContainText("엔");
    await expect(tid(page, "country-fact-price")).toHaveText(/\d+% (높음|낮음)|비슷/);
    await expect(tid(page, "country-fact-bar")).toBeVisible();
    await expect(tid(page, "country-fact-position")).toHaveText(/^오늘은 90일 중 (낮은 편|보통|높은 편) \(\d+%의 날보다 낮음\)$/);
    await expect(tid(page, "country-facts-note")).toHaveCount(0);
    await expect(c).not.toContainText("쌈");
  });

  test("값이 있는 칸에 \"-\" 가 없음 · 서버 첫 그림(자바스크립트 없이)에 요약 값이 들어 있음", async ({ page }) => {
    for (const id of ["country-fact-rate", "country-fact-tenk", "country-fact-price", "country-fact-position"]) expect(((await tid(page, id).textContent()) ?? "").trim(), id).not.toBe("-");
    const h = await (await page.request.get("/prices/JPN")).text();
    expect(h).toContain('data-testid="country-facts"');
    expect(h).toMatch(/오늘은 90일 중 (낮은 편|보통|높은 편) \(\d+%의 날보다 낮음\)/);
  });

  test("예산 카드는 그대로 — 금액이 나오고 안내 카드 없음", async ({ page }) => {
    await expect(tid(page, "budget-total")).toBeVisible();
    await expect(tid(page, "budget").locator('[data-testid="data-empty"]')).toHaveCount(0);
  });
});

test.describe("베트남(환율 없음) — 물가만 + 안내 · 개발자 말 없음", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prices/VNM");
  });

  test("요약 칸: 물가만 크게 · 환율 · 1만원이면 · 90일 칸은 그리지 않음 · 안내 한 줄", async ({ page }) => {
    const c = tid(page, "country-facts");
    await expect(c).toBeVisible();
    await expect(tid(page, "country-facts-title")).toHaveText(/^베트남/);
    await expect(tid(page, "country-fact-price")).toHaveText(/\d+% 낮음/);
    for (const id of ["country-fact-rate", "country-fact-tenk", "country-fact-bar", "country-fact-position"]) await expect(tid(page, id), `${id} 는 그리지 않음`).toHaveCount(0);
    await expect(tid(page, "country-facts-note")).toHaveText("베트남 환율은 아직 제공되지 않습니다");
    const text = (await c.innerText()).trim();
    expect(text, "빈 칸 · \"-\" 로 남기지 않음").not.toMatch(/(^|\s)-(\s|$)/);
  });

  test("예산 카드: 안내는 방문자 말 — 베트남 환율은 아직 제공되지 않습니다 · 링크 둘 · 이름표 · 개발자 문단 없음", async ({ page }) => {
    const card = tid(page, "budget").locator('[data-testid="data-empty"]');
    await expect(card).toBeVisible();
    await expect(card).toContainText("베트남 환율은 아직 제공되지 않습니다");
    await expect(card).toContainText("그동안 볼 수 있는 것");
    expect(await card.getByRole("link").evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(["/currencies", "/calc"]);
    const all = await page.locator("main").innerText();
    for (const re of BAD) expect(all, String(re)).not.toMatch(re);
    expect(await page.content()).not.toContain("한국수출입은행이 오늘 값을");
  });
});

// 높이 · 위치: 입력 · 나라 바꿈 · 로딩으로 머리 구역 높이와 아래 구역 위치가 움직이지 않음 (R4 · no-layout-shift)
test.describe("높이 · 위치 고정", () => {
  test("일본 — 입력(금액 · 일수) · 나라 바꿈(태국) 전후 머리 구역 높이 · 요약 칸 · 아래 구역 위치 같음", async ({ page }) => {
    await page.goto("/prices/JPN");
    await hydrated(tid(page, "budget"));
    const read = async () => ({
      budget: (await docBox(tid(page, "budget"), "budget")).y + (await docBox(tid(page, "budget"), "budget")).height,
      facts: await docBox(tid(page, "country-facts"), "facts"),
      next: (await docBox(tid(page, "next-card"), "next-card")).y,
    });
    const before = await read();
    const nextBefore = before.next;
    await page.getByLabel("한국에서 하루 쓰는 돈 (원)").fill("250,000");
    await page.getByLabel("일수").fill("7");
    await tid(page, "budget").getByLabel("나라").selectOption({ label: "태국" });
    await expect(tid(page, "budget-total")).toBeVisible();
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
    const after = await read();
    expect(Math.abs(after.next - nextBefore), "아래 구역 위치").toBeLessThanOrEqual(1);
    expect(Math.abs(after.facts.y - before.facts.y), "요약 칸 위치").toBeLessThanOrEqual(1);
    expect(Math.abs(after.facts.height - before.facts.height), "요약 칸 높이").toBeLessThanOrEqual(1);
    expect(Math.abs(after.budget - before.budget) <= 200, "예산 카드가 오른쪽에서 자라도 아래 구역은 그대로(위 검사)").toBe(true);
  });

  test("베트남 — 입력 전후 요약 칸 · 아래 구역 위치 같음 · 하이드레이션 전후도 같음", async ({ page }) => {
    await page.goto("/prices/VNM");
    const nextEarly = (await docBox(tid(page, "next-card"), "next-card")).y;
    const factsEarly = await docBox(tid(page, "country-facts"), "facts");
    await hydrated(tid(page, "budget"));
    await page.getByLabel("한국에서 하루 쓰는 돈 (원)").fill("300,000");
    await page.getByLabel("일수").fill("9");
    await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
    expect(Math.abs((await docBox(tid(page, "next-card"), "next-card")).y - nextEarly), "아래 구역 위치").toBeLessThanOrEqual(1);
    const f = await docBox(tid(page, "country-facts"), "facts");
    expect(Math.abs(f.y - factsEarly.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(f.height - factsEarly.height)).toBeLessThanOrEqual(1);
  });
});

// 두 칸 배치는 1024px 부터(lg) — 1023 이하는 설명 아래로 흐름(그대로). 작업 전 1124 · 1280 · 1440 은 왼쪽 글 끝과 카드 끝 차이가 약 360px
//   카드는 내용 높이(stretch 없음 · lead 결정 — 카드 안 흰 빈칸이 더 어색) → 베트남: 왼쪽 칸 끝이 카드 끝과 24px 이내(빈자리 해소) ·
//   일본: 왼쪽 열(요약 칸)이 카드보다 길고(작업 0397: 한 줄 답 상자를 지워 새 빈 공간 없음 — 오른쪽 여유 140px 이하) 카드는 내용 높이 그대로(카드 아래 끝이 왼쪽 열 끝을 넘지 않음) · 카드 안 입력 위치는 나라를 바꿔도 같음
test.describe("두 칸 아래 끝 (1024 · 1124 · 1280 · 1440)", () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, "폭을 직접 맞춰 재는 검사 — 넓은 화면 프로젝트에서만");
  });
  for (const [code, name] of [
    ["JPN", "일본"],
    ["VNM", "베트남"],
  ] as const) {
    for (const w of [1024, 1124, 1280, 1440]) {
      test(`${name} ${w}px — 요약 칸이 설명 아래 왼쪽 · 왼쪽 칸 끝 ≈ 카드 아래 끝 · 가로 스크롤 없음`, async ({ page }) => {
        await page.setViewportSize({ width: w, height: 900 });
        await page.goto(`/prices/${code}`);
        await hydrated(tid(page, "budget"));
        const facts = await box(tid(page, "country-facts"), "facts");
        const card = await box(tid(page, "budget"), "budget");
        const h1 = await box(page.locator("h1"), "h1");
        expect(facts.y, "요약 칸은 제목 아래").toBeGreaterThanOrEqual(h1.y + h1.height - 1);
        expect(facts.x + facts.width, "왼쪽 칸 — 카드와 가로로 겹치지 않음").toBeLessThanOrEqual(card.x + 1);
        const sy = await page.evaluate(() => window.scrollY);
        const gap = card.y + sy + card.height - (await leftBottom(page));
        expect(gap, `두 칸 아래 끝 차이(카드 − 왼쪽 마지막 상자)=${Math.round(gap)}px`).toBeLessThanOrEqual(24); // 빈자리 해소(작업 전 약 360)
        expect(gap, "카드와 왼쪽 열 끝이 24px 이내(베트남) · 일본은 왼쪽 열이 더 길어도 됨").toBeGreaterThanOrEqual(code === "JPN" ? -140 : -24);
        if (code === "JPN") expect(card.height, "일본 카드는 내용 높이(안이 흰 빈칸으로 늘어나지 않음)").toBeLessThanOrEqual(520);
        expect(await hScroll(page)).toBeLessThanOrEqual(0);
      });
    }
  }

  test("나라 바꿈 전후(일본 → 태국 → 마카오) — 카드 안 입력 · 두 칸 아래 끝 · 아래 구역 위치 같음", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/prices/JPN");
    await hydrated(tid(page, "budget"));
    const read = async () => ({
      daily: (await docBox(page.getByLabel("한국에서 하루 쓰는 돈 (원)"), "daily")).y,
      select: (await docBox(tid(page, "budget").getByLabel("나라"), "select")).y,
      cardBottom: (await docBox(tid(page, "budget"), "card")).y + (await docBox(tid(page, "budget"), "card")).height,
      left: await leftBottom(page),
      next: (await docBox(tid(page, "next-card"), "next")).y,
    });
    const before = await read();
    for (const label of ["태국", "마카오"]) {
      await tid(page, "budget").getByLabel("나라").selectOption({ label });
      await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
      const after = await read();
      expect(Math.abs(after.daily - before.daily), `${label}: 입력 위치`).toBeLessThanOrEqual(1);
      expect(Math.abs(after.select - before.select), `${label}: 나라 칸 위치`).toBeLessThanOrEqual(1);
      expect(Math.abs(after.next - before.next), `${label}: 아래 구역 위치`).toBeLessThanOrEqual(1);
      expect(Math.abs(after.left - before.left), `${label}: 왼쪽 열 끝 위치`).toBeLessThanOrEqual(1);
    }
  });

  test("900px(한 칸 배치) — 요약 칸이 설명 아래 · 예산 카드와 겹치지 않음", async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await page.goto("/prices/JPN");
    const facts = await box(tid(page, "country-facts"), "facts");
    const card = await box(tid(page, "budget"), "budget");
    expect(facts.y + facts.height, "카드 위에서 끝남").toBeLessThanOrEqual(card.y + 1);
  });
});

// 320~1600 겹침 · 넘침 · 가로 스크롤 · 넓은 글꼴
test.describe("반응형 — 겹침 · 넘침 · 넓은 글꼴", () => {
  test.beforeEach(({ isMobile }) => {
    test.skip(isMobile, "폭을 직접 맞춰 재는 검사 — 넓은 화면 프로젝트에서만");
  });
  for (const wide of [false, true]) {
    for (const code of ["JPN", "VNM"]) {
      test(`${code} ${wide ? "넓은 글꼴 · " : ""}320 ~ 1600 — 요약 칸 안 글 넘침 없음 · 예산 카드 · 제목과 겹치지 않음 · 가로 스크롤 없음`, async ({ page }) => {
        test.setTimeout(90_000);
        await page.goto(`/prices/${code}`);
        if (wide) await page.addStyleTag({ content: `*{font-family:"Arial Black","Verdana",sans-serif !important;letter-spacing:0.02em !important}` });
        for (const w of [320, 360, 390, 599, 600, 899, 900, 1124, 1280, 1440, 1600]) {
          await page.setViewportSize({ width: w, height: 900 });
          await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
          const r = await page.evaluate(() => {
            const q = (id: string) => document.querySelector<HTMLElement>(`[data-testid="${id}"]`);
            const facts = q("country-facts");
            if (!facts) return { missing: true } as const;
            const fr = facts.getBoundingClientRect();
            const over = [...facts.querySelectorAll<HTMLElement>("*")].filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== "visible" ? true : el.getBoundingClientRect().right > fr.right + 1 && el.getBoundingClientRect().width > 0).map((el) => el.tagName + "." + el.className).slice(0, 4);
            const small = [...facts.querySelectorAll<HTMLElement>("*")].filter((el) => el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent ?? "").trim()) && parseFloat(getComputedStyle(el).fontSize) < 12).map((el) => el.textContent?.slice(0, 20)).slice(0, 3);
            const inter = (a: DOMRect, b: DOMRect) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
            const others = [document.querySelector("h1"), q("budget")].filter(Boolean).map((el) => (el as HTMLElement).getBoundingClientRect());
            return { missing: false, over, small, overlap: others.some((o) => inter(fr, o)), sx: document.documentElement.scrollWidth - document.documentElement.clientWidth };
          });
          expect(r.missing, `${w}px 요약 칸이 있음`).toBe(false);
          if (r.missing) return;
          expect(r.over, `${w}px 칸 밖으로 나간 요소`).toEqual([]);
          expect(r.small, `${w}px 12px 미만 글자`).toEqual([]);
          expect(r.overlap, `${w}px 제목 · 예산 카드와 겹침`).toBe(false);
          expect(r.sx, `${w}px 가로 스크롤`).toBeLessThanOrEqual(0);
        }
      });
    }
  }
});

// 작업 0397 — 나라 물가 '오늘 기준 한 줄 답' 상자 지움: 일본 · 베트남 · 마카오 화면 · HTML 에 없음 · 지운 뒤 머리 구역 겹침 · 넘침 없음
test.describe("한 줄 답 상자 없음 (작업 0397)", () => {
  for (const code of ["JPN", "VNM", "MAC"]) {
    test(`${code} — 화면 · 서버 첫 그림에 '오늘 기준 한 줄 답' · country-oneline 없음 · 머리 구역 겹침 · 가로 스크롤 없음`, async ({ page }) => {
      const h = await (await page.request.get(`/prices/${code}`)).text();
      expect(h.includes("오늘 기준 한 줄 답"), "HTML(RSC 자료 포함)에 한 줄 답 글이 남음: CountryView.oneLine 을 클라이언트 부품에 넘기지 않기").toBe(false);
      expect(h.includes('data-testid="country-oneline"')).toBe(false);
      await page.goto(`/prices/${code}`);
      await expect(tid(page, "country-oneline")).toHaveCount(0);
      await expect(page.getByText("오늘 기준 한 줄 답")).toHaveCount(0);
      await expect(tid(page, "country-facts")).toBeVisible();
      expect(await hScroll(page)).toBeLessThanOrEqual(0);
    });
  }
  test("/prices 목록 — HTML 전체(스크립트 데이터 포함)에 '오늘 기준 한 줄 답' 글자 없음", async ({ page }) => {
    const h = await (await page.request.get("/prices")).text();
    expect(h.includes("오늘 기준 한 줄 답"), "/prices HTML(RSC 자료 포함)에 한 줄 답 글이 남음").toBe(false);
    expect(h.includes("country-side-answer")).toBe(false);
  });

  test.describe("폭별 머리 구역", () => {
    test.beforeEach(({ isMobile }) => {
      test.skip(isMobile, "폭을 직접 맞춰 재는 검사 — 넓은 화면 프로젝트에서만");
    });
    for (const code of ["JPN", "VNM", "MAC"]) {
      test(`${code} 390 · 900 · 1124 · 1440 — 제목 · 요약 칸 · 예산 카드 겹침 없음 · 넘침 없음 · 아래 구역이 머리 구역 바로 아래`, async ({ page }) => {
        for (const w of [390, 900, 1124, 1440]) {
          await page.setViewportSize({ width: w, height: 900 });
          await page.goto(`/prices/${code}`);
          await hydrated(tid(page, "budget"));
          const r = await page.evaluate(() => {
            const g = (s: string) => document.querySelector(s)?.getBoundingClientRect();
            const rects = [g("h1"), g('[data-testid="country-facts"]'), g('[data-testid="budget"]')];
            const inter = (a: DOMRect, b: DOMRect) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
            const overlaps: string[] = [];
            for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) if (rects[i] && rects[j] && inter(rects[i]!, rects[j]!)) overlaps.push(`${i}-${j}`);
            const next = g('[data-testid="next-card"]');
            const bottoms = rects.filter(Boolean).map((x) => x!.bottom + window.scrollY);
            return { overlaps, nextTop: next ? next.top + window.scrollY : 0, headBottom: Math.max(...bottoms), sx: document.documentElement.scrollWidth - document.documentElement.clientWidth };
          });
          expect(r.overlaps, `${code} ${w}px 겹침(0 제목 · 1 요약 칸 · 2 예산 카드)`).toEqual([]);
          expect(r.sx, `${code} ${w}px 가로 스크롤`).toBeLessThanOrEqual(0);
          expect(r.nextTop - r.headBottom, `${code} ${w}px 머리 구역과 아래 구역 사이`).toBeGreaterThanOrEqual(0);
          expect(r.nextTop - r.headBottom, `${code} ${w}px 머리 구역 아래 빈 공간이 과하지 않음`).toBeLessThanOrEqual(260);
        }
      });
    }
  });
});

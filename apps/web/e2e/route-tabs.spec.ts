// 작업 0360 — 여행 물가 "나라별 물가 노선" 탭 · 내 여행지 e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   원문: 탭(물가 차이 큰 곳 기본 · 많이 가는 곳 · 동남아 · 유럽) · 한국은 늘 기준역 · 탭을 바꾸면 핀 · 칩이 다시 나타나고 비행기가 새 노선 첫 정거장으로 · 자 눈금 범위가 노선에 맞게 · 고른 탭은 브라우저에만 기억 ·
//         내 여행지(usePickedTrip)는 노선에 자동으로(없으면 정거장으로 더하고 노란 테두리 + "내 여행지" 꼬리표 · 비행기와 카드가 그 나라로) · 칩 ✕ 로 그 노선에서만 빼기 · 카드 "{나라} 자세히 보기 ›"(지금은 나라 페이지 링크) · 서버 첫 그림은 기본 노선 · 세 폭 1440 · 900 · 375
//   움직임 모양(핀 · 칩 차례로 · 비행기 날아감 곡선)은 @design 이라 여기서 보지 않음 — 끝난 모양 · 움직임 줄이기만
//   기존 표시 그대로: route-section · route-stops · route-stop(data-country · data-value · data-active) · route-ruler · route-pin · route-kr-tag · route-plane · route-card · route-card-name · route-card-link
//   builder 가 새로 다는 표시(data-testid)
//     route-tabs        탭 줄 (role="tablist" · aria-label "노선 고르기") · 노선 구간 안
//     route-tab         탭 하나 (role="tab" · aria-selected · data-tab = spread | popular | sea | eu · 글 = 탭 이름 · 기본 탭 글에 "기본")
//     route-note        탭 설명 한 줄
//     route-stop 에 더함  data-name(나라 이름) · data-mine="true"(내 여행지일 때만) · 안에 route-mine-tag(글 "내 여행지") · route-mine-remove(버튼 · 글 ✕ · aria-label "이 노선에서 빼기")
//     route-pin 에 더함   data-country · data-mine="true"
//     route-card-detail 카드 안 링크 "{나라} 자세히 보기 ›" (한국 카드에는 없음) · href = 나라 페이지(/prices/XXX · 사이드바는 작업 0361)
import { type Page, expect, test } from "@playwright/test";
import { hydrated } from "./helpers";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const tab = (page: Page, id: string) => page.locator(`[data-testid="route-tab"][data-tab="${id}"]`);
const SEA = ["VNM", "THA", "MYS", "PHL", "IDN", "SGP"];
const EU = ["ESP", "ITA", "FRA", "DEU", "GBR", "CHE"];
const POPULAR = ["JPN", "VNM", "USA", "THA", "PHL", "TWN", "HKG", "SGP", "MAC", "IDN"]; // docs/domain/travel-price.md 순위 순서

type St = { country: string; value: number; name: string; active: boolean; mine: boolean };
const stops = (page: Page): Promise<St[]> =>
  tid(page, "route-stop").evaluateAll((els) => els.map((e) => ({ country: e.getAttribute("data-country") ?? "", value: Number(e.getAttribute("data-value")), name: e.getAttribute("data-name") ?? "", active: e.getAttribute("data-active") === "true", mine: e.getAttribute("data-mine") === "true" })));
const codes = async (page: Page) => (await stops(page)).map((s) => s.country);
const box = async (loc: ReturnType<Page["locator"]>) => {
  const b = await loc.boundingBox();
  if (!b) throw new Error("화면에 없음");
  return b;
};
const PICK = (country: string, city: string) => JSON.stringify({ v: 1, country, city, budget: 1_000_000 });
const withPicked = (page: Page, country: string, city: string) => page.addInitScript(([k, v]) => localStorage.setItem(k, v), ["flapfx:picked", PICK(country, city)]);

/** 열고 하이드레이션까지 기다림 · 움직임 줄이기로 끝난 모양을 잼(움직임 모양은 @design) */
async function open(page: Page, o: { reduce?: boolean } = {}) {
  if (o.reduce !== false) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/prices");
  await expect(tid(page, "route-tabs")).toBeVisible();
  await hydrated(tab(page, "spread"));
}
const choose = async (page: Page, id: string) => {
  await tab(page, id).click();
  await expect(tab(page, id)).toHaveAttribute("aria-selected", "true");
};
/** 정거장(한국 포함) 위치의 자 위 가운데 x */
async function stopX(page: Page, country: string) {
  const el = country === "KR" ? tid(page, "route-kr-tag") : page.locator(`[data-testid="route-pin"][data-country="${country}"]`);
  const b = await box(el.first());
  return b.x + b.width / 2;
}
const planeX = async (page: Page) => {
  const b = await box(tid(page, "route-plane"));
  return b.x + b.width / 2;
};

test.describe("탭 줄 (작업 0360)", () => {
  test.beforeEach(async ({ page }) => {
    await open(page);
  });

  test("탭 줄: role=tablist(이름 '노선 고르기') · 탭 이름 순서 · 기본 탭이 골라져 있고 설명 한 줄", async ({ page }) => {
    await expect(tid(page, "route-tabs")).toHaveAttribute("role", "tablist");
    await expect(tid(page, "route-tabs")).toHaveAttribute("aria-label", "노선 고르기");
    const tabs = await tid(page, "route-tab").evaluateAll((els) => els.map((e) => ({ id: e.getAttribute("data-tab"), sel: e.getAttribute("aria-selected"), role: e.getAttribute("role"), text: (e.textContent ?? "").replace(/\s+/g, " ").trim() })));
    expect(tabs.map((t) => t.id)).toEqual(["spread", "popular", "sea", "eu"]);
    expect(tabs.map((t) => t.text.replace(/\s*기본$/, ""))).toEqual(["물가 차이 큰 곳", "많이 가는 곳", "동남아", "유럽"]);
    expect(tabs[0].text).toContain("기본");
    expect(tabs.map((t) => t.sel)).toEqual(["true", "false", "false", "false"]);
    for (const t of tabs) expect(t.role).toBe("tab");
    await expect(tid(page, "route-note")).toContainText("지금 정책");
  });

  test("한국은 늘 기준역 — 탭마다 정거장에 한국(KR · 값 100)이 있고 값 오름차순", async ({ page }) => {
    for (const id of ["spread", "popular", "sea", "eu"]) {
      await choose(page, id);
      const s = await stops(page);
      expect(s.filter((x) => x.country === "KR"), id).toHaveLength(1);
      expect(s.find((x) => x.country === "KR")?.value, id).toBe(100);
      const v = s.map((x) => x.value);
      expect(v, `${id} 값 오름차순`).toEqual([...v].sort((a, b) => a - b));
      await expect(tid(page, "route-kr-tag")).toContainText("한국 100 기준");
    }
  });

  test("기본(물가 차이 큰 곳) = 지금 정책: 아래 세 칸 목록 구간마다 맨 위 두 나라 + 한국", async ({ page }) => {
    const names = await tid(page, "price-bands").locator("section").evaluateAll((secs) => secs.flatMap((s) => Array.from(s.querySelectorAll("li")).slice(0, 2).map((li) => (li as HTMLElement).innerText.split("\n")[0].trim())));
    const s = await stops(page);
    expect(s.filter((x) => x.country !== "KR").map((x) => x.name).sort()).toEqual([...names].sort());
  });

  test("동남아 탭: 정거장은 동남아 여섯 나라 안 + 한국 · 둘 이상", async ({ page }) => {
    await choose(page, "sea");
    const c = await codes(page);
    expect(c).toContain("KR");
    expect(c.length).toBeGreaterThanOrEqual(3);
    for (const x of c.filter((k) => k !== "KR")) expect(SEA, x).toContain(x);
  });

  test("유럽 탭: 정거장은 유럽 여섯 나라 안 + 한국 (유럽 평균이 아니라 나라별)", async ({ page }) => {
    await choose(page, "eu");
    const c = await codes(page);
    expect(c).toContain("KR");
    expect(c.length).toBeGreaterThanOrEqual(3);
    for (const x of c.filter((k) => k !== "KR")) expect(EU, x).toContain(x);
  });

  test("많이 가는 곳 탭: 공식 순위 앞쪽 나라들 + 한국 · 순위 밖 나라(예: 스위스)는 없음 · 최대 6곳", async ({ page }) => {
    await choose(page, "popular");
    const c = (await codes(page)).filter((k) => k !== "KR");
    expect(c.length).toBeGreaterThanOrEqual(2);
    expect(c.length).toBeLessThanOrEqual(6);
    for (const x of c) expect(POPULAR, x).toContain(x);
    // 순위 순서대로 채움: 고른 나라는 순위 앞쪽부터 빈틈 없이(자료 없는 나라만 건너뜀) — 가장 낮은 순위 나라보다 앞 순위인데 빠진 나라는 자료가 없는 나라뿐
    const worst = Math.max(...c.map((x) => POPULAR.indexOf(x)));
    expect(worst, "6곳을 채웠다면 가장 낮은 순위는 7위(인덱스 6) 이하로 넘어가도 건너뛴 만큼").toBeLessThan(POPULAR.length);
    expect(c).toContain("JPN"); // 1위 일본은 물가 자료가 있음
  });

  test("탭을 바꾸면 비행기와 카드가 새 노선의 정거장으로: 골라진 정거장이 하나 · 카드 이름이 그 정거장 · 비행기가 그 정거장 위", async ({ page }) => {
    for (const id of ["sea", "eu", "popular", "spread"]) {
      await choose(page, id);
      const s = await stops(page);
      const active = s.filter((x) => x.active);
      expect(active, id).toHaveLength(1);
      await expect(tid(page, "route-card-name"), id).toContainText(active[0].name);
      await expect.poll(async () => Math.abs((await planeX(page)) - (await stopX(page, active[0].country))), { message: `${id}: 비행기가 골라진 정거장 위` }).toBeLessThan(8);
      expect(await tid(page, "route-pin").count(), `${id}: 핀은 한국 뺀 정거장마다`).toBe(s.length - 1);
    }
  });

  test("자 눈금 범위가 노선에 맞게: 유럽은 한국이 왼쪽 끝 가까이 · 동남아는 한국이 오른쪽 · 기본은 한국이 가운데쯤", async ({ page }) => {
    const krRel = async () => {
      const [r, k] = [await box(tid(page, "route-ruler")), await box(tid(page, "route-kr-tag"))];
      return (k.x + k.width / 2 - r.x) / r.width;
    };
    const base = await krRel();
    await choose(page, "eu");
    const eu = await krRel();
    await choose(page, "sea");
    const sea = await krRel();
    expect(eu, "유럽: 한국(100)이 노선의 가장 싼 쪽이라 왼쪽 끝 가까이").toBeLessThan(0.25);
    expect(sea, "동남아: 한국이 노선의 가장 비싼 쪽에 가까워 오른쪽").toBeGreaterThan(0.6);
    expect(base, "기본: 한국이 가운데쯤").toBeGreaterThan(0.25);
    expect(base).toBeLessThan(0.75);
    // 모든 핀이 자 안
    const r = await box(tid(page, "route-ruler"));
    for (const p of await tid(page, "route-pin").all()) {
      const b = await box(p);
      expect(b.x + b.width / 2).toBeGreaterThanOrEqual(r.x - 1);
      expect(b.x + b.width / 2).toBeLessThanOrEqual(r.x + r.width + 1);
    }
  });
});

test.describe("고른 탭 기억 — 브라우저에만 (작업 0360)", () => {
  test("동남아를 고르고 새로 고치면 동남아 · 모르는 저장값이면 기본 탭", async ({ page }) => {
    await open(page);
    await choose(page, "sea");
    await page.reload();
    await hydrated(tab(page, "spread"));
    await expect(tab(page, "sea")).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, "spread")).toHaveAttribute("aria-selected", "false");
    for (const c of (await codes(page)).filter((k) => k !== "KR")) expect(SEA).toContain(c);
    await page.evaluate(() => localStorage.setItem("flapfx:route-tab", "nope"));
    await page.reload();
    await hydrated(tab(page, "spread"));
    await expect(tab(page, "spread")).toHaveAttribute("aria-selected", "true");
  });

  test("저장소가 막혀도(예외) 탭은 바뀌고 기본으로 돌아옴 — 오류 없음", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      const boom = () => { throw new Error("blocked"); };
      Storage.prototype.getItem = new Proxy(Storage.prototype.getItem, { apply: (t, th, a) => (a[0] === "flapfx:route-tab" ? boom() : Reflect.apply(t, th, a)) });
      Storage.prototype.setItem = new Proxy(Storage.prototype.setItem, { apply: (t, th, a) => (a[0] === "flapfx:route-tab" ? boom() : Reflect.apply(t, th, a)) });
    });
    await open(page);
    await choose(page, "eu");
    expect(await codes(page)).toContain("KR");
    expect(errors, "페이지 오류 없음").toEqual([]);
  });
});

test.describe("서버 첫 그림은 기본 노선 (작업 0360)", () => {
  test("정적 HTML: 탭 줄에 기본 탭만 골라져 있고 · 정거장은 하이드레이션 뒤 기본 노선과 같음 · 내 여행지 표시 없음 · 큰 제목 문장 그대로", async ({ page }) => {
    const r = await page.request.get("/prices");
    expect(r.status()).toBe(200);
    const html = await r.text();
    const tabTags = [...html.matchAll(/<button[^>]*data-testid="route-tab"[^>]*>/g)].map((m) => m[0]);
    expect(tabTags.length, "탭 넷").toBe(4);
    const sel = tabTags.filter((t) => t.includes('aria-selected="true"'));
    expect(sel).toHaveLength(1);
    expect(sel[0]).toContain('data-tab="spread"');
    expect(html).not.toContain('data-mine="true"');
    expect(html).toMatch(/한국보다 물가가 \d+% 낮습니다/);
    const serverStops = [...html.matchAll(/<[^>]*data-testid="route-stop"[^>]*>/g)].map((m) => /data-country="([A-Z]+)"/.exec(m[0])?.[1] ?? "");
    expect(serverStops.length).toBeGreaterThanOrEqual(3);
    await open(page);
    expect(await codes(page), "서버 첫 그림의 정거장 = 하이드레이션 뒤 기본 노선").toEqual(serverStops);
  });

  test("자바스크립트를 꺼도 기본 노선과 카드가 보임", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/prices");
    await expect(tid(page, "route-ruler")).toBeVisible();
    await expect(tid(page, "route-card")).toBeVisible();
    await expect(tab(page, "spread")).toHaveAttribute("aria-selected", "true");
    await ctx.close();
  });
});

test.describe("내 여행지 (작업 0360)", () => {
  test("고른 나라가 노선에 없으면 정거장으로 더하고 노란 테두리 + '내 여행지' 꼬리표 · 비행기와 카드가 그 나라로 (유럽 노선에 일본)", async ({ page }) => {
    await withPicked(page, "JPN", "도쿄");
    await open(page);
    await choose(page, "eu");
    const s = await stops(page);
    const mine = s.filter((x) => x.mine);
    expect(mine.map((x) => x.country)).toEqual(["JPN"]);
    expect(s.map((x) => x.country).filter((c) => c !== "KR" && c !== "JPN").every((c) => EU.includes(c))).toBe(true);
    expect(mine[0].active, "비행기와 카드가 내 여행지로").toBe(true);
    await expect(tid(page, "route-card-name")).toContainText("일본");
    await expect.poll(async () => Math.abs((await planeX(page)) - (await stopX(page, "JPN")))).toBeLessThan(8);
    const chip = page.locator('[data-testid="route-stop"][data-mine="true"]');
    await expect(chip.locator('[data-testid="route-mine-tag"]')).toHaveText("내 여행지");
    await expect(page.locator('[data-testid="route-pin"][data-mine="true"]')).toHaveCount(1);
    // 노란 테두리: 굵기 2px 이상 · 다른 칩의 테두리 색과 다름
    const border = (l: ReturnType<Page["locator"]>) => l.evaluate((el) => { const c = getComputedStyle(el); return { w: parseFloat(c.borderTopWidth), color: c.borderTopColor }; });
    const mb = await border(chip);
    const ob = await border(page.locator('[data-testid="route-stop"]:not([data-mine="true"])').first());
    expect(mb.w).toBeGreaterThanOrEqual(2);
    expect(mb.color).not.toBe(ob.color);
  });

  test("이미 노선에 있는 나라(동남아의 베트남)를 고르면 더하지 않고 표시만", async ({ page }) => {
    await open(page);
    await choose(page, "sea");
    const before = await codes(page);
    expect(before).toContain("VNM");
    const page2 = await page.context().newPage();
    await withPicked(page2, "VNM", "하노이");
    await page2.emulateMedia({ reducedMotion: "reduce" });
    await page2.goto("/prices");
    await hydrated(tab(page2, "spread"));
    await choose(page2, "sea");
    expect(await codes(page2)).toEqual(before);
    expect((await stops(page2)).filter((x) => x.mine).map((x) => x.country)).toEqual(["VNM"]);
    await page2.close();
  });

  test("탭을 옮겨도 내 여행지가 따라옴 — 노선마다 없으면 더하고 있으면 표시", async ({ page }) => {
    await withPicked(page, "CHE", "취리히");
    await open(page);
    for (const id of ["spread", "popular", "sea", "eu"]) {
      await choose(page, id);
      const s = await stops(page);
      expect(s.filter((x) => x.country === "CHE"), id).toHaveLength(1);
      expect(s.find((x) => x.country === "CHE")?.mine, id).toBe(true);
    }
  });

  test("페이지 안에서 여행지를 새로 고르면(PICK_EVENT) 바로 노선에 들어감 · 고르지 않은 쪽은 표시가 없음", async ({ page }) => {
    await open(page);
    await choose(page, "eu");
    expect((await stops(page)).some((x) => x.mine)).toBe(false);
    await page.evaluate((v) => window.dispatchEvent(new CustomEvent("flapfx:intro-pick", { detail: JSON.parse(v) })), PICK("JPN", "도쿄"));
    await expect(page.locator('[data-testid="route-stop"][data-mine="true"]')).toHaveCount(1);
    expect(await codes(page)).toContain("JPN");
  });

  test("예산 카드에서 나라를 고르면 내 여행지로 노선에 들어감(홈 검색 칸과 같은 내 여행지) · 다른 나라로 바꾸면 따라 바뀜", async ({ page }) => {
    await open(page);
    await choose(page, "eu");
    expect((await stops(page)).some((x) => x.mine)).toBe(false);
    const select = tid(page, "budget").getByLabel("나라");
    await select.selectOption("JPN");
    await expect(page.locator('[data-testid="route-stop"][data-mine="true"]')).toHaveCount(1);
    expect((await stops(page)).filter((x) => x.mine).map((x) => x.country)).toEqual(["JPN"]);
    await expect(page.locator('[data-testid="route-stop"][data-mine="true"] [data-testid="route-mine-tag"]')).toHaveText("내 여행지");
    await select.selectOption("THA");
    await expect.poll(async () => (await stops(page)).filter((x) => x.mine).map((x) => x.country)).toEqual(["THA"]);
    expect(await codes(page), "이전 내 여행지(일본)는 노선에서 빠짐").not.toContain("JPN");
  });

  test("✕ 로 그 노선에서만 뺌: 칩 · 핀 · 꼬리표가 사라지고 · 탭을 옮기면 다시 나옴 · 고른 여행지 자체는 그대로", async ({ page }) => {
    await withPicked(page, "JPN", "도쿄");
    await open(page);
    await choose(page, "eu");
    const withMine = await codes(page);
    expect(withMine).toContain("JPN");
    await page.locator('[data-testid="route-stop"][data-mine="true"] [data-testid="route-mine-remove"]').click();
    expect(await codes(page)).toEqual(withMine.filter((c) => c !== "JPN"));
    await expect(page.locator('[data-testid="route-pin"][data-country="JPN"]')).toHaveCount(0);
    await expect(tid(page, "route-mine-tag")).toHaveCount(0);
    expect((await stops(page)).filter((x) => x.active)).toHaveLength(1); // 카드 · 비행기는 남은 정거장 중 하나로
    await choose(page, "sea");
    expect(await codes(page), "다른 노선에서는 다시 나옴").toContain("JPN");
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("flapfx:picked") ?? "null")?.country), "고른 여행지는 지워지지 않음").toBe("JPN");
  });
});

test.describe("'{나라} 자세히 보기 ›' (작업 0360 · 사이드바는 작업 0361 · 지금은 나라 페이지 링크)", () => {
  test("카드에 '{나라} 자세히 보기 ›' 링크 · 골라진 정거장이 바뀌면 나라도 바뀜 · 한국 카드에는 없음 · 누르면 나라 페이지", async ({ page }) => {
    await open(page);
    await choose(page, "sea");
    const s = await stops(page);
    const away = s.filter((x) => x.country !== "KR");
    for (const st of away.slice(0, 2)) {
      await page.locator(`[data-testid="route-stop"][data-country="${st.country}"]`).click();
      await expect(page.locator(`[data-testid="route-stop"][data-country="${st.country}"]`)).toHaveAttribute("data-active", "true");
      const d = tid(page, "route-card-detail");
      await expect(d).toHaveText(new RegExp(`^${st.name} 자세히 보기\\s*›$`));
      await expect(d).toHaveAttribute("href", new RegExp(`/prices/${st.country}/?$`));
    }
    await page.locator('[data-testid="route-stop"][data-country="KR"]').click();
    await expect(tid(page, "route-card-name")).toContainText("한국");
    await expect(tid(page, "route-card-detail")).toHaveCount(0);
    await page.locator(`[data-testid="route-stop"][data-country="${away[0].country}"]`).click();
    await tid(page, "route-card-detail").click();
    await expect(page).toHaveURL(new RegExp(`/prices/${away[0].country}/?$`));
  });
});

test.describe("움직임 줄이기 (작업 0360)", () => {
  test("탭을 바꾸면 움직임 없이 바로: 누른 직후 진행 중인 움직임(1ms 넘는 것)이 없고 비행기가 제자리", async ({ page }) => {
    await open(page, { reduce: true });
    await choose(page, "eu");
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.effect && Number(a.effect.getComputedTiming().duration) > 1 && a.effect.getComputedTiming().iterations !== Number.POSITIVE_INFINITY && a.playState === "running").length);
    expect(running).toBe(0);
    const active = (await stops(page)).find((x) => x.active)!;
    expect(Math.abs((await planeX(page)) - (await stopX(page, active.country)))).toBeLessThan(8);
  });

  test("움직임 있음: 탭을 바꾸면 3초 안에 핀이 모두 보이고 비행기가 골라진 정거장 위에 섬 (모양은 @design)", async ({ page }) => {
    await open(page, { reduce: false });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await choose(page, "sea");
    const n = (await stops(page)).length - 1;
    await expect(tid(page, "route-pin")).toHaveCount(n);
    await expect.poll(async () => (await tid(page, "route-pin").evaluateAll((els) => els.filter((e) => Number(getComputedStyle(e).opacity) > 0.99).length)), { timeout: 3000 }).toBe(n);
    const active = (await stops(page)).find((x) => x.active)!;
    await expect.poll(async () => Math.abs((await planeX(page)) - (await stopX(page, active.country))), { timeout: 3000 }).toBeLessThan(8);
  });
});

test.describe("세 폭 1440 · 900 · 375 — 넘침 · 겹침 없음 (작업 0360 · 중간 폭 확인)", () => {
  for (const w of [1440, 900, 375]) {
    test(`${w}px — 탭 줄이 화면 안 · 가로 넘침 없음 · 핀끼리 겹치지 않음 · 핀이 카드를 덮지 않음 (탭마다 · 내 여행지 포함)`, async ({ page }) => {
      test.skip(test.info().project.name === "휴대폰", "폭은 이 검사가 직접 정함 — 한 번만");
      await withPicked(page, "JPN", "도쿄");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.setViewportSize({ width: w, height: w === 375 ? 812 : 900 });
      await page.goto("/prices");
      await hydrated(tab(page, "spread"));
      for (const id of ["spread", "popular", "sea", "eu"]) {
        await choose(page, id);
        await tid(page, "route-section").scrollIntoViewIfNeeded();
        const where = `${w}px ${id}`;
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${where} 가로 넘침`).toBeLessThanOrEqual(0);
        for (const t of await tid(page, "route-tab").all()) {
          const b = await box(t);
          expect(b.x, `${where} 탭 왼쪽`).toBeGreaterThanOrEqual(-1);
          expect(b.x + b.width, `${where} 탭 오른쪽`).toBeLessThanOrEqual(w + 1);
          if (w === 375) expect(b.height, `${where} 탭 누르는 자리 44px`).toBeGreaterThanOrEqual(44);
        }
        const pins = await Promise.all((await tid(page, "route-pin").all()).map(box));
        for (let i = 0; i < pins.length; i++) {
          for (let j = i + 1; j < pins.length; j++) {
            const [a, b] = [pins[i], pins[j]];
            const ox = Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x);
            const oy = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
            expect(ox > 1 && oy > 1, `${where} 핀 ${i + 1} · ${j + 1} 겹침`).toBe(false);
          }
        }
        const card = await box(tid(page, "route-card"));
        for (const [i, p] of pins.entries()) expect(p.y + p.height, `${where} 핀 ${i + 1} 이 카드 위`).toBeLessThanOrEqual(card.y + 1);
        await expect(tid(page, "route-card-detail").or(tid(page, "route-card-name")).first()).toBeVisible();
      }
    });
  }
});

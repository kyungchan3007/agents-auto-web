// 작업 0365: 통화 상세(/currencies/XXX)에서는 이 표를 뺌 → 표 검사는 /currencies 목록 페이지에서 (이 페이지의 표는 그대로)
// 작업 0260 — 통화 "둘러보기"를 카드 22장에서 표로 (테스트 먼저 · 구현 전에는 FAIL 이 정상) · 기준: handoff.md "고치면" · 요청 원문 시안 32번 B안
//
// 화면에 다는 표시(builder 가 다는 것) — data-testid="currency-list"(기존 · 둘러보기 구간) 안:
//   nav[aria-label="통화 목록"] 안에 "currency-col"(단 · 넓은 화면 두 개 나란히 · 휴대폰은 위아래로 쌓여 한 단처럼) 둘
//   단마다 "currency-head"(머리 줄 · 글 "통화" · "오늘 환율" · "90일 최고보다" · 휴대폰에서는 둘째 단 머리를 숨겨도 됨) + ul > li(줄 하나) — 줄 = li[data-testid="currency-row"] 안에 줄 전체가 링크인 a[href="/currencies/코드"]
//   줄 안: "currency-name"(이름 · 굵게) 이 "currency-code"(통화 코드 · 넓은 화면에서만 보임)보다 DOM 에서 앞 · "currency-rate"(오늘 환율 글 · 숫자 + 원) · "currency-drop"(90일 최고보다 글: "−11.8%" · "최고" · "—") · "currency-bar"(막대 · 넓은 화면에서만 보임 · 길이 = 내린 폭)
//   줄(li)에 data-drop = 내린 폭 분수(예 "-0.118") · "top"(최고) · "none"(기록 없음) — 순서 · 막대 비교에 씀
//   a 의 aria-label 에 이름 · 환율 · 내린 폭(숫자 줄만)이 들어감 · 지금 보는 통화 줄은 a[aria-current="page"]
// 자료는 빌드한 사이트가 받은 신호 응답에 의존 — 옛 응답(max 없음)이면 모든 줄이 "—" 일 수 있어 순서 · 막대 검사는 숫자 줄이 둘 이상일 때만
import { type Locator, type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const list = (page: Page) => tid(page, "currency-list");
const isWide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;
const rows = (page: Page) => list(page).locator('li[data-testid="currency-row"]');
const box = async (loc: Locator) => {
  const b = await loc.boundingBox();
  if (!b) throw new Error("화면에 없음");
  return b;
};
const drops = async (page: Page) => (await rows(page).evaluateAll((els) => els.map((e) => e.getAttribute("data-drop") ?? ""))).map((d) => (d === "top" || d === "none" || d === "" ? d : Number(d)));

test.describe("통화 둘러보기 표 (작업 0260)", () => {
  test("표 구조 — 줄마다 이름 · 오늘 환율 · 90일 최고보다 · 줄 전체가 그 통화 상세로 가는 링크 · 국기", async ({ page }) => {
    await page.goto("/currencies");
    const n = await rows(page).count();
    expect(n, "통화 줄 수").toBeGreaterThan(3);
    for (let i = 0; i < Math.min(n, 8); i++) {
      const row = rows(page).nth(i);
      const a = row.locator("a[href^='/currencies/']");
      await expect(a, `${i + 1}번째 줄 링크`).toHaveCount(1);
      await expect(a.locator('[data-testid="currency-name"]')).toBeVisible();
      await expect(a.locator('[data-testid="currency-rate"]'), "오늘 환율").toContainText(/\d/);
      await expect(a.locator('[data-testid="currency-rate"]')).toContainText("원");
      await expect(a.locator('[data-testid="currency-drop"]')).toHaveText(/^(−\d+\.\d%|0\.0%|최고|—)$/);
      await expect(row.locator("svg").first(), "국기").toBeVisible();
      // 줄 전체가 누르는 자리 — 링크 상자가 줄 상자를 거의 다 덮음
      const [rb, ab] = [await box(row), await box(a)];
      expect(ab.width, "링크 폭").toBeGreaterThanOrEqual(rb.width - 2);
      expect(ab.height, "링크 높이").toBeGreaterThanOrEqual(rb.height - 2);
    }
  });

  test("이름이 앞 · 통화 코드는 뒤(작게) — 지금은 코드가 앞이고 이름이 작음 · 단위 표기(엔 100)는 그대로", async ({ page }) => {
    await page.goto("/currencies");
    const row = rows(page).filter({ has: page.locator('a[href="/currencies/JPY"]') });
    await expect(row).toHaveCount(1);
    const order = await row.evaluate((el) => {
      const pos = (id: string) => { const n = el.querySelector(`[data-testid="${id}"]`); return n ? Array.prototype.indexOf.call(el.querySelectorAll("*"), n) : -1; };
      return { name: pos("currency-name"), code: pos("currency-code"), rate: pos("currency-rate") };
    });
    expect(order.name, "이름이 코드보다 앞").toBeGreaterThanOrEqual(0);
    expect(order.name).toBeLessThan(order.code);
    expect(order.name).toBeLessThan(order.rate);
    await expect(row.locator('[data-testid="currency-name"]')).toContainText("엔 100");
    await expect(row.locator('[data-testid="currency-code"]')).toHaveText("JPY");
  });

  test("\"최근 90일 중 하위 N%\" · \"상위 N%\" · \"최근 90일 최저\" 글은 표에서 뺌", async ({ page }) => {
    await page.goto("/currencies");
    const text = await list(page).innerText();
    expect(text).not.toMatch(/하위\s*\d+%|상위\s*\d+%|최근 90일 중|최근 90일 최저/);
  });

  test("많이 내린 순서 — 내린 폭이 큰 줄이 위 · 최고 · 기록 없음은 뒤 (두 단이면 첫 단 위에서 둘째 단 아래로 이어서)", async ({ page }) => {
    await page.goto("/currencies");
    const d = await drops(page);
    const nums = d.filter((x): x is number => typeof x === "number");
    test.skip(nums.length < 2, "90일 최고가 실린 신호 응답이 아직 없음(옛 응답) · 숫자 줄이 둘 미만");
    // 화면 읽는 순서(DOM 순서)가 곧 내린 순: 숫자(작을수록 위) → 최고 → 기록 없음
    const rank = (x: number | string) => (typeof x === "number" ? 0 : x === "top" ? 1 : 2);
    for (let i = 1; i < d.length; i++) {
      expect(rank(d[i]), `${i}번째 → ${i + 1}번째 종류 순서`).toBeGreaterThanOrEqual(rank(d[i - 1]));
      if (typeof d[i] === "number" && typeof d[i - 1] === "number") expect(d[i] as number, `${i + 1}번째가 더 많이 내리지 않음`).toBeGreaterThanOrEqual(d[i - 1] as number);
    }
    await expect(rows(page).first().locator('[data-testid="currency-drop"]')).toHaveText(/^−\d+\.\d%$/);
  });

  test("넓은 화면은 두 단(앞 절반 · 뒤 절반 · 단마다 머리 줄) · 휴대폰은 한 단", async ({ page }) => {
    await page.goto("/currencies");
    const cols = list(page).locator('[data-testid="currency-col"]');
    await expect(cols).toHaveCount(2);
    const n1 = await cols.nth(0).locator('li[data-testid="currency-row"]').count();
    const n2 = await cols.nth(1).locator('li[data-testid="currency-row"]').count();
    expect(n1 + n2, "줄 수가 전체와 같음").toBe(await rows(page).count());
    expect(n1 - n2, "앞 단이 같거나 하나 더").toBeGreaterThanOrEqual(0);
    expect(n1 - n2).toBeLessThanOrEqual(1);
    // 구간 등장 움직임 · 글꼴 · 자료가 자리를 잡는 도중의 값을 보지 않게 — 한 번만 재지 않고 최종 배치까지 다시 재며 기다림 (작업 0260 · CI 에서 흔들림)
    // 두 단 상자는 한 번의 읽기로 함께 잼(따로 두 번 재면 그 사이 스크롤 · 움직임으로 서로 다른 순간 값이 섞일 수 있음)
    const colBoxes = () => cols.evaluateAll((els) => { const r = els.map((e) => e.getBoundingClientRect()); return { c1: { x: r[0].x, y: r[0].y, width: r[0].width, height: r[0].height }, c2: { x: r[1].x, y: r[1].y, width: r[1].width, height: r[1].height } }; });
    if (isWide(page)) {
      await expect.poll(async () => { const { c1, c2 } = await colBoxes(); return { right: c2.x >= c1.x + c1.width - 1, sameTop: Math.abs(c2.y - c1.y) <= 2 }; }, { message: "둘째 단은 오른쪽 · 두 단 위쪽이 같음", timeout: 10_000 }).toEqual({ right: true, sameTop: true });
      const heads = list(page).locator('[data-testid="currency-head"]');
      await expect(heads, "단마다 머리 줄").toHaveCount(2);
      for (const i of [0, 1]) {
        await expect(heads.nth(i)).toBeVisible();
        await expect(heads.nth(i)).toContainText("통화");
        await expect(heads.nth(i)).toContainText("오늘 환율");
        await expect(heads.nth(i)).toContainText("90일 최고보다");
      }
    } else {
      await expect.poll(async () => { const { c1, c2 } = await colBoxes(); return { below: c2.y >= c1.y + c1.height - 1, left: Math.abs(c2.x - c1.x) <= 2 }; }, { message: "휴대폰은 한 단 — 둘째 단이 아래에 이어짐 · 왼쪽 맞춤", timeout: 10_000 }).toEqual({ below: true, left: true });
      await expect(list(page).locator('[data-testid="currency-head"]').first()).toContainText("90일 최고보다");
    }
  });

  test("막대는 넓은 화면에서만 · 길이는 내린 폭에 비례(가장 많이 내린 통화가 꽉 참) · 휴대폰은 숫자만", async ({ page }) => {
    await page.goto("/currencies");
    const bars = list(page).locator('[data-testid="currency-bar"]');
    if (!isWide(page)) {
      const n = await bars.count();
      for (let i = 0; i < n; i++) await expect(bars.nth(i), "휴대폰에는 막대 없음").toBeHidden();
      return;
    }
    const d = await drops(page);
    const nums = d.map((x, i) => ({ x, i })).filter((o): o is { x: number; i: number } => typeof o.x === "number");
    test.skip(nums.length < 2, "숫자 줄이 둘 미만");
    const widths = await Promise.all(nums.map(async (o) => (await box(rows(page).nth(o.i).locator('[data-testid="currency-bar"]'))).width));
    const depth = nums.map((o) => -o.x);
    const maxDepth = Math.max(...depth);
    const maxW = Math.max(...widths);
    expect(maxW, "막대가 보임").toBeGreaterThan(8);
    for (let k = 0; k < nums.length; k++) expect(Math.abs(widths[k] / maxW - depth[k] / maxDepth), `${nums[k].i + 1}번째 줄 막대 길이 비율`).toBeLessThanOrEqual(0.04);
    // 가장 많이 내린 줄이 가장 긴 막대
    expect(widths[depth.indexOf(maxDepth)]).toBeGreaterThanOrEqual(maxW - 1);
    // 막대가 칸 밖으로 안 나감
    const rb = await box(rows(page).nth(nums[0].i));
    const bb = await box(rows(page).nth(nums[0].i).locator('[data-testid="currency-bar"]'));
    expect(bb.x + bb.width).toBeLessThanOrEqual(rb.x + rb.width + 1);
    // 통화 코드는 넓은 화면에서만 보임
    await expect(rows(page).first().locator('[data-testid="currency-code"]')).toBeVisible();
  });

  test("휴대폰 — 통화 코드 · 막대는 숨김 · 이름 · 환율 · 내린 폭은 보임 · 가로로 넘치지 않음", async ({ page }) => {
    test.skip(isWide(page), "휴대폰 전용");
    await page.goto("/currencies");
    const row = rows(page).first();
    await expect(row.locator('[data-testid="currency-code"]')).toBeHidden();
    for (const id of ["currency-name", "currency-rate", "currency-drop"]) await expect(row.locator(`[data-testid="${id}"]`)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), "가로 넘침 없음").toBe(true);
    const lb = await box(list(page));
    const n = await rows(page).count();
    for (let i = 0; i < Math.min(n, 5); i++) {
      const b = await box(rows(page).nth(i));
      expect(b.x + b.width, `${i + 1}번째 줄 오른쪽`).toBeLessThanOrEqual(lb.x + lb.width + 1);
    }
  });

  test("지금 보는 통화 줄은 표시됨(aria-current) · 줄을 누르면 그 통화 상세로", async ({ page }) => {
    await page.goto("/currencies");
    const current = list(page).locator('a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute("href", "/currencies/USD");
    const jpy = list(page).locator('a[href="/currencies/JPY"]');
    await jpy.scrollIntoViewIfNeeded();
    await jpy.click();
    await page.waitForURL(/\/currencies\/JPY/);
    await expect(list(page).locator('a[aria-current="page"]')).toHaveAttribute("href", "/currencies/JPY");
  });

  test("화면 낭독 이름에 이름 · 환율과 내린 폭이 들어감", async ({ page }) => {
    await page.goto("/currencies");
    const n = await rows(page).count();
    let numeric = 0;
    for (let i = 0; i < Math.min(n, 22); i++) {
      const row = rows(page).nth(i);
      const label = (await row.locator("a").getAttribute("aria-label")) ?? "";
      const name = (await row.locator('[data-testid="currency-name"]').innerText()).trim();
      const rate = (await row.locator('[data-testid="currency-rate"]').innerText()).replace(/\s+/g, "");
      const drop = (await row.locator('[data-testid="currency-drop"]').innerText()).trim();
      expect(label, `${i + 1}번째 줄 낭독 이름에 이름`).toContain(name.split(/\s/)[0]);
      expect(label.replace(/\s+/g, ""), "환율").toContain(rate.replace("원", ""));
      if (/^[−0]/.test(drop) || drop === "최고") { expect(label, "내린 폭").toContain(drop); numeric++; }
    }
    test.skip(numeric === 0, "내린 폭이 있는 줄이 없음(옛 응답)");
  });

  test("통화 목록 페이지에도 같은 표 · 카드 테두리 격자는 없음", async ({ page }) => {
    await page.goto("/currencies");
    await expect(list(page)).toContainText("둘러보기");
    await expect(list(page).locator('[data-testid="currency-col"]')).toHaveCount(2);
    expect(await rows(page).count()).toBeGreaterThan(3);
    // 줄마다 테두리 상자(카드)가 아님 — 줄 링크에 2px 테두리가 없음
    const borders = await rows(page).locator("a").evaluateAll((els) => els.slice(0, 5).map((e) => getComputedStyle(e).borderTopWidth));
    for (const b of borders) expect(parseFloat(b), "줄 링크 테두리").toBeLessThan(1);
  });
});

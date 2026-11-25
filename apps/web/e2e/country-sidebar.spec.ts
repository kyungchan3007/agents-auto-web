// 작업 0361 2단계 — 여행 물가 "싼 곳 · 비슷한 곳 · 비싼 곳" 목록 → 나라 사이드바(1024px 이상) · 바텀 시트(1024px 미만) e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   원문: 나라를 누르면 나라 페이지로 넘어가지 않고 사이드바 · 시트로 연다 · 나라 이름은 HTML 에서 /prices/[code] 링크로 남고 누를 때만 가로챔 ·
//         넓은 화면 오른쪽 420px · 뒤를 덮지 않고 본문을 왼쪽으로 밀어냄(목록 세 칸이 보이고 누를 수 있음 · 좁아지면 한 줄로 쌓임) · 뒤 스크롤 잠그지 않음 ·
//         좁은 화면 아래 78% 시트 · 뒤를 어둡게 덮고 스크롤 잠금 · 바깥 누르면 닫힘 · 연 채로 다른 나라 · ‹ › · "n / 전체" · 내용(경로 · 물가 문장 · 한 줄 답 · 값 · 예산 · 다음으로 볼 것 · 자세히 보기) ·
//         dialog · 포커스 안으로 · 닫으면 누른 곳으로 · Esc · 세 폭 1440 · 900 · 375 · 움직임 모양(모션 A · 옆으로 바뀜)은 @design 이라 여기서 보지 않음 · 움직임 줄이기는 바로
//   기존 표시 그대로: price-bands · price-band-link(목록의 나라 이름 링크 · href /prices/XXX)
//   builder 가 다는 표시(data-testid)
//     country-sidebar          dialog 상자(role="dialog" · 이름에 나라 이름 · 열린 동안만 화면에 있음 · 닫히면 숨김 또는 없음)
//     country-side-backdrop    뒤를 덮는 막 — 시트(1024 미만)에만 · 사이드바에는 없음
//     country-side-close       ✕ 닫기(접근 이름 "닫기") · country-side-prev · country-side-next(‹ ›  접근 이름 "앞 나라" · "다음 나라" · 처음 · 끝에서 disabled) · country-side-pos("n / 전체")
//     country-side-crumb       "여행 물가 › 일본" · country-side-title 물가 문장(나라 페이지 제목 규칙 그대로) · country-side-answer 오늘 통화 한 줄 답(없으면 "아직 환율을 받지 않아 물가만")
//     country-side-value       물가 값(숫자 · 목록의 "물가 N" 과 같음) · country-side-budget "약 N원" 하루 예산 예시
//     country-side-next-card   다음으로 볼 것 카드(2~3장 · 환전은 통화가 있을 때만) · 카드마다 링크 하나
//     country-side-detail      맨 아래 "{나라} 물가 자세히 보기 ›" 링크 → /prices/XXX
//   열린 동안 본문 밀어내기(1024 이상): price-bands 의 오른쪽 끝이 패널 왼쪽(화면 폭 − 420) 안
//   0360 노선 카드 "{나라} 자세히 보기 ›"(route-card-detail)도 이 사이드바를 엶 — 0360 이 합쳐진 뒤에만 돌아감(없으면 건너뜀)
import { type Locator, type Page, expect, test } from "@playwright/test";
import { hydrated } from "./helpers";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const links = (page: Page) => tid(page, "price-bands").locator('[data-testid="price-band-link"]');
const side = (page: Page) => tid(page, "country-sidebar");
const codeOf = (href: string | null) => (href ?? "").replace(/\/+$/, "").split("/").pop() ?? "";
const box = async (loc: Locator) => {
  const b = await loc.boundingBox();
  if (!b) throw new Error("화면에 없음");
  return b;
};
const SIDE_W = 420;
const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

async function open(page: Page, width = 1440, height = 900) {
  await page.emulateMedia({ reducedMotion: "reduce" }); // 크기 · 위치는 움직임이 끝난 모양으로 잼(모양은 @design)
  await page.setViewportSize({ width, height });
  await page.goto("/prices");
  await expect(tid(page, "price-bands")).toBeVisible();
  await hydrated(links(page).first());
}
/** 열기: DOM 클릭(Playwright 마우스 클릭은 누르기 전에 페이지를 먼저 움직임 · 0356 에서 확인) — 하이드레이션 전 클릭은 링크 이동이라 열릴 때까지 확인 */
async function openAt(page: Page, i = 0) {
  const link = links(page).nth(i);
  await link.scrollIntoViewIfNeeded();
  await link.evaluate((el) => (el as HTMLElement).click());
  await expect(side(page)).toBeVisible();
  return link;
}
/** 목록은 구간마다 나라 2곳만 보이고 나머지는 "나라 더 보기" 로 펼침 — 일본 · 마카오 같은 나라는 펼친 뒤에 있음 */
async function expandAll(page: Page) {
  const before = await links(page).count();
  const more = tid(page, "price-bands").getByRole("button", { name: /나라 더 보기/ });
  if ((await more.count()) > 0) {
    await more.click();
    await expect.poll(() => links(page).count(), { message: "나라 더 보기 뒤 링크가 늘어남" }).toBeGreaterThan(before);
  }
}
const hrefs = async (page: Page) => (await links(page).evaluateAll((as) => as.map((a) => a.getAttribute("href")))).map(codeOf);

test.describe("HTML 은 지금처럼 링크 (작업 0361)", () => {
  test("정적 HTML: 목록의 나라 이름은 /prices/XXX 링크 · 사이드바는 처음엔 없음 · 링크마다 코드가 다름", async ({ page }) => {
    const html = await (await page.request.get("/prices")).text();
    const tags = [...html.matchAll(/<a[^>]*data-testid="price-band-link"[^>]*>/g)].map((m) => m[0]);
    expect(tags.length).toBeGreaterThanOrEqual(3);
    for (const t of tags) expect(t).toMatch(/href="\/prices\/[A-Z]{3}"/);
    expect(html).not.toContain('data-testid="country-sidebar"');
    expect(new Set(tags.map((t) => /href="([^"]+)"/.exec(t)?.[1])).size, "나라마다 다른 주소").toBe(tags.length);
  });

  test("자바스크립트를 꺼도 링크를 누르면 나라 페이지로 감", async ({ browser, baseURL }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL });
    const page = await ctx.newPage();
    await page.goto("/prices");
    const first = links(page).first();
    const href = await first.getAttribute("href");
    await first.click();
    await expect(page).toHaveURL(new RegExp(`${href}/?$`));
    await ctx.close();
  });
});

test.describe("넓은 화면 1440 — 오른쪽 420px · 뒤를 덮지 않고 밀어냄 · 스크롤 안 잠금 (작업 0361)", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, 1440);
  });

  test("누르면 나라 페이지로 가지 않고 사이드바 · 주소는 /prices 그대로 · dialog 이름에 나라 이름 · 막 없음", async ({ page }) => {
    const link = links(page).first();
    const name = ((await link.innerText()) ?? "").trim();
    await openAt(page, 0);
    await expect(page).toHaveURL(/\/prices\/?$/);
    await expect(side(page)).toHaveAttribute("role", "dialog");
    await expect(side(page)).toHaveAccessibleName(new RegExp(name));
    await expect(tid(page, "country-side-backdrop")).toHaveCount(0);
  });

  test("크기 · 자리: 오른쪽 끝에 붙은 폭 420px · 화면 높이 전체", async ({ page }) => {
    await openAt(page);
    const [b, vp] = [await box(side(page)), page.viewportSize()!];
    expect(Math.abs(b.width - SIDE_W)).toBeLessThanOrEqual(1);
    expect(Math.abs(b.x + b.width - vp.width)).toBeLessThanOrEqual(1);
    expect(b.y).toBeLessThanOrEqual(1);
    expect(b.height).toBeGreaterThanOrEqual(vp.height - 1);
  });

  test("본문을 왼쪽으로 밀어냄: 열린 동안 목록(price-bands)이 패널 왼쪽 안에 · 목록 세 칸이 모두 보임 · 닫으면 원래 자리", async ({ page }) => {
    const before = await box(tid(page, "price-bands"));
    await openAt(page);
    const [open_, panel, vp] = [await box(tid(page, "price-bands")), await box(side(page)), page.viewportSize()!];
    await expect.poll(async () => (await box(tid(page, "price-bands"))).x + (await box(tid(page, "price-bands"))).width, { message: "목록 오른쪽 끝이 패널 왼쪽 안" }).toBeLessThanOrEqual(panel.x + 1);
    expect(open_.x, "목록 왼쪽은 화면 안").toBeGreaterThanOrEqual(0);
    // 목록 나라 링크가 모두 패널에 가려지지 않음(오른쪽 끝이 패널 왼쪽 이하)
    for (const l of await links(page).all()) {
      const b = await l.boundingBox();
      if (b && b.width > 0) expect(b.x + b.width, "링크가 패널 밑으로 들어감").toBeLessThanOrEqual(panel.x + 1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), "가로 넘침").toBeLessThanOrEqual(0);
    await page.keyboard.press("Escape");
    await expect(side(page)).toBeHidden();
    await expect.poll(async () => Math.abs((await box(tid(page, "price-bands"))).width - before.width)).toBeLessThanOrEqual(1);
    expect(vp.width).toBe(1440);
  });

  test("뒤 스크롤을 잠그지 않음: 열린 동안 왼쪽 본문에서 휠을 굴리면 페이지가 내려감", async ({ page }) => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    // 링크를 화면으로 스크롤하지 않고 바로 열어(페이지 끝에 가 있으면 더 내려갈 곳이 없음) 페이지가 위쪽에 있는 채로 시험
    await links(page).first().evaluate((el) => (el as HTMLElement).click());
    await expect(side(page)).toBeVisible();
    const y0 = await page.evaluate(() => scrollY);
    await page.mouse.move(200, 300);
    await page.mouse.wheel(0, 600);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(y0 + 100);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow), "html overflow 를 잠그지 않음").not.toBe("hidden");
  });

  test("연 채로 다른 나라 이름을 누르면 닫히지 않고 내용만 바뀜 · 주소 그대로 · n / 전체 가 따라 바뀜", async ({ page }) => {
    await openAt(page, 0);
    const first = await tid(page, "country-side-crumb").innerText();
    const target = links(page).nth(3);
    const targetName = ((await target.innerText()) ?? "").trim();
    await target.evaluate((el) => (el as HTMLElement).click());
    await expect(tid(page, "country-side-crumb")).toContainText(targetName);
    expect(await tid(page, "country-side-crumb").innerText()).not.toBe(first);
    await expect(side(page)).toBeVisible();
    await expect(page).toHaveURL(/\/prices\/?$/);
    const total = await links(page).count();
    await expect(tid(page, "country-side-pos")).toHaveText(`4 / ${total}`);
  });
});

test.describe("‹ › · n / 전체 (작업 0361)", () => {
  test("처음 나라는 1 / 전체 · ‹ 는 막힘 · › 를 누르면 다음 나라(목록의 지금 순서) · 끝에서 › 가 막힘", async ({ page }) => {
    await open(page, 1440);
    const total = await links(page).count();
    expect(total).toBeGreaterThan(3);
    await openAt(page, 0);
    await expect(tid(page, "country-side-pos")).toHaveText(`1 / ${total}`);
    await expect(tid(page, "country-side-prev")).toBeDisabled();
    const names = await links(page).evaluateAll((as) => as.map((a) => (a.textContent ?? "").trim()));
    await tid(page, "country-side-next").click();
    await expect(tid(page, "country-side-pos")).toHaveText(`2 / ${total}`);
    await expect(tid(page, "country-side-crumb")).toContainText(names[1]);
    await expect(tid(page, "country-side-prev")).toBeEnabled();
    await tid(page, "country-side-prev").click();
    await expect(tid(page, "country-side-pos")).toHaveText(`1 / ${total}`);
    await expect(tid(page, "country-side-crumb")).toContainText(names[0]);
    await expect(side(page), "단추를 눌러도 닫히지 않음").toBeVisible();
    // 끝 나라를 열어 › 가 막히는지
    await links(page).last().evaluate((el) => (el as HTMLElement).click());
    await expect(tid(page, "country-side-pos")).toHaveText(`${total} / ${total}`);
    await expect(tid(page, "country-side-next")).toBeDisabled();
  });

  test("순서 = 목록의 지금 순서(싼 곳 → 비슷한 곳 → 비싼 곳 · 화면에 그려진 순서)", async ({ page }) => {
    await open(page, 1440);
    const order = await hrefs(page);
    await openAt(page, 0);
    const seen: string[] = [];
    for (let i = 0; i < Math.min(5, order.length); i++) {
      seen.push(await tid(page, "country-side-detail").getAttribute("href").then(codeOf));
      if (i < 4) await tid(page, "country-side-next").click();
      await expect(tid(page, "country-side-pos")).toHaveText(new RegExp(`^${Math.min(i + 2, 5)} / `));
    }
    expect(seen).toEqual(order.slice(0, seen.length));
  });
});

test.describe("n / 전체는 지금 펼친 목록 기준 (작업 0361)", () => {
  test("나라 더 보기로 펼치면 전체가 늘어나고 · 새로 드러난 마지막 나라가 n / n · 접으면 다시 줄어듦", async ({ page }) => {
    await open(page, 1440);
    const folded = await links(page).count();
    await openAt(page, 0);
    await expect(tid(page, "country-side-pos")).toHaveText(`1 / ${folded}`);
    await page.keyboard.press("Escape");
    await expect(side(page)).toBeHidden();
    await expandAll(page);
    const all = await links(page).count();
    expect(all).toBeGreaterThan(folded);
    await openAt(page, 0);
    await expect(tid(page, "country-side-pos")).toHaveText(`1 / ${all}`);
    await links(page).last().evaluate((el) => (el as HTMLElement).click());
    await expect(tid(page, "country-side-pos")).toHaveText(`${all} / ${all}`);
    await expect(tid(page, "country-side-next")).toBeDisabled();
  });
});

test.describe("내용 (작업 0361)", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, 1440);
    await expandAll(page); // 일본 · 마카오는 접힌 목록 안에 있음
  });

  test("경로 · 물가 문장(나라 페이지 제목과 같은 규칙) · 한 줄 답 · 값 · 예산 · 다음으로 볼 것 · 자세히 보기", async ({ page }) => {
    const i = (await hrefs(page)).indexOf("JPN");
    test.skip(i < 0, "일본이 목록에 없음");
    await openAt(page, i);
    await expect(tid(page, "country-side-crumb")).toHaveText("여행 물가 › 일본");
    // 나라 페이지의 큰 제목과 같은 문장
    const other = await page.context().newPage();
    await other.goto("/prices/JPN");
    const h1 = ((await other.getByRole("heading", { level: 1 }).innerText()) ?? "").replace(/\s+/g, " ").trim();
    const oneline = other.locator('[data-testid="country-oneline"]');
    // 나라 페이지의 한 줄 답 상자: 첫 줄 이름표("오늘 기준 한 줄 답 · 날짜") · 둘째 줄 문장 · 셋째 줄 보충(note) — 사이드바는 문장을 보임
    const onelineText = (await oneline.count()) ? (((await oneline.innerText()) ?? "").split("\n").map((l) => l.trim()).filter(Boolean)[1] ?? null) : null;
    await other.close();
    expect(((await tid(page, "country-side-title").innerText()) ?? "").replace(/\s+/g, " ").trim()).toBe(h1);
    if (onelineText) await expect(tid(page, "country-side-answer")).toContainText(onelineText);
    else await expect(tid(page, "country-side-answer")).toContainText("아직 환율을 받지 않아 물가만");
    // 값 = 목록의 물가 N · 예산 = 약 N 천 원
    const row = links(page).nth(i).locator("xpath=ancestor::li[1]");
    const listValue = Number(((await row.innerText()) ?? "").match(/물가\s*(\d+)\s*\(한국 100\)/)?.[1]);
    expect(listValue).toBeGreaterThan(0);
    await expect(tid(page, "country-side-value")).toHaveText(String(listValue));
    await expect(tid(page, "country-side-budget")).toHaveText(/^약 [\d,]+원$/);
    // 다음으로 볼 것 · 자세히 보기
    const cards = tid(page, "country-side-next-card");
    expect(await cards.count()).toBeGreaterThanOrEqual(2);
    expect(await cards.count()).toBeLessThanOrEqual(3);
    for (const c of await cards.all()) expect(await c.getByRole("link").first().getAttribute("href")).toBeTruthy();
    await expect(tid(page, "country-side-detail")).toHaveText(/^일본 물가 자세히 보기\s*›$/);
    await expect(tid(page, "country-side-detail")).toHaveAttribute("href", /\/prices\/JPN\/?$/);
  });

  test("다음으로 볼 것 번호는 1부터 빈틈없이 이어짐 — 환전 카드가 있는 나라(일본)도 없는 나라(헝가리 · 마카오)도", async ({ page }) => {
    const all = await hrefs(page);
    const picks = ["JPN", "HUN", "MAC"].filter((c) => all.includes(c));
    expect(picks.length, "환전이 있는 나라와 없는 나라가 둘 다 목록에 있어야 함").toBeGreaterThanOrEqual(2);
    for (const code of picks) {
      await openAt(page, all.indexOf(code));
      const kickers = await tid(page, "country-side-next-card").evaluateAll((els) => els.map((e) => ((e as HTMLElement).innerText.split("\n").map((l) => l.trim()).find((l) => l !== "") ?? "")));
      expect(kickers.length, code).toBeGreaterThanOrEqual(2);
      const nums = kickers.map((k) => Number(/^(\d+)\s*·/.exec(k)?.[1]));
      expect(nums, `${code} 카드 번호(${kickers.join(" | ")})`).toEqual(kickers.map((_, i) => i + 1));
      await page.keyboard.press("Escape");
      await expect(side(page)).toBeHidden();
    }
  });

  test("받는 통화가 없는 나라(마카오)는 한 줄 답 자리에 '아직 환율을 받지 않아 물가만' · 환전 카드 없음", async ({ page }) => {
    const i = (await hrefs(page)).indexOf("MAC");
    test.skip(i < 0, "마카오가 목록에 없음");
    await openAt(page, i);
    await expect(tid(page, "country-side-answer")).toContainText("아직 환율을 받지 않아 물가만");
    await expect(tid(page, "country-side-next-card").filter({ hasText: "환전" })).toHaveCount(0);
  });

  test("맨 아래 링크를 누르면 그 나라 페이지로", async ({ page }) => {
    await openAt(page, 0);
    const href = await tid(page, "country-side-detail").getAttribute("href");
    await tid(page, "country-side-detail").click();
    await expect(page).toHaveURL(new RegExp(`${href}/?$`));
  });
});

test.describe("좁은 화면 — 아래 78% 시트 · 뒤를 덮고 스크롤 잠금 · 바깥 누르면 닫힘 (작업 0361)", () => {
  for (const [w, h] of [[900, 900], [375, 812]] as const) {
    test(`${w}px — 시트: 폭 전체 · 화면 아래에 붙은 높이 78% · 어두운 막 · 바깥을 누르면 닫힘`, async ({ page }) => {
      await open(page, w, h);
      await openAt(page, 0);
      const [b, vp] = [await box(side(page)), page.viewportSize()!];
      expect(b.width).toBeGreaterThanOrEqual(vp.width - 1);
      expect(Math.abs(b.y + b.height - vp.height), "아래에 붙음").toBeLessThanOrEqual(1);
      expect(Math.abs(b.height - vp.height * 0.78), "높이 78%").toBeLessThanOrEqual(2);
      await expect(tid(page, "country-side-backdrop")).toBeVisible();
      await page.mouse.click(vp.width / 2, 10); // 시트 위쪽 막
      await expect(side(page)).toBeHidden();
    });

    test(`${w}px — 뒤 스크롤 잠금: 열린 동안 휠 · 터치로 뒤 페이지가 안 움직이고 닫으면 원래 위치`, async ({ page }) => {
      await open(page, w, h);
      await page.evaluate(() => window.scrollTo({ top: 400, behavior: "instant" }));
      const y0 = await page.evaluate(() => scrollY);
      expect(y0).toBeGreaterThan(100);
      const link = links(page).first();
      await link.evaluate((el) => (el as HTMLElement).click()); // 화면 위치 그대로 열기
      await expect(side(page)).toBeVisible();
      await page.mouse.move(w / 2, h * 0.1); // 막 위
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(200);
      expect(await page.evaluate(() => scrollY), "막 위에서 굴려도 뒤 페이지는 그대로").toBe(y0);
      const list = side(page).locator("[data-scroll-ok]").first();
      if (await list.count()) {
        const lb = await box(list);
        await page.mouse.move(lb.x + lb.width / 2, lb.y + lb.height / 2);
        for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 900);
        await page.waitForTimeout(200);
        expect(await page.evaluate(() => scrollY), "시트 안 목록 끝에서 더 굴려도 뒤 페이지는 그대로").toBe(y0);
      }
      await page.keyboard.press("Escape");
      await expect(side(page)).toBeHidden();
      expect(await page.evaluate(() => scrollY), "닫으면 원래 위치").toBe(y0);
    });

    test(`${w}px — 시트: Tab 이 밖으로 나가지 않음(모달) · ‹ › · 한 줄로 쌓인 목록이 시트 안에서 넘치지 않음`, async ({ page }) => {
      await open(page, w, h);
      await openAt(page, 0);
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press("Tab");
        expect(await side(page).evaluate((el) => el.contains(document.activeElement)), `Tab ${i + 1}번째`).toBe(true);
      }
      expect(await side(page).evaluate((el) => el.scrollWidth - el.clientWidth), "시트 안 가로 넘침").toBeLessThanOrEqual(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), "페이지 가로 넘침").toBeLessThanOrEqual(0);
    });
  }

  test("경계: 1024px 는 사이드바(막 없음) · 1023px 는 시트(막 있음)", async ({ page }) => {
    await open(page, 1024, 900);
    await openAt(page, 0);
    await expect(tid(page, "country-side-backdrop")).toHaveCount(0);
    expect(Math.abs((await box(side(page))).width - SIDE_W)).toBeLessThanOrEqual(1);
    await page.keyboard.press("Escape");
    await expect(side(page)).toBeHidden();
    await page.setViewportSize({ width: 1023, height: 900 });
    await openAt(page, 0);
    await expect(tid(page, "country-side-backdrop")).toBeVisible();
    expect(Math.abs((await box(side(page))).width - 1023)).toBeLessThanOrEqual(1);
  });
});

test.describe("접근성 · 움직임 (작업 0361)", () => {
  test("열면 포커스가 사이드바 안 · Esc 로 닫으면 누른 나라 링크로 돌아옴 · ✕ 도 같음", async ({ page }) => {
    await open(page, 1440);
    const link = await openAt(page, 2);
    expect(await side(page).evaluate((el) => el.contains(document.activeElement))).toBe(true);
    await page.keyboard.press("Escape");
    await expect(side(page)).toBeHidden();
    await expect(link).toBeFocused();
    await openAt(page, 2);
    await tid(page, "country-side-close").click();
    await expect(side(page)).toBeHidden();
    await expect(link).toBeFocused();
  });

  test("사이드바 안 글을 눌러도 Esc 로 닫힘 (포커스가 body 로 가도)", async ({ page }) => {
    await open(page, 1440);
    await openAt(page, 0);
    await tid(page, "country-side-crumb").click();
    await page.keyboard.press("Escape");
    await expect(side(page)).toBeHidden();
  });

  test("움직임 줄이기: 누르자마자 최종 크기로 열림(1ms 넘는 진행 중 움직임 없음) · 닫으면 바로", async ({ page }) => {
    await open(page, 1440);
    await openAt(page);
    const running = await page.evaluate(() => document.getAnimations().filter((a) => a.effect && Number(a.effect.getComputedTiming().duration) > 1 && a.effect.getComputedTiming().iterations !== Number.POSITIVE_INFINITY && a.playState === "running").length);
    expect(running).toBe(0);
    expect(Math.abs((await box(side(page))).width - SIDE_W)).toBeLessThanOrEqual(1);
    await page.keyboard.press("Escape");
    await expect(side(page)).toBeHidden({ timeout: 300 });
  });

  test("움직임 있음: 열린 뒤 2초 안에 내용이 보이고 닫으면 2초 안에 사라지며 포커스가 누른 링크로 (모양은 @design)", async ({ page }) => {
    await open(page, 1440);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const link = links(page).nth(1);
    await link.scrollIntoViewIfNeeded();
    await link.evaluate((el) => (el as HTMLElement).click());
    await expect(tid(page, "country-side-crumb")).toBeVisible({ timeout: 2000 });
    await page.keyboard.press("Escape");
    await expect(side(page)).toBeHidden({ timeout: 2000 });
    await expect(link).toBeFocused();
  });
});

test.describe("세 폭 1440 · 1100 · 1024 · 900 · 375 — 목록이 찌그러지지 않고 겹치지 않음 (작업 0361 · 중간 폭 확인)", () => {
  for (const [w, h] of [[1440, 900], [1100, 900], [1024, 900], [900, 900], [375, 812]] as const) {
    test(`${w}px — 열린 채 가로 넘침 없음 · 패널이 목록 링크를 덮지 않음(사이드바) · 링크 폭이 충분 · ‹ › ✕ 누르는 자리`, async ({ page }) => {
      await open(page, w, h);
      await openAt(page, 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${w}px 가로 넘침`).toBeLessThanOrEqual(0);
      const panel = await box(side(page));
      if (w >= 1024) {
        // 사이드바: 목록 링크는 모두 패널 왼쪽 · 칸이 쌓여도 링크 폭은 충분(찌그러지지 않음)
        const widths: number[] = [];
        for (const l of await links(page).all()) {
          const b = await l.boundingBox();
          if (!b || b.width === 0) continue;
          expect(b.x + b.width, `${w}px 링크가 패널 밑`).toBeLessThanOrEqual(panel.x + 1);
          widths.push(b.width);
        }
        expect(Math.min(...widths), `${w}px 가장 좁은 링크 폭`).toBeGreaterThanOrEqual(90);
        // 같은 쪽에 있는 위쪽 노선 카드 · 자도 밀려 줄어든 폭 안에서 잘리지 않음 (사이드바가 본문을 밀면 노선 카드 폭도 같이 줄어듦 · 휴대폰 규칙은 화면 폭 760 이하라 이 폭에서는 안 걸림)
        const clipped = await tid(page, "route-card").evaluate((card) => {
          const c = card.getBoundingClientRect();
          return [...card.querySelectorAll("*")].filter((e) => (e.textContent ?? "").trim() !== "" && e.children.length === 0 && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().right > c.right + 1).map((e) => `${(e.textContent ?? "").trim().slice(0, 16)}(+${Math.round(e.getBoundingClientRect().right - c.right)}px)`);
        });
        expect(clipped, `${w}px 노선 카드 안 글이 카드 오른쪽 밖으로 잘림`).toEqual([]);
        const routeBox = await box(tid(page, "route-card"));
        expect(routeBox.x + routeBox.width, `${w}px 노선 카드가 패널 밑으로 들어감`).toBeLessThanOrEqual(panel.x + 1);
        // 목록의 칸(구간) 상자가 서로 겹치지 않음
        const secs = await tid(page, "price-bands").locator("section").evaluateAll((els) => els.map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
        for (let i = 0; i < secs.length; i++) for (let j = i + 1; j < secs.length; j++) {
          const ox = Math.min(secs[i].x + secs[i].w, secs[j].x + secs[j].w) - Math.max(secs[i].x, secs[j].x);
          const oy = Math.min(secs[i].y + secs[i].h, secs[j].y + secs[j].h) - Math.max(secs[i].y, secs[j].y);
          expect(ox > 2 && oy > 2, `${w}px 칸 ${i + 1} · ${j + 1} 겹침`).toBe(false);
        }
      } else {
        expect(panel.width).toBeGreaterThanOrEqual(w - 1);
      }
      if (w <= 390) {
        for (const id of ["country-side-prev", "country-side-next", "country-side-close"]) {
          const b = await box(tid(page, id));
          expect(b.height, `${id} 높이 44px`).toBeGreaterThanOrEqual(44);
          expect(b.width, `${id} 폭 44px`).toBeGreaterThanOrEqual(44);
        }
      }
    });
  }
});

test.describe("0360 노선 카드 버튼 연결 (작업 0361)", () => {
  /** 가로 카드 · 세로 목록 둘 다 DOM 에 있고 폭에 따라 하나만 보임 */
  const visibleDetail = (page: Page) => tid(page, "route-card-detail").filter({ visible: true });

  for (const [w, h] of [[1440, 900], [375, 812]] as const) {
    test(`${w}px — 노선 카드 '{나라} 자세히 보기 ›' 를 누르면 같은 사이드바(시트)가 열리고 주소 그대로 · 닫으면 그 버튼으로 포커스 · HTML 링크는 나라 페이지`, async ({ page }) => {
      await open(page, w, h);
      const detail = visibleDetail(page);
      await expect(detail).toHaveCount(1);
      const href = await detail.getAttribute("href");
      expect(href).toMatch(/^\/prices\/[A-Z]{3}$/);
      await detail.scrollIntoViewIfNeeded();
      await detail.evaluate((el) => (el as HTMLElement).click());
      await expect(side(page)).toBeVisible();
      await expect(page).toHaveURL(/\/prices\/?$/);
      await expect(tid(page, "country-side-detail")).toHaveAttribute("href", new RegExp(`${href}/?$`));
      await expect(side(page), "사이드바 이름에 그 나라").toHaveAccessibleName(/\S/);
      if (w >= 1024) await expect(tid(page, "country-side-backdrop")).toHaveCount(0);
      else await expect(tid(page, "country-side-backdrop")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(side(page)).toBeHidden();
      await expect(detail, "닫으면 누른 노선 카드 버튼으로 포커스").toBeFocused();
    });
  }

  test("탭을 바꿔 노선이 달라져도 카드 버튼이 그 정거장 나라의 사이드바를 엶", async ({ page }) => {
    await open(page, 1440);
    const tabs = tid(page, "route-tab");
    test.skip((await tabs.count()) === 0, "노선 탭 없음");
    await page.locator('[data-testid="route-tab"][data-tab="sea"]').click();
    const detail = visibleDetail(page);
    const href = await detail.getAttribute("href");
    await detail.evaluate((el) => (el as HTMLElement).click());
    await expect(side(page)).toBeVisible();
    await expect(tid(page, "country-side-detail")).toHaveAttribute("href", new RegExp(`${href}/?$`));
  });
});

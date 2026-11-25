// 작업 0365 — 통화 상세 맨 아래 "둘러보기" 표 숨기기 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 원문: "이거는 이제 없어도 될거 같아 · 그냥 숨기거나 해도 될거 같은데 어차피 사이드바에 나오잖아 · 자주 묻는 질문쪽 밑에 있으니까 어색해"
// 정한 방법: 사용자에게 표는 보이지 않음 · 링크는 "다른 나라 통화 보기" 사이드바 목록에 미리 그려 둠(서버 첫 그림 HTML) · 닫힌 동안 접근성 트리에서 빠짐 · 버튼을 누르면 보임 · JS 없을 때 버튼은 /currencies 링크
//
// builder 가 맞출 표시 (data-testid) — 새로 생기는 것 없음, 아래 기존 이름을 그대로 씀
//   currency-list        둘러보기 표 구간 → 통화 상세(/currencies/XXX)에는 없음 · /currencies 목록 페이지에는 그대로 있음(안에 currency-row 줄)
//   currency-more        "다른 나라 통화 보기" 버튼(JS 없으면 a[href="/currencies"])
//   currency-sidebar     사이드바(role=dialog) · 닫힌 동안은 화면에도 접근성 트리에도 없고 HTML 에는 있음(display:none · inert · aria-hidden 중 무엇이든)
//   currency-side-list   사이드바 안 목록 ul · 서버 첫 그림 HTML 에 통화 줄이 모두 들어 있음
//   currency-side-row    줄 하나 = 줄 전체가 a[href="/currencies/코드"] (줄 수 = 실제 통화 수 22)
//   currency-faq         자주 묻는 질문 구간(0345) · 페이지는 이 구간 → 출처 줄(footer)로 끝남
import { type Page, expect, test } from "@playwright/test";
import { listCodes, openSide, sideLinks, tid } from "./currency-list";

const CODES = ["MYR", "JPY"];
const REAL_COUNT = 22; // 실제 통화 수 (작업 요청에 적힌 값 · 아래에서 /currencies 목록 표 줄 수와도 맞춰 봄)
const html = async (page: Page, path: string) => {
  const r = await page.request.get(path);
  expect(r.status(), `${path} 가 정적 페이지로 있어야 함`).toBe(200);
  return r.text();
};
/** HTML 글에서 사이드바 목록(ul) 하나의 안쪽 */
const sideListHtml = (h: string) => {
  const i = h.indexOf('data-testid="currency-side-list"');
  expect(i, "정적 HTML 에 사이드바 목록이 있어야 함").toBeGreaterThan(-1);
  return h.slice(i, h.indexOf("</ul>", i));
};
const hrefsIn = (h: string) => [...new Set([...h.matchAll(/href="\/currencies\/([A-Z]{3})\/?"/g)].map((m) => m[1]))];

test.describe("정적 HTML — 자바스크립트 없이 받은 첫 그림 (작업 0365)", () => {
  for (const code of CODES) {
    test(`/currencies/${code} — 사이드바 목록 안에 /currencies/XXX 링크가 실제 통화 수(22)만큼 · ${code} 도 있음`, async ({ page }) => {
      const h = await html(page, `/currencies/${code}`);
      const codes = hrefsIn(sideListHtml(h));
      expect(codes.length, "사이드바 목록 안 통화 링크 수").toBe(REAL_COUNT);
      expect(codes).toContain(code);
      expect((sideListHtml(h).match(/data-testid="currency-side-row"/g) ?? []).length, "줄 수").toBe(REAL_COUNT);
    });
  }

  test("통화 상세 HTML 에는 둘러보기 표(currency-list · currency-row · 통화 목록 nav)가 없음", async ({ page }) => {
    const h = await html(page, "/currencies/MYR");
    expect(h).not.toContain('data-testid="currency-list"');
    expect(h).not.toContain('data-testid="currency-row"');
    expect(h).not.toContain('aria-label="통화 목록"');
  });

  test("실제 통화 수 = /currencies 목록 페이지 표 줄 수 = 22 (숫자를 하나로 맞춤)", async ({ page }) => {
    const h = await html(page, "/currencies");
    expect((h.match(/data-testid="currency-row"/g) ?? []).length).toBe(REAL_COUNT);
  });

  test("버튼은 자바스크립트가 없으면 a[href=/currencies] (통화 목록 페이지로)", async ({ page }) => {
    const h = await html(page, "/currencies/MYR");
    const tag = h.match(/<a[^>]*data-testid="currency-more"[^>]*>/)?.[0] ?? "";
    expect(tag, "버튼 자리에 링크").not.toBe("");
    expect(tag).toMatch(/href="\/currencies\/?"/);
  });
});

test.describe("통화 상세 화면 (작업 0365)", () => {
  for (const code of CODES) {
    test(`/currencies/${code} — 둘러보기 표 구간이 화면에 없음 · 제목 '둘러보기' 도 없음`, async ({ page }) => {
      await page.goto(`/currencies/${code}`);
      await expect(tid(page, "currency-detail")).toBeVisible();
      await expect(tid(page, "currency-list")).toHaveCount(0);
      await expect(tid(page, "currency-row")).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "통화 목록" })).toHaveCount(0);
      await expect(page.getByText("둘러보기", { exact: true }), "구간 제목").toHaveCount(0);
    });
  }

  test("페이지는 자주 묻는 질문 → 출처 줄로 끝남 — 그 사이에 통화 링크 · 표가 없음", async ({ page }) => {
    await page.goto("/currencies/MYR");
    await expect(tid(page, "currency-faq")).toBeVisible();
    // 문서 좌표로 한 번에 잼
    const m = await page.evaluate(() => {
      const abs = (el: Element) => { const r = el.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY }; };
      const faq = abs(document.querySelector('[data-testid="currency-faq"]')!);
      const footers = document.querySelectorAll("footer");
      const foot = abs(footers[footers.length - 1]);
      const links = [...document.querySelectorAll("a[href^='/currencies/']")].filter((a) => {
        const r = a.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.top + scrollY >= faq.bottom && r.bottom + scrollY <= foot.top;
      }).length;
      return { gap: foot.top - faq.bottom, links, afterFaq: foot.top >= faq.bottom };
    });
    expect(m.afterFaq, "출처 줄이 자주 묻는 질문 아래").toBe(true);
    expect(m.links, "자주 묻는 질문과 출처 줄 사이의 통화 링크 수").toBe(0);
    expect(m.gap, "자주 묻는 질문 아래 빈 틈(px) — 표가 있던 자리는 수백 px").toBeLessThan(260);
  });

  test("닫힌 동안 — 목록은 HTML 에 있지만(링크 22) 화면에 안 보이고 접근성 트리에서 빠짐(두 번 읽히지 않음)", async ({ page }) => {
    await page.goto("/currencies/MYR");
    await page.waitForLoadState("networkidle");
    expect(await sideLinks(page).count(), "닫혀 있어도 DOM 에 있는 링크").toBe(REAL_COUNT);
    await expect(tid(page, "currency-sidebar")).toBeHidden();
    await expect(tid(page, "currency-side-list")).toBeHidden();
    // 역할로 찾으면 숨겨진 것은 빠짐 — 사이드바 안 링크 · 대화상자 모두 0
    await expect(tid(page, "currency-sidebar").getByRole("link")).toHaveCount(0);
    await expect(page.getByRole("dialog")).toHaveCount(0);
    const snap = await page.locator("body").ariaSnapshot();
    expect(snap, "접근성 트리에 사이드바 목록 제목이 없음").not.toContain("다른 나라 통화\n");
    expect((snap.match(/currencies\/[A-Z]{3}/g) ?? []).length, "접근성 트리 링크 수").toBeLessThan(REAL_COUNT + 12); // 칩 · 검색 등 몇 개만 — 목록 22개가 더해져 있지 않음
  });

  test("버튼을 누르면 그 목록이 보임 · 줄 22개가 접근성 트리에 한 번씩 · 닫으면 다시 빠짐", async ({ page }) => {
    await page.goto("/currencies/MYR");
    await page.waitForLoadState("networkidle");
    await openSide(page);
    await expect(tid(page, "currency-side-list")).toBeVisible();
    await expect(tid(page, "currency-sidebar").getByRole("link")).toHaveCount(REAL_COUNT);
    await expect(tid(page, "currency-side-row").first()).toBeVisible();
    expect(await listCodes(page)).toHaveLength(REAL_COUNT);
    await page.keyboard.press("Escape");
    await expect(tid(page, "currency-sidebar")).toBeHidden();
    await expect(tid(page, "currency-sidebar").getByRole("link")).toHaveCount(0);
    expect(await sideLinks(page).count(), "닫아도 HTML 에는 남음").toBe(REAL_COUNT);
  });
});

test.describe("/currencies 통화 목록 페이지 — 표는 그대로 (작업 0365)", () => {
  test("둘러보기 표(줄 22개 · 제목 '둘러보기')가 그대로 있음", async ({ page }) => {
    await page.goto("/currencies");
    await expect(tid(page, "currency-list")).toBeVisible();
    await expect(tid(page, "currency-list")).toContainText("둘러보기");
    await expect(tid(page, "currency-list").locator('li[data-testid="currency-row"]')).toHaveCount(REAL_COUNT);
  });
});

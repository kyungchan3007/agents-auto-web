// 작업 0380 — hero 새 문구 · 입력창 · 칩 e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상) · 0347 의 옛 안내 줄(hero-guide · hero-free) 검사는 새 문구로 바꿈
//   builder 가 다는 표시(data-testid) — 홈 hero(home-hero) 안: hero-lede(한 줄 "항공료가 … 가장 낮은 달입니다.") · hero-tag(꼬리표 "통계청 국제항공료 지수") · hero-sub(입력창 아래 작은 줄)
//     hero-search(입력창 · role combobox · 자리 글 "어디로 가세요? 도시 · 나라") · hero-go(버튼 "보기") · hero-chip(칩 넷 · 글 도쿄 방콕 다낭 파리 · 국기 이모지 허용)
//   작업 0384: 아래 예전 탑승권 카드(ticket · flap-board · trip-switcher · 카드 검색 칸 · picked-country-link)는 지워짐 — 카드 검사는 뺐고 hero 입력창 · 칩이 같은 저장 값(flapfx:picked)을 씀
//   제목 위 작은 라벨 "여행 타이밍" 은 새 hero 에 없음(시안 · prd 에 없음) — 이 라벨을 보던 검사는 지웠다
// (아래는 작업 0347 때 머리 주석 · 카드 쪽 표시는 그대로)
// 작업 0347 — 홈 첫 화면 안내 9-C e2e
//   요구: 설명 문장 아래 안내 문장 + "가입 없이 무료" 작은 줄 · 카드 검색 칸 노란 테두리 + 칩 줄과 함께 90일 신호 줄 위 · 자리표시 글 · 나라 고르면 카드 여행지 바뀜 + 그 나라 페이지 링크(없는 나라는 링크 없음) · 노트북 높이마다 첫 화면
//   builder 가 다는 표시(data-testid) — 홈 안
//     hero-guide   안내 문장 (home-hero 안 p · 설명 문장 아래)
//     hero-free    작은 줄 "가입 없이 무료 · ↓" (home-hero 안 마지막 p · 카드 위)
//     picked-country-link   카드 안 나라 페이지 링크 (고른 나라가 있고 그 나라 페이지가 있을 때만)
//   기존 표시 그대로: home-hero · hero-month · ticket · ticket-evidence · trip-switcher · pick-chip · combobox "여행지 검색" · option
//   기존 home-fix-0217.spec.ts 는 이 작업에서 고침: 설명 문장 ↔ 카드 간격(시안 B 50px · 40px)은 안내 줄이 끼어 마지막 p(작은 줄) ↔ 카드로 8 ~ 54px
import { type Page, expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";
import { typeHero } from "./hero-search";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const picked = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("flapfx:picked") ?? "null"));
const heroSearch = (page: Page) => tid(page, "hero-search");
const box = async (loc: ReturnType<Page["locator"]>, name: string) => {
  const b = await loc.first().boundingBox();
  if (!b) throw new Error(`${name} 가 화면에 없음`);
  return b;
};
test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
  await page.addInitScript(() => localStorage.setItem("flapfx:intro-off", "1"));
});

test.describe("홈 hero 새 문구 (작업 0380 · 울트라마린 탑승권 시안)", () => {
  test("한 줄 · 꼬리표 · 입력창 아래 작은 줄 — 사용자가 정한 글 그대로", async ({ page }) => {
    await page.goto("/");
    await expect(tid(page, "hero-lede")).toHaveText(/^항공료가 (1년|받은 달) 중 가장 낮은 달입니다\.$/);
    await expect(tid(page, "hero-tag")).toHaveText("통계청 국제항공료 지수");
    await expect(tid(page, "hero-sub")).toHaveText("환율 · 물가 · 떠나기 좋은 때를 한 번에");
  });

  test("뺀 문구 없음 — 안내 문장(HERO_GUIDE.lead) · 가입 없이 무료(free) · 지수 최저 · 최고 긴 문장", async ({ page }) => {
    await page.goto("/");
    await expect(tid(page, "hero-guide")).toHaveCount(0);
    await expect(tid(page, "hero-free")).toHaveCount(0);
    const hero = tid(page, "home-hero");
    for (const gone of ["아래 칸에 도시나 나라를 넣으면", "가입 없이 무료", "통계청 국제항공료 지수로 보면", "가장 높습니다"]) await expect(hero, gone).not.toContainText(gone);
  });

  test("서버 첫 그림(자바스크립트 없이 받은 HTML)에도 새 문구가 들어 있고 뺀 문구는 없음", async ({ page }) => {
    const h = await (await page.request.get("/")).text();
    expect(h).toContain("환율 · 물가 · 떠나기 좋은 때를 한 번에");
    expect(h).toContain("통계청 국제항공료 지수");
    expect(h).not.toContain("아래 칸에 도시나 나라를 넣으면");
    expect(h).not.toContain("가입 없이 무료");
  });

  test("차례 — 큰 제목 · 한 줄 · 입력창 · 작은 줄 · 칩(위에서 아래로) · 모두 화면 안", async ({ page }) => {
    await page.goto("/");
    const h1 = await box(page.getByRole("heading", { level: 1 }), "큰 제목");
    const lede = await box(tid(page, "hero-lede"), "한 줄");
    const input = await box(heroSearch(page), "입력창");
    const sub = await box(tid(page, "hero-sub"), "작은 줄");
    const chip = await box(tid(page, "hero-chip"), "첫 칩");
    expect(lede.y, "한 줄이 큰 제목 아래").toBeGreaterThanOrEqual(h1.y + h1.height - 2);
    expect(input.y, "입력창이 한 줄 아래").toBeGreaterThanOrEqual(lede.y + lede.height - 1);
    expect(sub.y, "작은 줄이 입력창 아래").toBeGreaterThanOrEqual(input.y + input.height - 1);
    expect(chip.y, "칩이 작은 줄 아래").toBeGreaterThanOrEqual(sub.y + sub.height - 1);
    for (const [name, b] of [["한 줄", lede], ["입력창", input], ["작은 줄", sub], ["칩", chip]] as const) expect(b.x + b.width, `${name} 화면 안`).toBeLessThanOrEqual((page.viewportSize()?.width ?? 0) + 1);
  });
});

test.describe("예전 탑승권 카드 없음 (작업 0384)", () => {
  test("첫 페이지에 예전 카드(ticket · today)가 없음 — 카드 · 안내판 · 여행지 고르기 · 나라 링크 · 탑승권 보기 · id=board", async ({ page }) => {
    await page.goto("/");
    for (const id of ["ticket", "ticket-band", "ticket-evidence", "trip-switcher", "picked-country-link", "picked-pass", "flap-board"]) await expect(tid(page, id), id).toHaveCount(0);
    await expect(page.locator("#board")).toHaveCount(0);
    await expect(page.getByRole("combobox", { name: "여행지 검색" })).toHaveCount(0);
    await expect(page.getByText("내가 고른 여행지 · 오늘 환율")).toHaveCount(0);
    await expect(tid(page, "home-hero")).toBeVisible();
    const h = await (await page.request.get("/")).text();
    expect(h).not.toContain('data-testid="ticket"');
    expect(h).not.toContain('id="board"');
  });
});

test.describe("hero 입력창 · 칩 (작업 0380 · 새 문구)", () => {
  test("입력창 자리 글 · 버튼 · 칩 넷(도쿄 · 방콕 · 다낭 · 파리)", async ({ page }) => {
    await page.goto("/");
    await expect(heroSearch(page)).toHaveAttribute("placeholder", "어디로 가세요? 도시 · 나라");
    await expect(heroSearch(page)).toHaveAttribute("aria-label", "어디로 가세요? 도시 · 나라");
    await expect(tid(page, "hero-go")).toHaveText("보기");
    await expect(tid(page, "hero-chip")).toHaveCount(4);
    const names = await tid(page, "hero-chip").allInnerTexts();
    expect(names.map((n) => n.replace(/[^가-힣]/g, ""))).toEqual(["도쿄", "방콕", "다낭", "파리"]);
  });

  for (const [city, country] of [["방콕", "THA"], ["다낭", "VNM"], ["도쿄", "JPN"]] as const) {
    test(`hero 칩 '${city}' 을 누르면 고른 여행지로 저장되고 그 칩이 눌린 표시(aria-pressed)`, async ({ page }) => {
      await page.goto("/");
      const chip = tid(page, "hero-chip").filter({ hasText: city });
      await chip.click();
      await expect(chip).toHaveAttribute("aria-pressed", "true");
      expect(await picked(page)).toMatchObject({ country, city });
    });
  }

  test("hero 입력창에서 나라를 고르면(베트남) 고른 여행지로 저장됨", async ({ page }) => {
    await page.goto("/");
    await typeHero(page, "베트남"); // 작업 0394: 하이드레이션 전 입력이 사라지지 않게
    await page.getByRole("option").first().click();
    expect(await picked(page)).toMatchObject({ country: "VNM" });
  });

  test("고른 칩은 새로고침해도 유지 (같은 저장 상태)", async ({ page }) => {
    await page.goto("/");
    await tid(page, "hero-chip").filter({ hasText: "방콕" }).click();
    await page.reload();
    await expect(tid(page, "hero-chip").filter({ hasText: "방콕" })).toHaveAttribute("aria-pressed", "true");
    expect(await picked(page)).toMatchObject({ city: "방콕" });
  });

  test("입력창 · 보기 버튼 · 칩이 장식(탑승권 · 빛)에 가려지지 않음 — 누르는 자리의 맨 위 요소가 자기 자신 (휴대폰 폭 포함)", async ({ page }) => {
    test.skip(test.info().project.name === "휴대폰", "뷰포트를 직접 정하므로 넓은 화면 프로젝트에서만");
    for (const [w, h] of [[360, 780], [390, 844], [412, 915], [600, 900], [820, 1100], [1000, 800], [1440, 900]] as const) {
      await page.setViewportSize({ width: w, height: h });
      await page.goto("/");
      await page.waitForTimeout(500);
      const covered = await page.evaluate(() =>
        [...document.querySelectorAll('[data-testid="hero-search"], [data-testid="hero-go"], [data-testid="hero-chip"]')]
          .map((el) => {
            const r = el.getBoundingClientRect();
            const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            return top && (top === el || el.contains(top)) ? null : `${el.getAttribute("data-testid")} ${el.textContent?.trim().slice(-3) ?? ""} ← ${top?.className ?? "없음"}`;
          })
          .filter(Boolean),
      );
      expect(covered, `${w}px 에서 가려진 것`).toEqual([]);
    }
  });
});

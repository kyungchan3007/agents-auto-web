// 작업 0380 — hero 새 문구 · 입력창 · 칩 e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상) · 0347 의 옛 안내 줄(hero-guide · hero-free) 검사는 새 문구로 바꿈
//   builder 가 다는 표시(data-testid) — 홈 hero(home-hero) 안: hero-lede(한 줄 "항공료가 … 가장 낮은 달입니다.") · hero-tag(꼬리표 "통계청 국제항공료 지수") · hero-sub(입력창 아래 작은 줄)
//     hero-search(입력창 · role combobox · 자리 글 "어디로 가세요? 도시 · 나라") · hero-go(버튼 "보기") · hero-chip(칩 넷 · 글 도쿄 방콕 다낭 파리 · 국기 이모지 허용)
//   아래 탑승권 카드(ticket · flap-board · trip-switcher · 카드 검색 칸 "여행지 검색" · picked-country-link)는 그대로 · hero 에서 고르면 같은 상태라 카드도 같은 나라로 바뀜(lead 결정)
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

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const search = (page: Page) => page.getByRole("combobox", { name: "여행지 검색" }); // 아래 탑승권 카드의 검색 칸(그대로)
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

test.describe("카드 검색 칸 (작업 0347 · 시안 9-C)", () => {
  test("자리표시 글", async ({ page }) => {
    await page.goto("/");
    await expect(search(page)).toHaveAttribute("placeholder", "어디로 가세요? 도시 · 나라 (예: 도쿄, 베트남)");
  });

  test("노란 테두리 — 큰 제목의 월(노랑)과 같은 색", async ({ page }) => {
    await page.goto("/");
    const [border, sun] = await Promise.all([
      search(page).evaluate((el) => getComputedStyle(el).borderTopColor),
      tid(page, "hero-month").evaluate((el) => getComputedStyle(el).color),
    ]);
    expect(border).toBe(sun);
    expect(await search(page).evaluate((el) => parseFloat(getComputedStyle(el).borderTopWidth)), "강조라 테두리가 눈에 띄는 굵기").toBeGreaterThanOrEqual(2);
  });

  test("칩 줄과 검색 칸이 90일 신호 줄 · 안내판 아래가 아니라 위 — 칩 → 검색 칸 → 신호 줄 차례", async ({ page }) => {
    await page.goto("/");
    const sw = await box(tid(page, "trip-switcher"), "여행지 고르기");
    const evidence = await box(tid(page, "ticket-evidence"), "90일 신호 줄");
    const board = await box(tid(page, "ticket").getByTestId("flap-board"), "안내판");
    const firstChip = await box(tid(page, "trip-switcher").getByTestId("pick-chip"), "첫 칩");
    const lastChip = await box(tid(page, "trip-switcher").getByTestId("pick-chip").last(), "마지막 칩");
    const input = await box(search(page), "검색 칸");
    expect(sw.y, "고르기 영역이 안내판 아래").toBeGreaterThanOrEqual(board.y + board.height - 1);
    expect(sw.y + sw.height, "고르기 영역이 신호 줄 위").toBeLessThanOrEqual(evidence.y + 1);
    expect(firstChip.y, "칩이 검색 칸 위").toBeLessThan(input.y);
    expect(lastChip.y + lastChip.height, "칩 줄이 검색 칸 위").toBeLessThanOrEqual(input.y + 1);
    expect(input.y + input.height, "검색 칸이 신호 줄 위").toBeLessThanOrEqual(evidence.y + 1);
  });
});

test.describe("나라 고르기 → 카드 여행지 · 나라 페이지 링크 (작업 0347)", () => {
  const choose = async (page: Page, query: string) => {
    await search(page).fill(query);
    await page.getByRole("option").first().click();
  };

  test("처음에는 나라 페이지 링크가 없음", async ({ page }) => {
    await page.goto("/");
    await expect(tid(page, "picked-country-link")).toHaveCount(0);
  });

  test("나라를 고르면 카드 여행지가 바뀌고 그 나라 페이지(/prices/VNM) 링크가 나옴", async ({ page }) => {
    await page.goto("/");
    const board = tid(page, "ticket").getByTestId("flap-board");
    const before = await board.getAttribute("aria-label");
    await choose(page, "베트남");
    await expect(board, "카드 여행지가 바뀜").not.toHaveAttribute("aria-label", before ?? "");
    await expect(board).toHaveAttribute("aria-label", /내가 고른 여행지는/);
    const link = tid(page, "picked-country-link");
    await expect(link).toHaveAttribute("href", "/prices/VNM");
    await expect(link).toContainText("베트남");
    await link.click();
    await expect(page).toHaveURL(/\/prices\/VNM\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("물가");
  });

  test("나라 페이지가 없는 나라는 링크를 내지 않음 (물가 자료 없는 대만 — 페이지가 있으면 그 주소로)", async ({ page }) => {
    const exists = (await page.request.get("/prices/TWN")).status() === 200;
    await page.goto("/");
    await choose(page, "대만");
    await expect(tid(page, "ticket").getByTestId("flap-board")).toHaveAttribute("aria-label", /내가 고른 여행지는/);
    if (exists) await expect(tid(page, "picked-country-link")).toHaveAttribute("href", "/prices/TWN");
    else await expect(tid(page, "picked-country-link")).toHaveCount(0);
  });
});

test.describe("hero 입력창 · 칩 (작업 0380 · 새 문구) — 아래 카드와 같은 고르기 상태", () => {
  test("입력창 자리 글 · 버튼 · 칩 넷(도쿄 · 방콕 · 다낭 · 파리)", async ({ page }) => {
    await page.goto("/");
    await expect(heroSearch(page)).toHaveAttribute("placeholder", "어디로 가세요? 도시 · 나라");
    await expect(tid(page, "hero-go")).toHaveText("보기");
    await expect(tid(page, "hero-chip")).toHaveCount(4);
    const names = await tid(page, "hero-chip").allInnerTexts();
    expect(names.map((n) => n.replace(/[^가-힣]/g, ""))).toEqual(["도쿄", "방콕", "다낭", "파리"]);
  });

  test("아래 카드 검색 칸은 그대로 — 자리 글 · 칩 줄(trip-switcher)이 카드 안에 있음", async ({ page }) => {
    await page.goto("/");
    await expect(search(page)).toHaveAttribute("placeholder", "어디로 가세요? 도시 · 나라 (예: 도쿄, 베트남)");
    await expect(tid(page, "ticket").getByTestId("trip-switcher")).toBeVisible();
  });

  for (const city of ["방콕", "다낭", "도쿄"]) {
    test(`hero 칩 '${city}' 을 누르면 아래 카드 안내판이 같은 도시로 바뀜`, async ({ page }) => {
      await page.goto("/");
      const board = tid(page, "ticket").getByTestId("flap-board");
      const before = await board.getAttribute("aria-label");
      await tid(page, "hero-chip").filter({ hasText: city }).click();
      await expect(board).toHaveAttribute("aria-label", new RegExp(`내가 고른 여행지는 .*${city}`));
      if (before && new RegExp(`내가 고른 여행지는 .*${city}`).test(before)) return; // 이미 같은 도시였다면 바뀔 것이 없음
      await expect(board).not.toHaveAttribute("aria-label", before ?? "");
    });
  }

  test("hero 입력창에서 나라를 고르면(베트남) 아래 카드가 바뀌고 나라 페이지 링크가 나옴", async ({ page }) => {
    await page.goto("/");
    await heroSearch(page).fill("베트남");
    await page.getByRole("option").first().click();
    await expect(tid(page, "ticket").getByTestId("flap-board")).toHaveAttribute("aria-label", /내가 고른 여행지는/);
    await expect(tid(page, "picked-country-link")).toHaveAttribute("href", "/prices/VNM");
  });

  test("아래 카드에서 고른 칩과 hero 가 어긋나지 않음 — 카드에서 고르면 새로고침해도 유지(같은 저장 상태)", async ({ page }) => {
    await page.goto("/");
    await tid(page, "trip-switcher").getByTestId("pick-chip").filter({ hasText: "방콕" }).first().click();
    await expect(tid(page, "ticket").getByTestId("flap-board")).toHaveAttribute("aria-label", /내가 고른 여행지는 .*방콕/);
    await page.reload();
    await expect(tid(page, "ticket").getByTestId("flap-board")).toHaveAttribute("aria-label", /내가 고른 여행지는 .*방콕/);
  });
});

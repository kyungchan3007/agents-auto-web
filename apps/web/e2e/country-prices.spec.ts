// 작업 0344 — 나라별 여행 물가 페이지 /prices/[code] e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   원문: 서버 첫 그림(정적 HTML)에 최종 문장이 들어가야 함 — 검색 · AI 가 읽음 → 자바스크립트 없이 받은 HTML 로 먼저 검사(page.request)
//   값은 날마다 달라서 문장 모양 · 연결 · 있고 없음만 봄 (물가 자료는 빌드 때 받은 것)
//   builder 가 다는 표시(data-testid) — 모두 나라 페이지 안
//     country-crumb     제목 위 경로 "여행 물가 › 일본" · 안에 "여행 물가" 링크(/prices)
//     country-oneline   오늘 기준 한 줄 답 상자 (글 "오늘 기준 한 줄 답" 으로 시작) — 통화가 없는 나라는 상자 자체가 없음
//     next-card         "다음으로 볼 것" 카드 정확히 3장 (환전 · 항공권 · 예산) · 카드마다 링크 하나: 환전 → /currencies/<통화> · 예산 → #budget
//     compare-link      "○○과 견줘 볼 나라" 링크 네 곳 → /prices/XXX (자기 나라 아님)
//     faq-item          <details> 문항 · 처음 두 개는 open 속성 · JSON-LD FAQPage 와 같은 문항
//     route-card-link   /prices 노선 카드의 나라 이름 링크 → /prices/XXX
//     price-band-link   /prices 목록 칩(나라 줄)의 링크 → /prices/XXX
//   메타: <title> 에 나라 이름 · 길이 있는 description · canonical https://…/prices/XXX · FAQPage + BreadcrumbList JSON-LD
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const html = async (page: Page, path: string) => {
  const r = await page.request.get(path);
  expect(r.status(), `${path} 가 정적 페이지로 있어야 함 (generateStaticParams)`).toBe(200);
  return r.text();
};
const ldTypes = (h: string) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]) as { "@type": string; mainEntity?: { name: string }[] });

test.describe("나라 페이지 정적 HTML — 서버 첫 그림 (작업 0344)", () => {
  test("/prices/JPN — 제목 문장 · 한 줄 답 · 메타 · FAQPage 가 자바스크립트 없이 들어 있음", async ({ page }) => {
    const h = await html(page, "/prices/JPN");
    expect(h).toMatch(/<h1[^>]*>[\s\S]*?일본은 한국보다 물가가 \d+% (높습니다|낮습니다)|<h1[^>]*>[\s\S]*?일본은 한국과 물가가 비슷합니다/);
    expect(h).toContain("오늘 기준 한 줄 답");
    expect(h).toMatch(/오늘 100엔은 [\d,.]+원/);
    expect(h).toMatch(/<title>[^<]*일본[^<]*<\/title>/);
    expect(h).toMatch(/<meta name="description" content="[^"]{20,}"/);
    expect(h).toMatch(/<link rel="canonical" href="https?:\/\/[^"]+\/prices\/JPN\/?"/);
    const ld = ldTypes(h);
    const faq = ld.find((d) => d["@type"] === "FAQPage");
    expect(faq, "FAQPage 구조화 자료").toBeTruthy();
    expect(faq!.mainEntity!.length).toBeGreaterThanOrEqual(2);
    expect(ld.some((d) => d["@type"] === "BreadcrumbList")).toBe(true);
    // 화면의 문항과 구조화 자료의 문항이 같음
    for (const q of faq!.mainEntity!) expect(h).toContain(q.name.replace(/&/g, "&amp;"));
  });

  test("/prices/MAC — 마카오(통화 없음): 제목 문장은 있고 한 줄 답 상자 · 환전 문항은 없음", async ({ page }) => {
    const h = await html(page, "/prices/MAC");
    expect(h).toMatch(/마카오(는|은) 한국/);
    expect(h).not.toContain('data-testid="country-oneline"');
    expect(h).not.toContain("오늘 기준 한 줄 답");
    const faq = ldTypes(h).find((d) => d["@type"] === "FAQPage");
    expect(faq?.mainEntity?.some((q) => q.name.includes("환전"))).toBeFalsy();
  });

  test("물가 자료가 없는 나라(표에 없는 코드)는 페이지가 없음 (지어내지 않음)", async ({ page }) => {
    expect((await page.request.get("/prices/XXX")).status()).toBe(404);
    // 소문자(/prices/jpn)는 여기서 보지 않음: 맥 파일 시스템은 대소문자를 구분하지 않아 정적 서버가 JPN.html 을 내줌 (Cloudflare Pages 에서는 404)
  });

  test("sitemap 에 /prices/JPN 이 들어감", async ({ page }) => {
    expect(await html(page, "/sitemap.xml")).toMatch(/<loc>https?:\/\/[^<]+\/prices\/JPN<\/loc>/);
  });
});

test.describe("나라 페이지 화면 (작업 0344 · 시안 1-new · 2-new · 6-new)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/prices/JPN");
  });

  test("제목 위 경로 · 오른쪽 예산 카드는 그 나라로 미리 골라 둠", async ({ page }) => {
    await expect(tid(page, "country-crumb")).toContainText("여행 물가");
    await expect(tid(page, "country-crumb")).toContainText("일본");
    await expect(tid(page, "country-crumb").getByRole("link", { name: "여행 물가" })).toHaveAttribute("href", "/prices");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/일본은 한국(보다 물가가 \d+% (높습니다|낮습니다)|과 물가가 비슷합니다)/);
    await expect(tid(page, "budget").getByLabel("나라")).toHaveValue("JPN");
  });

  test("한 줄 답 상자 — 날짜 · 오늘 값 · 1년 평균 대비", async ({ page }) => {
    const box = tid(page, "country-oneline");
    await expect(box).toContainText(/오늘 기준 한 줄 답 · \d{4}-\d{2}-\d{2}/);
    await expect(box).toContainText(/오늘 100엔은 [\d,.]+원/);
  });

  test("다음으로 볼 것 — 카드 정확히 세 장 · 환전은 통화 상세로 · 예산은 예산 카드로", async ({ page }) => {
    const cards = tid(page, "next-card");
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0).getByRole("link")).toHaveAttribute("href", "/currencies/JPY");
    await expect(cards.nth(1)).toContainText("항공권");
    await expect(cards.nth(2).getByRole("link")).toHaveAttribute("href", /#budget$/);
    await expect(cards.nth(2)).toContainText("예산");
  });

  test("항공권 카드 — 가격이면 '원부터' + 받은 날 · 달력 도시가 없으면 '떠나기 싼 달' · 둘 다 없으면 '자료 없음' (가격을 지어내지 않음)", async ({ page }) => {
    const air = tid(page, "next-card").nth(1);
    await expect(air).toContainText(/[\d,]+원부터|떠나기 싼 달|자료 없음/);
    const t = (await air.innerText()).replace(/\s+/g, " ");
    if (/원부터/.test(t)) expect(t).toMatch(/\d+월 \d+일 출발 1주 왕복 · \d+월 \d+일 받은 가격/);
    if (/떠나기 싼 달/.test(t)) expect(t).not.toMatch(/원부터/);
  });

  test("견줘 볼 나라 — 네 곳 · 다른 나라 페이지로 이어짐 · 자기 나라 아님 · 다시 계산한 %", async ({ page }) => {
    const links = tid(page, "compare-link");
    await expect(links).toHaveCount(4);
    const hrefs = await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    for (const h of hrefs) expect(h).toMatch(/^\/prices\/[A-Z]{3}$/);
    expect(hrefs).not.toContain("/prices/JPN");
    expect(new Set(hrefs).size).toBe(4);
    for (const t of await links.allInnerTexts()) expect(t).toMatch(/일본(보다 \d+% (쌈|비쌈)|과 거의 같음)/);
  });

  test("견줘 볼 나라를 누르면 그 나라 페이지", async ({ page }) => {
    const first = tid(page, "compare-link").first();
    const href = await first.getAttribute("href");
    await first.click();
    await expect(page).toHaveURL(new RegExp(`${href}/?$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText("물가");
  });

  test("자주 묻는 질문 — 처음 두 개만 펼침", async ({ page }) => {
    const items = tid(page, "faq-item");
    expect(await items.count()).toBeGreaterThanOrEqual(2);
    await expect(page.locator('[data-testid="faq-item"][open]')).toHaveCount(2);
    await expect(items.nth(0)).toHaveAttribute("open", "");
    await expect(items.nth(1)).toHaveAttribute("open", "");
  });

  test("가로 넘침 없음", async ({ page }) => {
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});

test.describe("/prices 에서 나라 페이지로 (작업 0344 · /prices 는 그대로)", () => {
  test("/prices 는 그대로 — 큰 제목 문장은 지금과 같음", async ({ page }) => {
    await page.goto("/prices");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/한국보다 물가가 \d+% 낮습니다/);
  });

  test("노선 카드의 나라 이름 · 목록 칩이 /prices/XXX 로 이어짐", async ({ page }) => {
    await page.goto("/prices");
    await expect(tid(page, "route-card-link").first()).toHaveAttribute("href", /^\/prices\/[A-Z]{3}$/);
    const chip = tid(page, "price-band-link").first();
    await expect(chip).toHaveAttribute("href", /^\/prices\/[A-Z]{3}$/);
    const href = await chip.getAttribute("href");
    await chip.click();
    await expect(page).toHaveURL(new RegExp(`${href}/?$`));
    await expect(page.getByRole("heading", { level: 1 })).toContainText("물가");
  });
});

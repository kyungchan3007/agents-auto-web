// 작업 0345 — 통화 상세 한 줄 답 · 자주 묻는 질문 e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   원문: 서버 첫 그림(정적 HTML)에 문장이 들어가야 함 — 자바스크립트 없이 받은 HTML(page.request)로 먼저 검사 · 값은 날마다 달라서 문장 모양 · 연결만 봄
//   builder 가 다는 표시(data-testid) — /currencies/JPY 안
//     currency-answer   한 줄 답 상자(90일 신호 꼬리표 아래 · 1년 최저 카드 위) · 안에 "한 줄 답 · YYYY-MM-DD 기준" 과 문장
//     currency-faq      "엔화, 자주 묻는 질문" 구간(h2) · 맨 아래 출처 줄 위
//       faq-item        <details> 문항 네 개 · 처음 두 개는 open 속성
//       faq-link        질문 셋(물가)의 /prices/XXX 링크
//   메타: JSON-LD FAQPage 문항 네 개 (작업 0344 의 faqLd)
import { type Page, expect, test } from "@playwright/test";
import { hydrated } from "./helpers";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const html = async (page: Page, path: string) => {
  const r = await page.request.get(path);
  expect(r.status(), `${path} 가 정적 페이지로 있어야 함`).toBe(200);
  return r.text();
};
const ld = (h: string) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]) as { "@type": string; mainEntity?: { name: string; acceptedAnswer: { text: string } }[] });

test.describe("통화 상세 정적 HTML — 서버 첫 그림 (작업 0345)", () => {
  test("/currencies/JPY — 한 줄 답 · 질문 넷 · FAQPage 가 자바스크립트 없이 들어 있음", async ({ page }) => {
    const h = await html(page, "/currencies/JPY");
    expect(h).toMatch(/한 줄 답 · \d{4}-\d{2}-\d{2} 기준/);
    expect(h).toMatch(/100엔은 [\d,.]+원으로, 1년 평균\([\d,.]+원\)(보다 \d+% (낮고|높고)|과 거의 같고) 1년 최저\([\d,.]+원\)(와 [\d.]+% 차이입니다|와 같은 값입니다)\./);
    const faq = ld(h).find((d) => d["@type"] === "FAQPage");
    expect(faq, "FAQPage 구조화 자료").toBeTruthy();
    expect(faq!.mainEntity!.map((q) => q.name)).toEqual(["엔화 지금 싼 편인가요?", "10만 엔은 원화로 얼마인가요?", "일본 물가는 한국보다 비싼가요?", "오늘 환율은 언제 바뀌나요?"]);
    // 화면의 문항 글이 구조화 자료와 같음
    for (const q of faq!.mainEntity!) expect(h).toContain(q.name);
    expect(h).toContain("수수료");
    expect(h).toContain("12:10");
  });

  test("USD · EUR 도 같은 모양 — 큰 금액 · 쓰는 나라(미국 · 프랑스) 질문", async ({ page }) => {
    const usd = ld(await html(page, "/currencies/USD")).find((d) => d["@type"] === "FAQPage");
    expect(usd!.mainEntity!.map((q) => q.name)).toEqual(["달러 지금 싼 편인가요?", "1,000달러는 원화로 얼마인가요?", "미국 물가는 한국보다 비싼가요?", "오늘 환율은 언제 바뀌나요?"]);
    const eur = ld(await html(page, "/currencies/EUR")).find((d) => d["@type"] === "FAQPage");
    expect(eur!.mainEntity![2].name).toBe("프랑스 물가는 한국보다 비싼가요?");
  });
});

test.describe("통화 상세 화면 (작업 0345 · 시안 5-new · 6-new)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/currencies/JPY");
    // 작업 0354: 하이드레이션이 끝나기 전에 질문(summary)을 누르면 열림 · 닫힘이 되돌려져(open 속성이 다시 붙음) CI 에서 흔들렸음 — 하이드레이션이 끝난 뒤에 상호작용
    await page.waitForLoadState("networkidle");
    await hydrated(tid(page, "faq-item"));
  });

  test("한 줄 답 — 날짜 라벨 · 문장 · 1년 최저 카드보다 위", async ({ page }) => {
    const box = tid(page, "currency-answer");
    await expect(box).toContainText(/한 줄 답 · \d{4}-\d{2}-\d{2} 기준/);
    await expect(box).toContainText(/100엔은 [\d,.]+원으로/);
    const [a, low] = await Promise.all([box.boundingBox(), page.getByText("1년 최저").first().boundingBox()]);
    expect(a!.y, "한 줄 답이 1년 최저 카드 위").toBeLessThan(low!.y);
  });

  test("자주 묻는 질문 — 네 문항 · 처음 두 개만 펼침 · 맨 아래 출처 줄 위", async ({ page }) => {
    const faq = tid(page, "currency-faq");
    await expect(faq.getByRole("heading", { level: 2 })).toContainText("자주 묻는 질문");
    await expect(faq.locator('[data-testid="faq-item"]')).toHaveCount(4);
    await expect(faq.locator('[data-testid="faq-item"][open]')).toHaveCount(2);
    await expect(faq.locator('[data-testid="faq-item"]').nth(0)).toHaveAttribute("open", "");
    await expect(faq.locator('[data-testid="faq-item"]').nth(1)).toHaveAttribute("open", "");
    const [f, src] = await Promise.all([faq.boundingBox(), page.getByText(/환율: 한국수출입은행/).first().boundingBox()]);
    expect(f!.y, "질문 구간이 출처 줄 위").toBeLessThan(src!.y);
  });

  test("물가 질문 — 펼치면 그 나라 페이지(/prices/JPN) 링크 · 누르면 나라 페이지로", async ({ page }) => {
    const item = tid(page, "faq-item").nth(2);
    await item.locator("summary").click();
    const link = item.locator('[data-testid="faq-link"]');
    await expect(link).toHaveAttribute("href", "/prices/JPN");
    await link.click();
    await expect(page).toHaveURL(/\/prices\/JPN\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("물가");
  });

  test("질문을 눌러 접고 펼침 · 가로 넘침 없음", async ({ page }) => {
    const first = tid(page, "faq-item").nth(0);
    await first.locator("summary").click();
    await expect(first).not.toHaveAttribute("open", "");
    await first.locator("summary").click();
    await expect(first).toHaveAttribute("open", "");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
});

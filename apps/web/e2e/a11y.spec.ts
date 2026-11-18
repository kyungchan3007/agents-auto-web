// 작업 0213 (#252) — 접근성 · 기본기: 제목 구조 · 본문 바로가기 · 버튼 눌림 · 가로 넘침 방지 · 경고 아이콘
import { type Page, expect, test } from "@playwright/test";

const PAGES = ["/", "/currencies/USD", "/prices", "/flights", "/calc", "/log", "/about", "/geo"];

async function headings(page: Page) {
  return page.evaluate(() => {
    const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => ({ level: Number(h.tagName[1]), text: (h.textContent ?? "").trim().slice(0, 24) }));
    const labelled = [...document.querySelectorAll("[aria-labelledby]")].map((s) => {
      const t = document.getElementById(s.getAttribute("aria-labelledby") ?? "");
      return { id: s.getAttribute("aria-labelledby"), tag: t?.tagName ?? null };
    });
    return { hs, labelled };
  });
}

test.describe("제목 구조 (작업 0213)", () => {
  for (const path of PAGES) {
    test(`${path} — h1 하나 · 섹션 제목은 h2 · 단계를 건너뛰지 않음 · 제목 칸은 모두 제목 태그`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(300);
      const { hs, labelled } = await headings(page);
      expect(hs.filter((h) => h.level === 1), "h1 개수").toHaveLength(1);
      expect(hs.filter((h) => h.level === 2).length, "섹션 제목(h2)").toBeGreaterThan(0);
      let prev = 0;
      for (const h of hs) {
        expect(h.level - prev, `"${h.text}" 앞 단계에서 건너뜀`).toBeLessThanOrEqual(1);
        prev = h.level;
      }
      for (const l of labelled) expect(l.tag, `aria-labelledby=${l.id}`).toMatch(/^H[1-6]$/);
    });
  }
});

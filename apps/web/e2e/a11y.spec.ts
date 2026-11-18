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

test.describe("본문 바로가기 (작업 0213)", () => {
  for (const path of [...PAGES, "/nonexistent-page-0213"]) {
    test(`${path} — 평소엔 숨김 · 첫 Tab 에서 보임 · Enter 로 main 에 초점`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(300);
      const skip = page.getByRole("link", { name: "본문 바로가기" });
      const hidden = await skip.boundingBox();
      expect((hidden?.width ?? 0) <= 1 && (hidden?.height ?? 0) <= 1, "평소 숨김").toBe(true);
      await page.keyboard.press("Tab");
      await expect(skip).toBeFocused();
      const shown = await skip.boundingBox();
      expect((shown?.width ?? 0) > 40 && (shown?.height ?? 0) > 20, "초점에서 보임").toBe(true);
      await page.keyboard.press("Enter");
      const active = await page.evaluate(() => ({ tag: document.activeElement?.tagName, id: document.activeElement?.id }));
      expect(active).toEqual({ tag: "MAIN", id: "main" });
      expect(await page.locator("main").count(), "main 은 하나").toBe(1);
    });
  }
});

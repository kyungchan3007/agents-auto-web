// 작업 0210 (#249) → 작업 0217 — 홈 첫 화면 검사 (새 디자인: 큰 제목 · 탑승권 카드 · 12달 막대 라벨 대비) · 옛 사진 머리 · 선 그래프 · 휴대폰 간격 검사는 새 홈에 없는 모양이라 뺌
import { type Locator, type Page, expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";

test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
});

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const box = async (loc: Locator) => {
  const b = await loc.boundingBox();
  if (!b) throw new Error("화면에 없음");
  return b;
};

/** 글자를 투명하게 하고 그 자리 배경 픽셀을 읽어, 글자색과의 대비 중 가장 나쁜 쪽(하위 1%)을 구함 */
async function worstContrast(page: Page, loc: Locator): Promise<number> {
  const b = await box(loc);
  const color = await loc.evaluate((el) => getComputedStyle(el).color);
  await loc.evaluate((el) => ((el as HTMLElement).style.color = "transparent"));
  const buf = await page.screenshot({ clip: b });
  return page.evaluate(
    async ({ b64, color }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      if (!g) return 0;
      g.drawImage(img, 0, 0);
      const lum = (r: number, gg: number, bb: number) => {
        const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(bb);
      };
      const m = color.match(/\d+(\.\d+)?/g)?.map(Number) ?? [0, 0, 0];
      const L = lum(m[0], m[1], m[2]);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const cr: number[] = [];
      for (let i = 0; i < d.length; i += 4) {
        const l = lum(d[i], d[i + 1], d[i + 2]);
        cr.push((Math.max(l, L) + 0.05) / (Math.min(l, L) + 0.05));
      }
      cr.sort((a, b) => a - b);
      return cr[Math.floor(cr.length * 0.01)];
    },
    { b64: buf.toString("base64"), color },
  );
}

test.describe("홈 첫 화면 디자인 (작업 0210 → 0217 새 디자인)", () => {
  test("1280×800 첫 화면 안에 큰 제목이 들어옴", async ({ page }) => {
    test.skip(isPhone(page), "넓은 화면 전용");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForTimeout(400);
    const h1 = await box(page.getByRole("heading", { level: 1 }));
    expect(h1.y + h1.height, "큰 제목 아래 끝").toBeLessThanOrEqual(800);
  });

  test("12달 막대 각주 · '가장 저렴한 달 / 가장 비싼 달' 라벨 글자 대비 4.5:1 이상 (작업 0276)", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    const note = page.getByText("지수는 값이 클수록 항공료가 비싸다는 뜻", { exact: false }).first();
    await note.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -200));
    expect(await worstContrast(page, note), "각주").toBeGreaterThanOrEqual(4.5);
    // 그래프 2D(시안 F): 말풍선은 SVG(빨강 · 노랑 바탕 + 글) — 픽셀 대신 글 색 · 바탕 색의 WCAG 대비로 잼
    const ratios = await page.locator("[data-testid=year-bars] [data-testid=year-tag]").evaluateAll((tags) => {
      const rgb = (c: string) => (c.match(/\d+(\.\d+)?/g) ?? ["0", "0", "0"]).slice(0, 3).map(Number);
      const lum = ([r, g, b]: number[]) => {
        const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      return tags.map((t) => {
        const text = t.querySelector("text") as SVGTextElement;
        const rect = t.querySelector("rect") as SVGRectElement;
        const a = lum(rgb(getComputedStyle(text).fill));
        const b = lum(rgb(getComputedStyle(rect).fill));
        return { kind: t.getAttribute("data-kind"), ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
      });
    });
    expect(ratios.length, "말풍선 둘").toBe(2);
    for (const r of ratios) expect(r.ratio, `${r.kind} 말풍선 글자 대비`).toBeGreaterThanOrEqual(4.5);
  });
});

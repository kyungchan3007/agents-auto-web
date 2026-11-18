// 작업 0210 (#249) — 홈 첫 화면 디자인 검사 지적: 1280×800 첫 화면에 "내 여행지 고르기" · 안내판 제목은 머리에 딸린 라벨 · 휴대폰 구간 간격 · 각주 · 그래프 라벨 대비
import { type Locator, type Page, expect, test } from "@playwright/test";

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

test.describe("홈 첫 화면 디자인 (작업 0210)", () => {
  test("1280×800 첫 화면 안에 '내 여행지 고르기' 와 안내판이 들어옴", async ({ page }) => {
    test.skip(isPhone(page), "넓은 화면 전용");
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForTimeout(400);
    const btn = await box(page.getByTestId("pick-trip-open").first());
    expect(btn.y + btn.height, "버튼 아래 끝").toBeLessThanOrEqual(800);
    const board = await box(page.getByTestId("flap-board").first());
    expect(board.y + board.height, "안내판 아래 끝").toBeLessThanOrEqual(800);
  });

  test("'이번 주 가장 싸게 갈 수 있는 곳' 은 머리의 작은 제목(여행 타이밍)과 같은 라벨 모양 · 제목(h2) 시맨틱은 그대로", async ({ page }) => {
    await page.goto("/");
    const label = page.locator("#today-title");
    expect(await label.evaluate((el) => el.tagName)).toBe("H2");
    const eyebrow = page.locator("section[aria-labelledby='timing-title'] p").first();
    const style = (l: Locator) => l.evaluate((el) => { const s = getComputedStyle(el); return [s.fontSize, s.fontWeight, s.color, s.letterSpacing]; });
    expect(await style(label)).toEqual(await style(eyebrow));
  });

  test("휴대폰 — 머리 → 안내판 · 안내판 → 버튼 · 버튼 → 그래프 간격이 같음 (±2px)", async ({ page }) => {
    test.skip(!isPhone(page), "휴대폰 전용");
    await page.goto("/");
    await page.waitForTimeout(400);
    const head = await box(page.getByTestId("photo-header").first());
    const title = await box(page.locator("#today-title"));
    const evidence = await box(page.locator("#today p").first());
    const btn = await box(page.getByTestId("pick-trip-open").first());
    const graph = await box(page.getByTestId("travel-graph"));
    const a = title.y - (head.y + head.height);
    const b = btn.y - (evidence.y + evidence.height);
    const c = graph.y - (btn.y + btn.height);
    expect(Math.abs(a - b), `머리→안내판 ${a} · 안내판→버튼 ${b}`).toBeLessThanOrEqual(2);
    expect(Math.abs(c - b), `버튼→그래프 ${c} · 안내판→버튼 ${b}`).toBeLessThanOrEqual(2);
  });

  test("그래프 각주 · '가장 쌈 / 가장 비쌈' 라벨 글자 대비 4.5:1 이상", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    const note = page.getByText("지수는 값이 클수록 항공료가 비싸다는 뜻", { exact: false }).first();
    await note.scrollIntoViewIfNeeded();
    expect(await worstContrast(page, note), "각주").toBeGreaterThanOrEqual(4.5);
    if (!isPhone(page)) {
      for (const text of [/월 가장 쌈/, /월 가장 비쌈/]) {
        const label = page.locator("[data-testid=travel-graph]").getByText(text).first();
        await label.scrollIntoViewIfNeeded();
        expect(await worstContrast(page, label), String(text)).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
});

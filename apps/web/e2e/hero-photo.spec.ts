// 작업 0209 (#248) — 휴대폰 홈 머리 사진 덮개 · 노란 표시줄 폭 (안 고른 사람 사진 항목은 정정으로 뺌 — 사진은 고른 나라에만)
import { type Page, expect, test } from "@playwright/test";

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;

/** 글자를 숨기고 그 자리의 배경 픽셀을 읽어 글자색과의 대비(하위 1% 가장 나쁜 값)를 구함 */
async function worstContrast(page: Page, target: string): Promise<number> {
  const loc = page.locator(target).first();
  const box = await loc.boundingBox();
  if (!box) throw new Error("화면에 없음");
  const color = await loc.evaluate((el) => getComputedStyle(el).color);
  await loc.evaluate((el) => ((el as HTMLElement).style.color = "transparent"));
  const buf = await page.screenshot({ clip: box });
  return page.evaluate(async ({ b64, color }) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    if (!g) return 0;
    g.drawImage(img, 0, 0);
    const lum = (r: number, gg: number, b: number) => {
      const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(gg) + 0.0722 * f(b);
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
  }, { b64: buf.toString("base64"), color });
}

test.describe("홈 머리 사진 덮개 · 표시줄 (작업 0209)", () => {
  test("휴대폰 — 위쪽은 덮개 없이 사진이 보이고 · 글자(작은 제목 · 큰 제목 · 설명) 자리는 대비 4.5:1 이상", async ({ page }) => {
    test.skip(!isPhone(page), "휴대폰 전용");
    await page.goto("/");
    await page.waitForTimeout(500);
    const header = page.getByTestId("photo-header").first();
    const hb = await header.boundingBox();
    if (!hb) throw new Error("화면에 없음");
    const clip = { x: hb.x, y: hb.y, width: hb.width, height: hb.height * 0.2 };
    const withVeil = (await page.screenshot({ clip })).toString("base64");
    await page.getByTestId("photo-veil").first().evaluate((el) => ((el as HTMLElement).style.display = "none"));
    const noVeil = (await page.screenshot({ clip })).toString("base64");
    const diff = await page.evaluate(async ({ a, b }) => {
      const load = async (s: string) => {
        const i = new Image();
        i.src = `data:image/png;base64,${s}`;
        await i.decode();
        const c = document.createElement("canvas");
        c.width = i.width;
        c.height = i.height;
        const g = c.getContext("2d");
        g?.drawImage(i, 0, 0);
        return g?.getImageData(0, 0, c.width, c.height).data ?? new Uint8ClampedArray();
      };
      const [x, y] = [await load(a), await load(b)];
      let sum = 0;
      for (let k = 0; k < x.length; k += 4) sum += Math.abs(x[k] - y[k]) + Math.abs(x[k + 1] - y[k + 1]) + Math.abs(x[k + 2] - y[k + 2]);
      return sum / (x.length / 4) / 3;
    }, { a: withVeil, b: noVeil });
    expect(diff).toBeLessThan(10); // 위 20% 는 덮개가 거의 없음 (평균 채널 차이)
    await page.getByTestId("photo-veil").first().evaluate((el) => ((el as HTMLElement).style.display = ""));
    for (const target of ["section[aria-labelledby='timing-title'] p:nth-of-type(1)", "#timing-title", "section[aria-labelledby='timing-title'] p:nth-of-type(2)"]) {
      expect(await worstContrast(page, target), target).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("노란 표시줄 — 강조 글자의 왼쪽 · 오른쪽 끝과 ±2px", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
    const h1 = page.locator("#timing-title");
    // 강조 글자만 남기고 나머지 글자는 투명하게
    await h1.evaluate((el) => {
      for (const n of Array.from(el.childNodes)) {
        if (n.nodeType === 3) {
          const s = document.createElement("span");
          s.style.color = "transparent";
          s.textContent = n.textContent;
          n.replaceWith(s);
        }
      }
    });
    const em = h1.locator('[data-testid="emph"]').first();
    const r = await em.boundingBox();
    if (!r) throw new Error("화면에 없음");
    const pad = 30;
    const clipX = Math.max(0, r.x - pad);
    const buf = await page.screenshot({ clip: { x: clipX, y: r.y - 10, width: r.width + pad * 2, height: r.height + 20 } });
    const res = await page.evaluate(async ({ b64, scale }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      const g = c.getContext("2d");
      g?.drawImage(img, 0, 0);
      const d = g?.getImageData(0, 0, c.width, c.height).data ?? new Uint8ClampedArray();
      const bar = [1e9, -1];
      const ink = [1e9, -1];
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          const i = (y * c.width + x) * 4;
          const [R, G, B] = [d[i], d[i + 1], d[i + 2]];
          if (R > 220 && G > 170 && B < 120) (bar[0] = Math.min(bar[0], x)), (bar[1] = Math.max(bar[1], x));
          if (B > 120 && R < 80 && G < 90) (ink[0] = Math.min(ink[0], x)), (ink[1] = Math.max(ink[1], x));
        }
      }
      return { left: (bar[0] - ink[0]) / scale, right: (bar[1] - ink[1]) / scale };
    }, { b64: buf.toString("base64"), scale: await page.evaluate(() => devicePixelRatio) });
    expect(Math.abs(res.left)).toBeLessThanOrEqual(2);
    expect(Math.abs(res.right)).toBeLessThanOrEqual(2);
  });
});

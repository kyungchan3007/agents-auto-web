// 작업 0209 (#248) — 머리 사진 = 큰 문장 속 나라 (안 고른 상태 · 서버 HTML) · 휴대폰 홈 덮개 · 노란 표시줄 폭
import { type Page, expect, test } from "@playwright/test";

const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;

/** 서버가 만든 HTML(자바스크립트 실행 전)의 머리 사진 주소 */
async function serverHero(page: Page, path: string): Promise<string> {
  const html = await (await page.request.get(path)).text();
  const tag = html.match(/<img[^>]*data-testid="photo-header-img"[^>]*>/)?.[0] ?? "";
  return tag.match(/\ssrc="([^"]+)"/)?.[1] ?? "";
}

const CITY_PHOTO: Record<string, string> = { 도쿄: "country-jpn", 뉴욕: "country-usa", 파리: "country-eur", 방콕: "country-tha" };
const NAME_PHOTO: Record<string, string> = {
  일본: "country-jpn", 대만: "country-twn", 홍콩: "country-hkg", 중국: "country-chn", 태국: "country-tha", 베트남: "country-vnm", 캄보디아: "country-khm", 필리핀: "country-phl",
  싱가포르: "country-sgp", 인도: "country-ind", 영국: "country-gbr", 스위스: "country-che", 스웨덴: "country-swe", 튀르키예: "country-tur", 미국: "country-usa", 캐나다: "country-can",
  멕시코: "country-mex", 호주: "country-aus", 뉴질랜드: "country-nzl", 프랑스: "country-eur", 독일: "country-eur", 이탈리아: "country-eur", 스페인: "country-eur", 포르투갈: "country-eur",
  네덜란드: "country-eur", 오스트리아: "country-eur", 그리스: "country-eur", 핀란드: "country-eur",
};

test.describe("머리 사진 = 큰 문장 속 나라 (작업 0209)", () => {
  test("홈 — 안 고른 상태 서버 HTML 머리 사진은 안내판 도착지 나라 (안내판에 도착지가 없으면 지금 사진)", async ({ page }) => {
    const html = await (await page.request.get("/")).text();
    const label = html.match(/data-testid="flap-board"[^>]*aria-label="([^"]*)"/)?.[1] ?? "";
    const city = Object.keys(CITY_PHOTO).find((c) => label.includes(c));
    const src = await serverHero(page, "/");
    expect(src).toContain(city ? CITY_PHOTO[city] : "window-fjord");
    // 화면에서도 같은 사진 (고른 값이 없으면 마운트 뒤에도 그대로)
    await page.goto("/");
    await expect(page.getByTestId("photo-header-img").first()).toHaveAttribute("src", src);
  });

  test("여행 물가 — 안 고른 상태 서버 HTML 머리 사진은 큰 문장의 나라 (사진 없는 나라 · 문장 없으면 지금 사진)", async ({ page }) => {
    const html = await (await page.request.get("/prices")).text();
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "").replace(/<[^>]+>/g, "");
    const name = h1.match(/^(.+?)[은는] 한국보다 물가가 \d+% 낮습니다/)?.[1];
    const src = await serverHero(page, "/prices");
    expect(src).toContain(name && NAME_PHOTO[name] ? NAME_PHOTO[name] : "swiss-traveler");
  });
});

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
  test("휴대폰 — 위쪽은 덮개 없이 사진이 보이고 · 글자 자리는 대비 4.5:1 이상", async ({ page }) => {
    test.skip(!isPhone(page), "휴대폰 전용");
    await page.goto("/");
    await page.waitForTimeout(500);
    const header = page.getByTestId("photo-header").first();
    const hb = await header.boundingBox();
    if (!hb) throw new Error("화면에 없음");
    const clip = { x: hb.x, y: hb.y, width: hb.width, height: hb.height * 0.3 };
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
    expect(diff).toBeLessThan(10); // 위 30% 는 덮개가 거의 없음 (평균 채널 차이)
    await page.getByTestId("photo-veil").first().evaluate((el) => ((el as HTMLElement).style.display = ""));
    expect(await worstContrast(page, "section[aria-labelledby='timing-title'] p")).toBeGreaterThanOrEqual(4.5);
    expect(await worstContrast(page, "#timing-title")).toBeGreaterThanOrEqual(4.5);
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

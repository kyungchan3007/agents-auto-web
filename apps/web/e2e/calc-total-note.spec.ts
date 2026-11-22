// 작업 0296 — 직구: 합계를 못 구할 때의 큰 숫자 안내 · 휴대폰 요약 띠를 합계로 · 큰 제목에서 "한도 초과" 빼기 (사용자가 정한 조건: 시안 65 "추천안대로" · "한도초과라는 말은 없어도 되지 않아?" → "응")
//   ① 합계를 못 구할 때(한도 넘음 · 관세율 없음)만 결과 카드 머리 아래 안내 줄 "아래 금액은 물건 값입니다 · 관세율을 넣으면 합계로 바뀝니다" — 합계가 있을 때 · 한도 안에는 없음 · 줄은 h-14 칸 안
//   ② 휴대폰 요약 띠 세 상태: 합계 있음 "모두 합쳐 약 {합계}원" · 관세율 없음 "물건 값 {물건 값}원 · 관세율을 넣으면 합계" · 한도 안 "{물건 값}원 · 면세 한도 안"(그대로) · 높이 h-14(56px) 고정 · 글이 잘리지 않음 · 가로 넘침 없음
//   ③ 큰 제목: 한도 넘음 · 관세율 없음 → "관세율을 넣어 보세요"("한도 초과" 없음) ④ 상태를 바꿔도 아래 칸이 밀리지 않음 · 가로 넘침 0 (작업 0208)
//   두 프로젝트에서 돌며 폭은 테스트 안에서 정함(요약 띠는 휴대폰 폭(640 미만)에서만 보임)
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const slot = (page: Page, s: string) => page.locator(`[data-testid="calc-result"] [data-testid="rolling-number"][data-slot="${s}"]`);
const NOTE = "아래 금액은 물건 값입니다 · 관세율을 넣으면 합계로 바뀝니다";
const en = (n: number) => n.toLocaleString("en-US");

async function open(page: Page, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/calc");
  test.skip((await tid(page, "calc-limit-fill").count()) === 0, "환율 자료 없음");
}
async function set(page: Page, price: string, duty: string) {
  await page.locator("#currency").selectOption("USD");
  await page.locator("#price").fill(price);
  await page.locator("#duty").fill(duty);
  await expect.poll(async () => page.locator('[data-testid="calc-result"] [data-testid="rolling-number"][data-state="rolling"]').count(), { timeout: 8000 }).toBe(0);
  await page.waitForTimeout(150);
}
const val = async (page: Page, s: string) => ((await slot(page, s).count()) ? Number(await slot(page, s).first().getAttribute("data-value")) : null);
const noteLoc = (page: Page) => tid(page, "calc-tag-top").getByText(NOTE);

for (const width of [1280, 390]) {
  test.describe(`직구 합계 안내 (작업 0296 · ${width})`, () => {
    test("① 합계를 못 구할 때(한도 넘음 · 관세율 없음)만 안내 줄 — 합계 있음 · 한도 안 · 빈 값에는 없음 · 큰 숫자는 물건 값", async ({ page }) => {
      await open(page, width);
      await set(page, "400", "");
      await expect(noteLoc(page), "합계를 못 구함").toBeVisible();
      expect(await val(page, "big"), "큰 숫자 = 물건 값").toBe(await val(page, "price"));
      await set(page, "400", "8");
      await expect(noteLoc(page), "합계 있음").toHaveCount(0);
      await set(page, "100", "");
      await expect(noteLoc(page), "한도 안").toHaveCount(0);
      await set(page, "", "");
      await expect(noteLoc(page), "빈 값").toHaveCount(0);
      await expect(tid(page, "calc-tag-top"), "합계 안내 글이 다른 곳에도 없음").not.toContainText("관세율을 넣으면 합계로 바뀝니다");
    });

    test("① 안내 줄은 결과 카드 머리의 h-14(56px) 칸 안 — 넘어도 1px 이내", async ({ page }) => {
      await open(page, width);
      await set(page, "400", "");
      const r = await noteLoc(page).evaluate((p) => {
        const cell = p.parentElement as HTMLElement;
        const pr = p.getBoundingClientRect(), cr = cell.getBoundingClientRect();
        return { cellH: Math.round(cr.height * 10) / 10, inside: pr.top >= cr.top - 1 && pr.bottom <= cr.bottom + 1, noteH: Math.round(pr.height * 10) / 10, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      expect(r.cellH, "칸 높이 56px").toBe(56);
      expect(r.inside, `안내 줄(높이 ${r.noteH})이 칸 안`).toBe(true);
      expect(r.overflow, "가로 넘침").toBeLessThanOrEqual(0);
    });

    test("③ 큰 제목 — 한도 넘음 · 관세율 없음이면 '관세율을 넣어 보세요'(한도 초과 없음) · 다른 상태 제목은 그대로", async ({ page }) => {
      await open(page, width);
      const h1 = page.getByRole("heading", { level: 1 });
      await set(page, "400", "");
      await expect(h1).toContainText("관세율을 넣어 보세요");
      expect(await h1.innerText(), "제목에 '한도 초과' 없음").not.toContain("한도 초과");
      await set(page, "400", "8");
      await expect(h1).toContainText(/관세 · 부가세 약 [\d,]+원이 붙습니다/);
      await set(page, "100", "");
      await expect(h1).toContainText("세금 없이 받습니다");
      await set(page, "", "");
      await expect(h1).toContainText("물건 값을 넣어 보세요");
    });

    test("④ 상태를 바꿔도 아래 칸이 밀리지 않음 — 한도 안 · 합계 있음 · 합계 못 구함 · 빈 값에서 결과 카드 머리 높이 · 아래 칸 거리 · 입력 카드 · 가로 넘침", async ({ page }) => {
      await open(page, width);
      const rows: { top: number; below: number; input: number; overflow: number }[] = [];
      for (const [p, d] of [["100", ""], ["400", "8"], ["400", ""], ["", ""]] as const) {
        await set(page, p, d);
        rows.push(await page.evaluate(() => {
          const top = document.querySelector('[data-testid="calc-tag-top"]') as HTMLElement, bot = document.querySelector('[data-testid="calc-tag-bottom"]') as HTMLElement, inp = document.querySelector('[data-testid="calc-input"]') as HTMLElement;
          const tb = top.getBoundingClientRect(), bb = bot.getBoundingClientRect();
          return { top: Math.round(tb.height * 10) / 10, below: Math.round((bb.top - tb.top) * 10) / 10, input: Math.round(inp.getBoundingClientRect().height * 10) / 10, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        }));
      }
      for (const r of rows) {
        expect(Math.abs(r.top - rows[0].top), `결과 카드 머리 높이 ${r.top} (처음 ${rows[0].top})`).toBeLessThanOrEqual(1);
        expect(Math.abs(r.below - rows[0].below), `아래 칸 거리 ${r.below} (처음 ${rows[0].below})`).toBeLessThanOrEqual(1);
        expect(Math.abs(r.input - rows[0].input), "입력 카드 높이").toBeLessThanOrEqual(1);
        expect(r.overflow, "가로 넘침").toBeLessThanOrEqual(0);
      }
    });
  });
}

// ② 휴대폰 요약 띠 — 폭 640 미만에서만 보임
for (const width of [390, 360, 320]) {
  test.describe(`휴대폰 요약 띠 (작업 0296 · ${width})`, () => {
    test("② 세 상태 문구 — 합계 있음 · 관세율 없음 · 한도 안(그대로) · 오류 · 빈 값은 그대로", async ({ page }) => {
      await open(page, width);
      const line = tid(page, "calc-summary");
      await set(page, "400", "8");
      const total = await val(page, "total");
      expect(total).not.toBeNull();
      await expect(line, "합계 있음").toHaveText(`모두 합쳐 약 ${en(total!)}원`);
      expect(await line.innerText(), "옛 글(한도 넘음 · 세금 약)이 없음").not.toMatch(/한도 넘음|세금 약/);
      await set(page, "400", "");
      const price = await val(page, "price");
      await expect(line, "관세율 없음").toHaveText(`물건 값 ${en(price!)}원 · 관세율을 넣으면 합계`);
      expect(await line.innerText(), "'한도 넘음' 없음").not.toContain("한도 넘음");
      await set(page, "100", "");
      await expect(line, "한도 안(그대로)").toHaveText(`${en((await val(page, "price"))!)}원 · 면세 한도 안`);
    });

    test("② 요약 띠는 높이 56px 고정 · 글이 잘리지 않고(긴 금액도) · 가로 넘침 없음", async ({ page }) => {
      await open(page, width);
      const line = tid(page, "calc-summary");
      const measure = () => line.evaluate((e) => { const r = e.getBoundingClientRect(); return { h: Math.round(r.height * 10) / 10, y: Math.round(r.top * 10) / 10, clipped: e.scrollHeight - e.clientHeight, cw: e.scrollWidth - e.clientWidth, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
      await set(page, "100", "");
      const base = await measure();
      expect(base.h, "높이 56px").toBe(56);
      for (const [p, d] of [["400", "8"], ["400", ""], ["999999", "8"], ["999999", ""], ["700000", ""], ["", ""], ["abc", ""]] as const) {
        await set(page, p, d);
        const m = await measure();
        expect(m.h, `${p}/${d} 높이`).toBe(56);
        expect(m.clipped, `${p}/${d} 글이 잘림(넘친 높이)`).toBeLessThanOrEqual(0);
        expect(m.cw, `${p}/${d} 가로로 잘림`).toBeLessThanOrEqual(0);
        expect(m.overflow, `${p}/${d} 문서 가로 넘침`).toBeLessThanOrEqual(0);
      }
    });

    test("① 안내 줄이 좁은 폭(320 · 360)에서 두 줄로 꺾여도 h-14 칸 안 · 아래 칸 안 밀림", async ({ page }) => {
      await open(page, width);
      await set(page, "400", "");
      const r = await tid(page, "calc-tag-top").getByText(NOTE).evaluate((p) => {
        const cell = p.parentElement as HTMLElement, pr = p.getBoundingClientRect(), cr = cell.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(p);
        const noteLines = new Set(Array.from(range.getClientRects()).filter((x) => x.width > 2).map((x) => Math.round(x.top / 4))).size;
        const kids = Array.from(cell.children).map((c) => c.getBoundingClientRect());
        return { cellH: cr.height, inside: pr.top >= cr.top - 1 && pr.bottom <= cr.bottom + 1, kidsInside: kids.every((k) => k.top >= cr.top - 1 && k.bottom <= cr.bottom + 1), noteLines, spare: Math.round((cr.height - kids.reduce((s, k) => s + k.height, 0)) * 10) / 10 };
      });
      expect(r.cellH, "칸 높이").toBe(56);
      expect(r.inside, "안내 줄이 칸 안").toBe(true);
      expect(r.kidsInside, "큰 숫자 · 안내 줄 모두 칸 안(밖으로 삐져나오지 않음)").toBe(true);
      expect(r.spare, `칸 여유 ${r.spare}px (안내 ${r.noteLines}줄)`).toBeGreaterThanOrEqual(-2); // 두 줄이면 합이 칸보다 약 1.8px 큼(가운데 맞춤이라 위아래로 0.9px씩) — 칸이 고정 높이라 아래는 안 밀림
    });
  });
}

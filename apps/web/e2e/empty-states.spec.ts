// 작업 0346 — 막다른 화면 없애기: 환율을 못 받은 날의 빈 상태 e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   빈 상태는 빌드 때 환율을 못 받으면 그려져서(정적 페이지) 값을 바꿀 수 없음 → 고정 자료 빌드에서만 돎(airfare-calendar.spec.ts 와 같은 방식 · 작업 0234)
//   환율을 못 받는 빌드 만들기(빌드는 한 번만):
//     FIXTURE_NO_FX=1 node e2e/fixture-api.mjs &  (/fx/* · /signal* 을 503 으로 · 나머지는 운영 API 를 그대로 전달)  →  TRIPFX_API_URL=http://127.0.0.1:4398 EMPTY_FIXTURE=1 npm run build  →  EMPTY_FIXTURE=1 npx playwright test -c e2e/empty.config.ts
//   그 밖의 빌드(CI · 운영 API)에서는 건너뜀
//   builder 가 다는 표시(공통 부품 DataEmpty) — [data-testid="data-empty"](data-surface="light") 안에: 이름표 "자료 없음 · YYYY-MM-DD HH:MM 확인" · 제목 · 이유 · "그동안 볼 수 있는 것" 링크 칩(<a>)
//     /calc 의 링크 "이번 주 관세청 과세환율 (아래)" → #customs: 이 칸이 가리키는 곳에 id="customs" (이번 주 과세환율 구역)
//   여행 물가(환율 없는 나라)의 자리는 builder 가 정해 lead 에게 알림 — 그 화면은 이 파일에 더함
import { type Page, expect, test } from "@playwright/test";

const FIXTURE = process.env.EMPTY_FIXTURE === "1";
const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const CHECKED = /^자료 없음 · \d{4}-\d{2}-\d{2} \d{2}:\d{2} 확인$/;

test.beforeEach(() => {
  test.skip(!FIXTURE, "환율을 못 받는 고정 자료 빌드(EMPTY_FIXTURE=1 · e2e/fixture-api.mjs FIXTURE_NO_FX=1)에서만 돎");
});

test.describe("/calc 환율을 못 받은 날 (작업 0346 · 시안 3-new)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/calc");
  });

  test("흰 카드 — 이름표 · 제목 · 이유(수집 일정) · 링크 셋", async ({ page }) => {
    const card = tid(page, "data-empty");
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("data-surface", "light");
    await expect(card.getByText(CHECKED)).toBeVisible();
    await expect(card).toContainText("오늘 환율을 아직 받지 못해 계산을 잠시 멈췄습니다");
    await expect(card).toContainText("평일 낮 12시부터 30분마다 다시 받고, 받으면 사이트를 새로 만들어 계산이 다시 열립니다");
    await expect(card).toContainText("그동안 볼 수 있는 것");
    const links = card.getByRole("link");
    await expect(links).toHaveCount(3);
    expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(["#customs", "/currencies", "/prices"]);
  });

  test("파랑 면 위에서도 글자가 보임 — 제목 · 이유 · 이름표 글자 대비 4.5 이상 (예전: 파랑 위 어두운 글자)", async ({ page }) => {
    for (const sel of ['[data-testid="data-empty"] h2, [data-testid="data-empty"] h3, [data-testid="data-empty"] p']) {
      const n = await page.locator(sel).count();
      expect(n).toBeGreaterThanOrEqual(2);
      for (let i = 0; i < n; i++) {
        const ratio = await page.locator(sel).nth(i).evaluate((el) => {
          const lum = (rgb: string) => {
            const [r, g, b] = (rgb.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map((v) => {
              const c = Number(v) / 255;
              return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
          };
          const fg = lum(getComputedStyle(el).color);
          let node: Element | null = el;
          let bg = "rgba(0, 0, 0, 0)";
          while (node) {
            bg = getComputedStyle(node).backgroundColor;
            if (!/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) break;
            node = node.parentElement;
          }
          const b = lum(bg);
          return (Math.max(fg, b) + 0.05) / (Math.min(fg, b) + 0.05);
        });
        expect(ratio, `글자 ${i} 대비`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  test("링크가 이어짐 — 통화별 1년 흐름 → /currencies · 과세환율 칸(#customs)이 있음", async ({ page }) => {
    await expect(page.locator("#customs")).toHaveCount(1);
    await tid(page, "data-empty").getByRole("link", { name: /통화별 1년 흐름/ }).click();
    await expect(page).toHaveURL(/\/currencies\/?$/);
  });

  test("예전 한 줄 글은 사라짐 · 큰 제목 '환율을 받지 못했습니다' 는 그대로 · 가로 넘침 0", async ({ page }) => {
    await expect(page.getByText("환율을 받지 못해 계산할 수 없습니다")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("환율을 받지 못했습니다");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
});

test.describe("통화 상세 값을 못 받은 날 (작업 0346)", () => {
  test("/currencies/USD — 같은 부품 · 통화 이름이 든 제목 · 링크 셋(통화 둘러보기 · 여행 물가 · 직구 계산)", async ({ page }) => {
    await page.goto("/currencies/USD");
    const card = tid(page, "data-empty");
    await expect(card).toBeVisible();
    await expect(card).toHaveAttribute("data-surface", "light");
    await expect(card.getByText(CHECKED)).toBeVisible();
    await expect(card).toContainText("달러");
    await expect(card).toContainText("받지 못했습니다");
    await expect(card).toContainText("30분마다");
    const links = card.getByRole("link");
    expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(["/currencies", "/prices", "/calc"]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  });
});

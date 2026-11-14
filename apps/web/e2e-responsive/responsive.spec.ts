// 반응형 — 세 엔진(크롬 · 파이어폭스 · 사파리) × 네 너비로 운영 사이트를 열어 봄 (작업 0110)
//   2026-10-30 320px 에서 위 메뉴 뒤 둘이 잘려 안 보였는데 넓은 화면 e2e 로는 못 잡았음 (작업 0109)
//   운영 사이트를 열기만 함 — 빌드하지 않아 D1 을 읽지 않음
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/currencies", "/currencies/USD", "/prices", "/flights", "/calc", "/log", "/about", "/geo"];
const WIDTHS = [320, 375, 768, 1280];
const MENU = ["오늘 환율", "통화", "여행 물가", "여행 타이밍", "직구 계산", "작업실", "GEO 측정"];

for (const width of WIDTHS) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });
    for (const path of PAGES) {
      test(`${path} — 가로로 넘치지 않음 · 메뉴 일곱 개가 화면 안에 보임`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
        const nav = page.getByRole("banner").getByRole("navigation");
        for (const name of MENU) {
          const box = await nav.getByRole("link", { name, exact: true }).boundingBox();
          expect(box, `메뉴 "${name}"`).not.toBeNull();
          expect(box!.x, `메뉴 "${name}" 왼쪽`).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width, `메뉴 "${name}" 오른쪽`).toBeLessThanOrEqual(width);
        }
      });
    }
  });
}

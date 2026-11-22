// 반응형 — 세 엔진(크롬 · 파이어폭스 · 사파리) × 네 너비로 운영 사이트를 열어 봄 (작업 0110)
//   2026-10-30 320px 에서 위 메뉴 뒤 둘이 잘려 안 보였는데 넓은 화면 e2e 로는 못 잡았음 (작업 0109)
//   운영 사이트를 열기만 함 — 빌드하지 않아 D1 을 읽지 않음
import { expect, test } from "@playwright/test";

const PAGES = ["/", "/currencies", "/currencies/USD", "/prices", "/flights", "/calc", "/about"]; // 어드민 화면은 apps/admin (작업 0312)
const WIDTHS = [320, 375, 768, 1280];
// 메뉴 순서 = 여행 타이밍 · 오늘 환율 · 통화 · 여행 물가 · 직구 계산 · 작업실 · GEO 측정 (작업 0168 · R4)
const MENU = ["여행 타이밍", "오늘 환율", "통화", "여행 물가", "직구 계산", "작업실", "GEO 측정"];
// 모바일(639px 이하)은 로고 + 메뉴 아이콘 버튼 → 눌러야 메뉴 7칸이 펼쳐짐 (작업 0168 · 0164 의 320px 두 줄 감싸기를 대신) · 데스크톱은 한 줄로 바로 보임
const MOBILE_MAX = 639;

for (const width of WIDTHS) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });
    for (const path of PAGES) {
      test(`${path} — 가로로 넘치지 않음 · 메뉴 일곱 개가 화면 안에 보임 (모바일은 버튼으로 펼침)`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState("networkidle");
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
        const header = page.getByRole("banner");
        if (width <= MOBILE_MAX) {
          const button = header.getByRole("button", { name: /메뉴/ });
          await expect(button).toBeVisible();
          await expect(button).toHaveAttribute("aria-expanded", "false");
          await button.click();
          await expect(button).toHaveAttribute("aria-expanded", "true");
        }
        const nav = header.getByRole("navigation");
        for (const name of MENU) {
          const box = await nav.getByRole("link", { name, exact: true }).boundingBox();
          expect(box, `메뉴 "${name}"`).not.toBeNull();
          expect(box!.x, `메뉴 "${name}" 왼쪽`).toBeGreaterThanOrEqual(0);
          expect(box!.x + box!.width, `메뉴 "${name}" 오른쪽`).toBeLessThanOrEqual(width);
        }
        if (width <= MOBILE_MAX) {
          await page.keyboard.press("Escape"); // Esc 로 닫힘
          await expect(header.getByRole("button", { name: /메뉴/ })).toHaveAttribute("aria-expanded", "false");
        }
      });
    }
  });
}

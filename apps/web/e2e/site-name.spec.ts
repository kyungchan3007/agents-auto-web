// 작업 0197 — 사이트 이름 표기 Flapfx (테스트 먼저 · 실행은 빌드한 사이트를 읽음) · 탭 제목 · 홈 제목 · 메뉴 로고 · 404 · 인트로 말풍선
//   로고 워드마크는 소문자 flapfx 그대로 · 한글 "플랩" 은 화면 어디에도 없음 (글자판 이름 "스플릿 플랩" 은 화면에 쓰지 않음)
import { expect, test } from "@playwright/test";

const TITLES: [string, string][] = [
  ["/", "Flapfx — 환전 타이밍 · 오늘 환율 · 여행 물가 · 직구 세금 계산"],
  ["/prices", "여행 물가 · Flapfx"],
  ["/calc", "직구 계산기 · Flapfx"],
  ["/currencies", "통화 둘러보기 · Flapfx"],
  ["/about", "소개 · 판단 기준 · Flapfx"],
  // 어드민(/geo · /log) 탭 제목은 apps/admin/e2e/basics.spec.ts (작업 0312)
];

test.describe("탭 제목 · 화면 글", () => {
  for (const [path, title] of TITLES) {
    test(`${path} 탭 제목 '${title}'`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
    });
  }

  test("메뉴 로고는 소문자 flapfx · 화면 어디에도 한글 '플랩' 이 없음 (홈)", async ({ page }) => {
    await page.goto("/");
    const header = page.locator("header").first();
    await expect(header).toContainText("flapfx");
    await expect(header).not.toContainText("플랩");
    expect(await page.locator("body").innerText()).not.toContain("플랩");
  });

  test("404 — 탭 제목 '없는 페이지 · Flapfx'", async ({ page }) => {
    const res = await page.goto("/no-such-page-0197");
    expect(res?.status()).toBe(404);
    await expect(page).toHaveTitle("없는 페이지 · Flapfx");
  });
});

test.describe("인트로 말풍선 · 접근 이름 (인트로를 켠 채)", () => {
  test.skip(({ isMobile }) => isMobile, "인트로는 폭 700 초과에서만");
  test.use({ storageState: { cookies: [], origins: [] }, viewport: { width: 1440, height: 900 } });

  test("말풍선 '안녕하세요, Flapfx입니다!' · 덮개 접근 이름 'Flapfx 공항 인트로'", async ({ page }) => {
    await page.goto("/");
    const intro = page.getByTestId("intro");
    await expect(intro).toBeVisible({ timeout: 20_000 });
    await expect(intro).toHaveAttribute("aria-label", "Flapfx 공항 인트로");
    await expect(intro).toContainText("안녕하세요, Flapfx입니다!", { timeout: 30_000 });
    expect(await intro.innerText()).not.toContain("플랩");
  });
});

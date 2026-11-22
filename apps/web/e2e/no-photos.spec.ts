// 작업 0222 — 사진 없음 (사용자 결정) · 실행은 빌드한 사이트를 읽음
// 모든 화면: /images/photos 요청 0 · 깨진 이미지 0 · 사진 구간(photo-header) 없음 · 가로 넘침 없음 · 콘솔 오류 없음
// /about: 사진 없는 머리 (흰 면 · 라벨 · 큰 제목) · 공유 미리보기는 1200×630 PNG
import { expect, test } from "@playwright/test";

const PATHS = ["/", "/flights", "/prices", "/currencies/USD", "/calc", "/about"]; // 어드민은 apps/admin/e2e/basics.spec.ts (작업 0312)

for (const path of PATHS) {
  test(`${path} — 사진 요청 0 · 깨진 이미지 0 · 사진 구간 없음 · 가로 넘침 없음`, async ({ page }) => {
    const photos: string[] = [];
    const errors: string[] = [];
    page.on("request", (r) => /\/images\/photos\//.test(r.url()) && photos.push(r.url()));
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(photos, "사진 요청").toEqual([]);
    await expect(page.locator('[data-testid="photo-header"], img[src*="/images/photos/"], img[srcset*="/images/photos/"]')).toHaveCount(0);
    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src));
    expect(broken, "깨진 이미지").toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test("사진 파일 주소를 직접 열면 없음(404) — 폴더가 사이트에서 빠짐", async ({ request }) => {
  for (const url of ["/images/photos/window-fjord-640.webp", "/images/photos/country-jpn-1024.webp", "/images/photos/plane-sunset-1672.webp"]) {
    const res = await request.get(url);
    expect(res.status(), url).toBe(404);
  }
});

test.describe("/about 사진 없는 머리", () => {
  test("큰 제목(h1) · 흰 면 · 제목이 화면 안 · 기준 카드 8개 · 제목 위 라벨(소개)은 없음 (작업 0265 · 0267)", async ({ page }) => {
    await page.goto("/about");
    const head = page.getByTestId("about-head");
    await expect(head).toBeVisible();
    await expect(head.getByText("소개", { exact: true }), "제목 위 라벨 없음(메뉴 이름을 다시 적은 라벨 삭제 · 작업 0265)").toHaveCount(0);
    const h1 = head.getByRole("heading", { level: 1, name: /어떤 자료를, ?어떤 기준으로 보여 주나요\?/ });
    await expect(h1).toBeVisible();
    const box = await h1.boundingBox();
    const width = page.viewportSize()?.width ?? 0;
    expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width + 1);
    expect(await head.evaluate((el) => getComputedStyle(el).backgroundImage)).toBe("none");
    await expect(page.getByTestId("criteria-card")).toHaveCount(8); // 작업 0267: 여섯 → 여덟
  });

  test("머리 아래에 기준 카드가 바로 이어짐 — 머리 높이가 사진 구간 때처럼 크지 않음(화면 높이의 절반 이하)", async ({ page }) => {
    await page.goto("/about");
    const head = await page.getByTestId("about-head").boundingBox();
    const vh = page.viewportSize()?.height ?? 0;
    expect(head?.height ?? 9999).toBeLessThanOrEqual(vh * 0.5);
  });
});

test("공유 미리보기 이미지 — /opengraph-image 가 1200×630 PNG", async ({ request }) => {
  const res = await request.get("/opengraph-image");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
  const body = await res.body();
  expect(body.readUInt32BE(16)).toBe(1200);
  expect(body.readUInt32BE(20)).toBe(630);
});

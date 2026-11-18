// 화면별 사진 — 작업 0175 · 실행은 lead 가 PR 직전에 (빌드한 사이트를 읽음)
// 다섯 화면 맨 위 구간에만 사진(초안대로) · 작업실 · 통화 · GEO 에는 없음 · 첫 화면 사진은 우선 불러옴 · 폭별 파일(srcset)
//   표시: data-testid="photo-header"(구간) · "photo-header-img"(사진) — packages/ui photo-header.tsx
import { expect, test } from "@playwright/test";

const WITH_PHOTO: [string, string, RegExp][] = [
  ["/", "window-fjord|country-[a-z]{3}", /여행 타이밍/], // 안 고른 상태는 안내판 도착지 나라 사진 · 사진 없으면 window-fjord (작업 0209)
  ["/flights", "window-sunrise", /./],
  ["/prices", "swiss-traveler|country-[a-z]{3}", /./], // 큰 문장 속 나라 사진 · 없으면 swiss-traveler (작업 0209)
  ["/calc", "plane-below", /./],
  ["/about", "plane-sunset", /./],
];

for (const [path, photo] of WITH_PHOTO) {
  test(`${path} — 맨 위에 사진(${photo}) · 폭별 srcset · 우선 불러오기 · 큰 제목이 사진 구간 안`, async ({ page }) => {
    await page.goto(path);
    const header = page.locator('[data-testid="photo-header"]');
    const img = page.locator('[data-testid="photo-header-img"]');
    await expect(header).toHaveCount(1);
    await expect(header).toBeVisible();
    // 맨 위 — 메뉴 바로 아래에서 시작
    const box = await header.boundingBox();
    expect(box?.y ?? 999, "구간 위쪽 위치").toBeLessThan(160);
    // 사진: 불러와졌고 폭별 srcset · sizes · alt · 우선 불러오기
    await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0), { timeout: 10_000 }).toBe(true);
    const srcset = (await img.getAttribute("srcset")) ?? "";
    for (const w of [640, 1024, 1672]) expect(srcset, `${w}w`).toMatch(new RegExp(`/images/photos/(${photo})-${w}\\.webp ${w}w`));
    expect(await img.getAttribute("sizes")).toBe("100vw");
    expect((await img.getAttribute("alt"))?.trim().length ?? 0).toBeGreaterThan(0);
    expect(await img.getAttribute("fetchpriority")).toBe("high");
    expect(await img.getAttribute("loading")).not.toBe("lazy");
    // 큰 제목은 사진 구간 안
    await expect(header.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

for (const path of ["/log", "/currencies", "/currencies/USD", "/geo"]) {
  test(`${path} — 사진 없음 (작업실 · 통화 · GEO)`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('[data-testid="photo-header"]')).toHaveCount(0);
    await expect(page.locator('img[src*="/images/photos/"], img[srcset*="/images/photos/"]')).toHaveCount(0);
  });
}

test("휴대폰 — 사진 구간이 가로로 넘치지 않고 큰 제목이 화면 안", async ({ page }) => {
  test.skip(test.info().project.name !== "휴대폰", "휴대폰 전용");
  await page.goto("/flights");
  const h1 = await page.locator('[data-testid="photo-header"]').getByRole("heading", { level: 1 }).boundingBox();
  const width = page.viewportSize()?.width ?? 0;
  expect(h1?.x ?? -1).toBeGreaterThanOrEqual(0);
  expect((h1?.x ?? 0) + (h1?.width ?? 0)).toBeLessThanOrEqual(width + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test("공유 미리보기 이미지 — /opengraph-image 가 1200×630 PNG", async ({ request }) => {
  const res = await request.get("/opengraph-image");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
  const body = await res.body();
  expect(body.readUInt32BE(16)).toBe(1200); // PNG IHDR 폭
  expect(body.readUInt32BE(20)).toBe(630); // 높이
});

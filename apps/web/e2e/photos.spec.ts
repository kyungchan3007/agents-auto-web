// 화면별 사진 — 작업 0175 · 실행은 lead 가 PR 직전에 (빌드한 사이트를 읽음)
// 다섯 화면 맨 위 구간에만 사진(초안대로) · 작업실 · 통화 · GEO 에는 없음 · 첫 화면 사진은 우선 불러옴 · 폭별 파일(srcset)
//   표시: data-testid="photo-header"(구간) · "photo-header-img"(사진) — packages/ui photo-header.tsx
import { expect, test } from "@playwright/test";

const WITH_PHOTO: [string, string, RegExp][] = [
  // 홈은 작업 0217 새 디자인에서 사진 없음 (아래 "홈 — 사진 없음")
  // /flights 는 작업 0218 새 디자인에서 사진 없음 (머리는 글자판 · 아래 "사진 없음" 목록)
  // /prices 는 작업 0220 새 디자인(파랑 첫 면)에서 사진 없음 — 아래 "사진 없음" 목록
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
    for (const w of [640, 1024, 1672]) expect(srcset, `${w}w`).toContain(`/images/photos/${photo}-${w}.webp ${w}w`);
    expect(await img.getAttribute("sizes")).toBe("100vw");
    expect((await img.getAttribute("alt"))?.trim().length ?? 0).toBeGreaterThan(0);
    expect(await img.getAttribute("fetchpriority")).toBe("high");
    expect(await img.getAttribute("loading")).not.toBe("lazy");
    // 큰 제목은 사진 구간 안
    await expect(header.getByRole("heading", { level: 1 })).toBeVisible();
  });
}

for (const path of ["/", "/log", "/currencies", "/currencies/USD", "/geo"]) {
  test(`${path} — 사진 없음 (홈 · 작업실 · 통화 · GEO)`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator('[data-testid="photo-header"]')).toHaveCount(0);
    await expect(page.locator('img[src*="/images/photos/"], img[srcset*="/images/photos/"]')).toHaveCount(0);
  });
}

test("휴대폰 — 사진 구간이 가로로 넘치지 않고 큰 제목이 화면 안", async ({ page }) => {
  test.skip(test.info().project.name !== "휴대폰", "휴대폰 전용");
  await page.goto("/prices"); // /flights 는 작업 0218 에서 사진 머리가 글자판으로 바뀜 — 사진 머리가 남은 화면으로 확인
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

// 작업 0218 — /flights 는 새 디자인에서 사진 없음 (머리는 글자판) · 사진 파일 · 부품 삭제는 0222
test("/flights — 사진 없음 (머리는 글자판)", async ({ page }) => {
  await page.goto("/flights");
  await expect(page.locator('[data-testid="photo-header"]')).toHaveCount(0);
  await expect(page.locator('img[src*="/images/photos/"], img[srcset*="/images/photos/"]')).toHaveCount(0);
});

// 작업 0220 — /prices 는 새 디자인에서 사진 없음 (파랑 첫 면) · 사진 파일 · 부품 삭제는 0222
test("/prices — 사진 없음 (파랑 첫 면)", async ({ page }) => {
  await page.goto("/prices");
  await expect(page.locator('[data-testid="photo-header"]')).toHaveCount(0);
  await expect(page.locator('img[src*="/images/photos/"], img[srcset*="/images/photos/"]')).toHaveCount(0);
});

// 작업 0276 — "쌈 · 비쌈" 문구 바꾸기(A) 기능 e2e (사용자가 정한 문구: 시안 없이 보고 후 "그 문구안으로 진행해")
//   바뀐 곳: 홈 구간 제목 "가장 저렴한 달은 N월, 가장 비싼 달은 M월" · 말풍선 "가장 저렴한 달 / 가장 비싼 달" · 환율 판정 "낮음 · 보통 · 높음"(핀 · 눈금) · 소개 판정 제목 · 창밖 꼬리표
//   바뀌지 않는 곳(사용자가 "그대로 둠"): 홈 카드 제목 "이번 주 가장 싸게 갈 수 있는 곳" · 달력 제목 "언제 떠나면 쌀까" · 꾸미는 말 "싼 편 · 비싼 편"
//   한 글자로 끊은 낱말 "쌈" · "비쌈"은 홈 · 통화 상세 · 소개에 남지 않음(여행 물가 · 항공료 문구는 작업 0277 이라 이번 검사 밖)
//   "가로로 넘치지 않는다"는 사용자 조건 — 문구가 길어진 홈 휴대폰 제목 · 말풍선 폭 · 판정 줄에서 확인
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
/** 낱말 하나로 끊은 "쌈" · "비쌈" (한글 앞뒤가 없는 경우) */
const STANDALONE = /(^|[^가-힣])(비)?쌈([^가-힣]|$)/;

test.describe('"쌈 · 비쌈" 문구 바꾸기 (작업 0276 · A)', () => {
  test("홈 — 12달 구간 제목은 '가장 저렴한 달은 N월, 가장 비싼 달은 M월' · 말풍선 · 범례도 새 글 · 강조 색이 그대로 있음", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const section = tid(page, "year-section");
    test.skip((await section.count()) === 0, "홈 12달 구역 없음(자료 없음)");
    await expect(page.locator("#year-title")).toHaveText(/^가장 저렴한 달은 \d{1,2}월, 가장 비싼 달은 \d{1,2}월$/);
    await expect(section).toContainText("가장 저렴한 달");
    await expect(section).not.toContainText(/가장 싼 달|가장 쌈|가장 비쌈/);
    // 말풍선은 달 이름 없이 글만(달 이름은 바로 아래 눈금)
    for (const [kind, text] of [["low", "가장 저렴한 달"], ["high", "가장 비싼 달"]] as const) {
      const tag = page.locator(`[data-testid="year-tag"][data-kind="${kind}"]`);
      if ((await tag.count()) > 0) await expect(tag).toHaveText(text);
    }
    // 판정 글 · 강조 색: 제목의 숫자(달)에 강조가 남음 — '저렴'이 싼 쪽 낱말로 잡혀 사라지지 않음
    const emph = page.locator("#year-title [data-testid=emph]");
    if ((await emph.count()) > 0) await expect(emph.first()).toHaveAttribute("data-tone", "neutral");
  });

  test("홈 · 통화 상세 · 소개 — 낱말 하나로 끊은 '쌈' · '비쌈'이 화면에 없음 · 판정은 낮음 · 보통 · 높음", async ({ page }) => {
    for (const path of ["/", "/currencies/USD", "/about"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const body = await page.locator("body").innerText();
      expect(STANDALONE.test(body), `${path} 에 '쌈' · '비쌈' 낱말이 남음: ${(body.match(STANDALONE) ?? [])[0] ?? ""}`).toBe(false);
    }
    await page.goto("/about");
    await expect(page.getByText("낮음 · 보통 · 높음 판정", { exact: true })).toBeVisible();
    await expect(page.locator("main")).toContainText("낮은 쪽 30% 안이면 낮음, 높은 쪽 30% 안이면 높음");
  });

  test("바뀌지 않는 곳 — 홈 카드 제목 · 달력 제목 · '싼 편 · 비싼 편' 꾸미는 말은 그대로", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("body")).toContainText("이번 주 가장 싸게 갈 수 있는 곳");
    await page.goto("/flights");
    await page.waitForLoadState("networkidle");
    const calendar = page.locator("#airfare-title");
    if ((await calendar.count()) > 0) await expect(calendar).toContainText("언제 떠나면 쌀까");
    await expect(page.locator("body")).toContainText("싼 편"); // 범례 · 판정 설명의 꾸미는 말
  });

  test("여행 타이밍 창밖 꼬리표 — '가장 저렴한 달 / 가장 비싼 달' · 새 글에도 가로 넘침 없음", async ({ page }) => {
    await page.goto("/flights");
    await page.waitForLoadState("networkidle");
    const window = tid(page, "window-view");
    test.skip((await window.count()) === 0, "창밖 구역 없음");
    await window.scrollIntoViewIfNeeded();
    const tag = tid(page, "window-tag");
    await expect.poll(async () => (await tag.innerText()).trim(), { message: "꼬리표 글", timeout: 8000 }).toMatch(/^(가장 저렴한 달|가장 비싼 달)?$/);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "가로 넘침").toBeLessThanOrEqual(0);
  });

  for (const [name, width, height] of [["휴대폰 390", 390, 844], ["넓은 화면 1280", 1280, 800]] as const) {
    test(`${name} — 문구가 길어진 홈 12달 제목 · 도착지 판정 줄에서 가로 넘침 없음 · 제목이 화면 안`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      const title = page.locator("#year-title");
      test.skip((await title.count()) === 0, "12달 구역 없음");
      await title.scrollIntoViewIfNeeded();
      const b = (await title.boundingBox())!;
      expect(b.x, "제목 왼쪽").toBeGreaterThanOrEqual(-1);
      expect(b.x + b.width, "제목 오른쪽").toBeLessThanOrEqual(width + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "가로 넘침").toBeLessThanOrEqual(0);
    });
  }
});

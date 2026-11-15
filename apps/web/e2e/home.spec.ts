// 홈 — 작업 0169 (디자인 변경 ②) · 실행은 lead 가 PR 직전에 (빌드한 사이트를 읽음)
// 값은 날마다 · 자료 유무에 따라 달라서 동작 · 순서 · 문구만 봄 — 지수가 있을 때와 없을 때(지금 운영) 모두 맞아야 함
//   builder 가 다는 표시: id="today"(바다 띠) · id="destinations"(도착지별 환전 타이밍) · data-testid="travel-graph" · data-testid="plane-route"
import { expect, test } from "@playwright/test";
import { openMenuIfCollapsed } from "./helpers";

test("홈 구간 순서 — 여행 타이밍 → 오늘 환율(바다 띠) → 도착지별 환전 타이밍", async ({ page }) => {
  await page.goto("/");
  const y = async (loc: ReturnType<typeof page.locator>) => (await loc.boundingBox())?.y ?? Number.NaN;
  // 메뉴의 "여행 타이밍" 링크는 휴대폰에서 접혀 있어 위치가 없음 — 머리글 밖(본문)의 라벨을 찾음
  const timing = await y(page.locator('*:text-is("여행 타이밍"):not(header *)').first());
  const today = await y(page.locator("#today"));
  const dest = await y(page.locator("#destinations"));
  expect(timing, "여행 타이밍").toBeLessThan(today);
  expect(today, "오늘 환율").toBeLessThan(dest);
});

test("여행 타이밍 — 지수가 없으면 '아직 받지 못했습니다' · 그래프 · 비행기 없음 / 있으면 'N월에 떠나세요' · 그래프 · 비행기", async ({ page }) => {
  await page.goto("/");
  const none = page.getByText("국제항공료 지수를 아직 받지 못했습니다");
  const title = page.getByText(/^\d+월에 떠나세요$/);
  await expect(none.or(title)).toBeVisible(); // 둘 중 하나는 반드시
  if (await none.isVisible()) {
    await expect(page.locator('[data-testid="travel-graph"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="plane-route"]')).toHaveCount(0);
  } else {
    await expect(page.locator('[data-testid="travel-graph"]')).toBeVisible();
    await expect(page.locator('[data-testid="plane-route"]')).toHaveCount(1);
  }
});

test("오늘 환율 띠 — 이번 주 가장 싼 곳 문장 또는 '오늘 환율을 아직 받지 못했습니다' · 숫자를 지어내지 않음", async ({ page }) => {
  await page.goto("/");
  const band = page.locator("#today");
  await expect(band).toContainText("오늘 환율");
  await expect(band).toContainText(/이번 주 가장 싸게 갈 수 있는 곳은 .+입니다|오늘 환율을 아직 받지 못했습니다/);
});

test("도착지별 환전 타이밍 — 네 도시 줄이 통화 상세로 연결", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#destinations");
  await expect(section.getByRole("heading", { name: "도착지별 환전 타이밍" })).toBeVisible();
  for (const [city, currency] of [["도쿄", "JPY"], ["방콕", "THB"], ["파리", "EUR"], ["뉴욕", "USD"]]) {
    const link = section.getByRole("link", { name: new RegExp(city) });
    await expect(link, city).toHaveAttribute("href", `/currencies/${currency}`);
  }
});

test("메뉴 '오늘 환율' → 홈의 바다 띠(#today)로", async ({ page }) => {
  await page.goto("/currencies"); // 다른 페이지에서 시작
  await openMenuIfCollapsed(page);
  await page.getByRole("banner").getByRole("navigation").getByRole("link", { name: "오늘 환율", exact: true }).click();
  await expect(page).toHaveURL(/\/#today$/);
  await expect(page.locator("#today")).toBeInViewport();
});

test("바닥 띠 — 비행기 모델 출처(CC-BY 4.0)와 자료 출처", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("Poly by Google");
  await expect(footer).toContainText("CC-BY 4.0");
  await expect(footer).toContainText("한국수출입은행");
  await expect(footer.locator('a[href^="https://poly.pizza/"]')).toHaveCount(1);
});

// 도착지 줄 — 작업 0170 추가 요청 (사용자 "시안이랑 다르다"): 데스크톱은 한 줄 세 칸 · 줄 높이 시안(90)의 절반쯤 아니라 시안 그대로 · 모바일은 눈금 없이 핀 오른쪽
//   builder 가 다는 표시: data-testid="dest-row" · "dest-city" · "dest-rate" · "dest-scale" · "dest-pin" · "dest-mobile-meta" (packages/ui destination-row.test.ts 머리 주석)
test("도착지 줄 — 넓은 화면은 한 줄 세 칸(도시 · 환율 · 눈금)이 같은 줄 높이 안 · 줄 높이는 시안 정도", async ({ page }) => {
  test.skip(test.info().project.name === "휴대폰", "넓은 화면 전용");
  await page.goto("/");
  const rows = page.locator('[data-testid="dest-row"]');
  await expect(rows).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    const row = rows.nth(i);
    const [r, city, rate, scale] = await Promise.all(["", "dest-city", "dest-rate", "dest-scale"].map(async (id) => (id ? row.locator(`[data-testid="${id}"]`) : row).boundingBox()));
    if (!r || !city || !rate || !scale) throw new Error(`${i + 1}번째 줄에 칸이 없음`);
    expect(r.height, `${i + 1}번째 줄 높이`).toBeLessThanOrEqual(130); // 시안 90 + 눈금 아래 작은 끝 라벨 · 여백
    for (const [name, b] of [["도시", city], ["환율", rate], ["눈금", scale]] as const) {
      expect(b.y, `${i + 1}번째 ${name} 위`).toBeGreaterThanOrEqual(r.y - 1);
      expect(b.y + b.height, `${i + 1}번째 ${name} 아래`).toBeLessThanOrEqual(r.y + r.height + 1);
    }
    // 가로 순서: 도시 → 환율 → 눈금 (한 줄)
    expect(city.x).toBeLessThan(rate.x);
    expect(rate.x).toBeLessThan(scale.x);
    // 세로로 쌓이지 않음 — 세 칸의 가운데 높이 차이가 줄 높이 안
    const mid = (b: { y: number; height: number }) => b.y + b.height / 2;
    expect(Math.abs(mid(city) - mid(scale)), `${i + 1}번째 도시 · 눈금 높이`).toBeLessThanOrEqual(r.height / 2);
  }
});

test("도착지 줄 — 판정 핀에 근거 숫자(하위 · 상위 N%) 또는 글자만", async ({ page }) => {
  await page.goto("/");
  const pins = page.locator('[data-testid="dest-pin"]');
  const n = await pins.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const text = (await pins.nth(i).textContent())?.trim() ?? "";
    expect(text, `${i + 1}번째 핀`).toMatch(/^((하위|상위) \d+% · )?(쌈|보통|비쌈)$/);
  }
});

test("도착지 줄 — 휴대폰은 눈금이 안 보이고 핀이 오른쪽 · 왼쪽에 '통화 · 환율'", async ({ page }) => {
  test.skip(test.info().project.name !== "휴대폰", "휴대폰 전용");
  await page.goto("/");
  const row = page.locator('[data-testid="dest-row"]').first();
  await expect(row.locator('[data-testid="dest-scale"]')).toBeHidden();
  await expect(row.locator('[data-testid="dest-mobile-meta"]')).toBeVisible();
  const [city, pin] = await Promise.all([row.locator('[data-testid="dest-city"]').boundingBox(), row.locator('[data-testid="dest-pin"]:visible').first().boundingBox()]);
  if (!city || !pin) throw new Error("도시 · 핀이 없음");
  expect(pin.x, "핀은 도시보다 오른쪽").toBeGreaterThan(city.x + 40);
});

// 글꼴 — 작업 0173 · 0176: 맨 위 큰 제목 · 큰 숫자 · 로고는 Pretendard 800(자체 호스팅 · Gasoek One 은 없어짐) · 구간 제목 · 도시 이름은 IBM Plex Sans KR 굵게(700) · 실행은 lead
//   next/font 가 IBM Plex 이름을 "__IBM_Plex_Sans_KR_해시" 로 바꾸므로 이름 일부로 비교 (Pretendard 는 직접 @font-face 라 이름 그대로)
const FONT = /Pretendard/i;
const PLEX = /IBM_Plex_Sans_KR|IBM Plex Sans KR/i;
const style = (loc: import("@playwright/test").Locator) => loc.first().evaluate((el) => ({ family: getComputedStyle(el).fontFamily, weight: getComputedStyle(el).fontWeight }));

test("글꼴 — 맨 위 큰 제목 · 로고는 Pretendard 800 (Gasoek One 아님)", async ({ page }) => {
  await page.goto("/");
  for (const loc of [page.getByRole("heading", { level: 1 }), page.getByRole("banner").getByRole("link", { name: /tripfx/i })]) {
    const s = await style(loc);
    expect(s.family).toMatch(FONT);
    expect(s.family).not.toMatch(/Gasoek/i);
    expect(Number(s.weight)).toBe(800);
  }
});

test("글꼴 — 구간 제목(도착지별 환전 타이밍) · 도시 이름은 IBM Plex Sans KR 700", async ({ page }) => {
  await page.goto("/");
  for (const loc of [page.locator("#destinations").getByRole("heading", { name: "도착지별 환전 타이밍" }), page.locator('[data-testid="dest-city"]')]) {
    const s = await style(loc);
    expect(s.family).toMatch(PLEX);
    expect(s.family).not.toMatch(FONT);
    expect(Number(s.weight)).toBeGreaterThanOrEqual(700);
  }
});

// 홈 바다 띠 문구 정리 — 작업 0174: "예측이 아닙니다 · 평일 12시" · "주말에는 고시가 없어 …" 줄이 없음 (실행은 lead)
test("오늘 환율 띠 — '예측이 아닙니다' · '평일 12시' · 주말 고시 줄이 없고 판정 한 줄은 있음 (작업 0174)", async ({ page }) => {
  await page.goto("/");
  const band = page.locator("#today");
  await expect(band).not.toContainText("예측이 아닙니다");
  await expect(band).not.toContainText("평일 12시");
  await expect(band).not.toContainText(/주말에는 고시가 없어|값 반영이 늦어지고|낮 12시경 나옵니다/);
  if (await band.getByText(/이번 주 가장 싸게 갈 수 있는 곳은/).count()) await expect(band).toContainText(/최근 90일 중 /);
});

test("홈 — 도착지 설명 줄의 '예측이 아니며 투자 · 금융 조언이 아닙니다' · 바닥 띠의 출처는 남음 (작업 0174)", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#destinations")).toContainText("예측이 아니며 투자 · 금융 조언이 아닙니다");
  await expect(page.getByRole("contentinfo")).toContainText("한국수출입은행");
});

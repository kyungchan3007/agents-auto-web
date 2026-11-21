// 홈 — 작업 0169 (디자인 변경 ②) · 실행은 lead 가 PR 직전에 (빌드한 사이트를 읽음)
// 값은 날마다 · 자료 유무에 따라 달라서 동작 · 순서 · 문구만 봄 — 지수가 있을 때와 없을 때(지금 운영) 모두 맞아야 함
//   builder 가 다는 표시: id="board"(탑승권 카드) · id="today"(도착지별 환전 타이밍 · 작업 0233)  · data-testid="travel-graph" · data-testid="plane-route"
import { expect, test } from "@playwright/test";
import { openMenuIfCollapsed } from "./helpers";

test("홈 구간 순서 — 여행 타이밍 → 오늘 환율(바다 띠) → 도착지별 환전 타이밍", async ({ page }) => {
  await page.goto("/");
  const y = async (loc: ReturnType<typeof page.locator>) => (await loc.boundingBox())?.y ?? Number.NaN;
  // 메뉴의 "여행 타이밍" 링크는 휴대폰에서 접혀 있어 위치가 없음 — 머리글 밖(본문)의 라벨을 찾음
  const timingLoc = page.locator('*:text-is("여행 타이밍"):not(header *)').first();
  const timing = await y(timingLoc);
  const today = await y(page.locator("#board"));
  const dest = await y(page.locator("#today"));
  if ((page.viewportSize()?.width ?? 0) >= 1024) {
    // 작업 0245 — 1024 이상은 두 단: 여행 타이밍(제목)이 왼쪽 · 오늘 환율(카드)이 오른쪽 (위아래가 아니라 좌우 순서)
    const tx = (await timingLoc.boundingBox())?.x ?? Number.NaN;
    const bx = (await page.locator("#board").boundingBox())?.x ?? Number.NaN;
    expect(tx, "여행 타이밍(왼쪽)").toBeLessThan(bx);
  } else {
    expect(timing, "여행 타이밍").toBeLessThan(today);
  }
  expect(today, "오늘 환율").toBeLessThan(dest);
});

test("여행 타이밍 — 지수가 없으면 '아직 받지 못했습니다' · 12달 막대 없음 / 있으면 'N월에 떠나세요' · 12달 막대 (3D 비행기는 홈에 없음 · 작업 0217)", async ({ page }) => {
  await page.goto("/");
  const none = page.getByText("국제항공료 지수를 아직 받지 못했습니다");
  const title = page.getByText(/^\d+월에 떠나세요$/);
  await expect(none.or(title)).toBeVisible(); // 둘 중 하나는 반드시
  if (await none.isVisible()) {
    await expect(page.locator('[data-testid="year-bars"]')).toHaveCount(0);
  } else {
    await expect(page.locator('[data-testid="year-bars"]')).toBeVisible();
  }
  await expect(page.locator('[data-testid="plane-route"]')).toHaveCount(0);
});

test("오늘 환율 띠 — 이번 주 가장 싼 곳 문장 또는 '오늘 환율을 아직 받지 못했습니다' · 숫자를 지어내지 않음", async ({ page }) => {
  await page.goto("/");
  const band = page.locator("#board");
  await expect(band).toContainText("이번 주 가장 싸게 갈 수 있는 곳"); // 작업 0177: 안내판 위 작은 제목
  await expect(page.locator('[data-testid="flap-board"]')).toHaveAttribute("aria-label", /이번 주 가장 싸게 갈 수 있는 곳은 .+입니다|오늘 환율을 아직 받지 못했습니다|판단할 신호가 아직 없습니다/);
});

test("도착지별 환전 타이밍 — 네 도시 줄이 통화 상세로 연결", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#today");
  await expect(section.getByRole("heading", { name: "도착지별 환전 타이밍" })).toBeVisible();
  for (const [city, currency] of [["도쿄", "JPY"], ["방콕", "THB"], ["파리", "EUR"], ["뉴욕", "USD"]]) {
    const link = section.getByRole("link", { name: new RegExp(city) });
    await expect(link, city).toHaveAttribute("href", `/currencies/${currency}`);
  }
});

test("메뉴 '오늘 환율' → 홈의 도착지별 환전 타이밍 구역(#today)으로 (작업 0233 · 자세한 위치는 today-anchor.spec)", async ({ page }) => {
  await page.goto("/currencies"); // 다른 페이지에서 시작
  await openMenuIfCollapsed(page);
  await page.getByRole("banner").getByRole("navigation").getByRole("link", { name: "오늘 환율", exact: true }).click();
  await expect(page).toHaveURL(/\/#today$/);
  await expect(page.locator("#today")).toBeInViewport();
});

test("바닥 띠 — 자료 출처 · 3D 비행기를 홈에서 뺐으므로 비행기 모델 출처는 없음 (그래프 2D · 인트로 화면에는 그대로)", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("한국수출입은행");
  await expect(footer).toContainText("Kenney");
  await expect(footer).not.toContainText("Poly by Google");
  await expect(footer.locator('a[href^="https://poly.pizza/"]')).toHaveCount(0);
});

// 도착지 줄 — 작업 0170 추가 요청 (사용자 "시안이랑 다르다"): 데스크톱은 한 줄 세 칸 · 줄 높이 시안(90)의 절반쯤 아니라 시안 그대로 · 모바일은 눈금 없이 핀 오른쪽
//   표시(작업 0217): data-testid="dest-row" · "dest-city" · "dest-rate" · "dest-scale" · "dest-status" · "dest-flag" · "dest-dot"
test("도착지 줄 — 넓은 화면은 한 줄 세 칸(도시 · 눈금 · 금액)이 같은 줄 높이 안 · 줄 높이는 시안 정도 (작업 0217 · 시안 A 목록 순서)", async ({ page }) => {
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
    expect(city.x).toBeLessThan(scale.x);
    expect(scale.x).toBeLessThan(rate.x);
    // 세로로 쌓이지 않음 — 세 칸의 가운데 높이 차이가 줄 높이 안
    const mid = (b: { y: number; height: number }) => b.y + b.height / 2;
    expect(Math.abs(mid(city) - mid(scale)), `${i + 1}번째 도시 · 눈금 높이`).toBeLessThanOrEqual(r.height / 2);
  }
});

test("도착지 줄 — 상태에 근거 숫자(하위 · 상위 N%) · 판정 글자 (작업 0217)", async ({ page }) => {
  await page.goto("/");
  const pins = page.locator('[data-testid="dest-status"]');
  const n = await pins.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i++) {
    const text = (await pins.nth(i).textContent())?.trim() ?? "";
    expect(text, `${i + 1}번째 핀`).toMatch(/^((하위|상위) \d+% · )?(쌈|보통|비쌈)$/);
  }
});

test("도착지 줄 — 휴대폰은 위에 국기 · 이름 · 금액(오른쪽), 아래에 막대 (작업 0217 · 시안 B 390)", async ({ page }) => {
  test.skip(test.info().project.name !== "휴대폰", "휴대폰 전용");
  await page.goto("/");
  const row = page.locator('[data-testid="dest-row"]').first();
  const [flag, city, rate, scale] = await Promise.all(["dest-flag", "dest-city", "dest-rate", "dest-scale"].map((id) => row.locator(`[data-testid="${id}"]`).boundingBox()));
  if (!flag || !city || !rate || !scale) throw new Error("국기 · 도시 · 금액 · 막대가 없음");
  expect(flag.x, "국기가 이름보다 왼쪽").toBeLessThan(city.x);
  expect(rate.x, "금액은 이름보다 오른쪽").toBeGreaterThan(city.x + 40);
  expect(scale.y, "막대는 아래 줄").toBeGreaterThanOrEqual(Math.max(city.y + city.height, rate.y + rate.height) - 1);
});

// 글꼴 — 작업 0173 · 0176: 맨 위 큰 제목 · 큰 숫자 · 로고는 Pretendard 800(자체 호스팅 · Gasoek One 은 없어짐) · 구간 제목 · 도시 이름은 IBM Plex Sans KR 굵게(700) · 실행은 lead
//   next/font 가 IBM Plex 이름을 "__IBM_Plex_Sans_KR_해시" 로 바꾸므로 이름 일부로 비교 (Pretendard 는 직접 @font-face 라 이름 그대로)
const FONT = /Pretendard/i;
const PLEX = /IBM_Plex_Sans_KR|IBM Plex Sans KR/i;
const style = (loc: import("@playwright/test").Locator) => loc.first().evaluate((el) => ({ family: getComputedStyle(el).fontFamily, weight: getComputedStyle(el).fontWeight }));

test("글꼴 — 맨 위 큰 제목 · 로고는 Pretendard 800 (Gasoek One 아님)", async ({ page }) => {
  await page.goto("/");
  for (const loc of [page.getByRole("heading", { level: 1 }), page.getByRole("banner").getByRole("link", { name: /flapfx/i })]) {
    const s = await style(loc);
    expect(s.family).toMatch(FONT);
    expect(s.family).not.toMatch(/Gasoek/i);
    expect(Number(s.weight)).toBe(800);
  }
});

test("글꼴 — 구간 제목(도착지별 환전 타이밍) · 도시 이름은 IBM Plex Sans KR 700", async ({ page }) => {
  await page.goto("/");
  for (const loc of [page.locator("#today").getByRole("heading", { name: "도착지별 환전 타이밍" }), page.locator('[data-testid="dest-city"]')]) {
    const s = await style(loc);
    expect(s.family).toMatch(PLEX);
    expect(s.family).not.toMatch(FONT);
    expect(Number(s.weight)).toBeGreaterThanOrEqual(700);
  }
});

// 홈 바다 띠 문구 정리 — 작업 0174: "예측이 아닙니다 · 평일 12시" · "주말에는 고시가 없어 …" 줄이 없음 (실행은 lead)
test("오늘 환율 띠 — '예측이 아닙니다' · '평일 12시' · 주말 고시 줄이 없고 판정 한 줄은 있음 (작업 0174)", async ({ page }) => {
  await page.goto("/");
  const band = page.locator("#board");
  await expect(band).not.toContainText("예측이 아닙니다");
  await expect(band).not.toContainText("평일 12시");
  await expect(band).not.toContainText(/주말에는 고시가 없어|값 반영이 늦어지고|낮 12시경 나옵니다/);
  if (await band.getByText(/이번 주 가장 싸게 갈 수 있는 곳은/).count()) await expect(band).toContainText(/최근 90일 중 /);
});

test("홈 — 도착지 설명 줄의 '예측이 아니며 투자 · 금융 조언이 아닙니다' · 바닥 띠의 출처는 남음 (작업 0174)", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#today")).toContainText("예측이 아니며 투자 · 금융 조언이 아닙니다");
  await expect(page.getByRole("contentinfo")).toContainText("한국수출입은행");
});

// 작업 0191 — 도착지 목록 아래 통화 전체 링크 (개수는 빌드 때 받은 통화 수에서 위 목록 수를 뺀 값 · 자료가 없으면 개수 없이)
test("도착지 목록 아래 '다른 통화 N개 모두 보기 ›' — 누르면 /currencies · 휴대폰에서도 겹침 · 가로 넘침 없음", async ({ page }) => {
  await page.goto("/");
  // 작업 0228: 도착지 카드는 화면 아래에서 알약으로 접혀 있다가 들어오면 펼쳐짐 — 펼친 뒤(끝 상태)에 위치를 잼
  await page.locator("#today").scrollIntoViewIfNeeded();
  await expect.poll(async () => (await page.locator('[data-testid="dest-list"]').getAttribute("data-state")) ?? "final", { timeout: 5000 }).toBe("final");
  const link = page.locator("#today").getByTestId("more-currencies");
  await expect(link).toBeVisible();
  await expect(link).toHaveText(/^(다른 통화 \d+개 모두 보기 ›|통화 모두 보기 ›)$/);
  const lastRow = await page.locator('#today [data-testid="dest-city"]').last().boundingBox();
  const box = await link.boundingBox();
  expect(box && lastRow && box.y).toBeGreaterThan((lastRow?.y ?? 0) + (lastRow?.height ?? 0));
  const width = page.viewportSize()?.width ?? 0;
  expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(width);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await link.click();
  await expect(page).toHaveURL(/\/currencies\/?$/);
});

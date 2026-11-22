// 작업 0303 — 어드민(admin.flapfx.com) 세 화면: 작업실 · GEO 측정 · 만드는 방식 (시안 Version 6)
//   ADD-01 틀 · ADD-02 찾기 창 · ADD-03 단축키 · ADD-04 작업실 · ADD-05 GEO · ADD-06 만드는 방식 · ADD-07 사람 역할 · ADD-08 움직임 줄이기
//   빌드한 사이트를 읽음 (미리보기와 같은 정적 파일) · 휴대폰 · 넓은 화면 두 프로젝트에서 돎
import { type Page, expect, test } from "@playwright/test";
import { hydrated } from "./helpers";

const tid = (page: Page, id: string) => page.getByTestId(id);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 820;
const visibleNav = (page: Page) => page.getByRole("navigation", { name: "어드민 메뉴" }).filter({ visible: true });

test.describe("어드민 틀 (ADD-01)", () => {
  for (const [path, label] of [
    ["/log", "작업실"],
    ["/geo", "GEO 측정"],
    ["/how", "만드는 방식"],
  ] as const) {
    test(`${path} — 어드민 메뉴 세 화면 · 지금 화면 표시 · 방문자 파란 머리띠 없음 · 가로 넘침 없음`, async ({ page }) => {
      await page.goto(path);
      const nav = visibleNav(page);
      await expect(nav.getByRole("link")).toHaveCount(3);
      await expect(nav.locator('a[aria-current="page"]')).toContainText(isPhone(page) && label === "GEO 측정" ? "GEO" : label);
      await expect(page.locator("header.sticky")).toHaveCount(0); // 방문자 NavBar 없음
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
    });
  }

  test("메뉴로 다른 화면에 감", async ({ page }) => {
    await page.goto("/log");
    await visibleNav(page).getByRole("link", { name: /^GEO/ }).click();
    await expect(page).toHaveURL(/\/geo\/?$/);
    await visibleNav(page).getByRole("link", { name: "만드는 방식" }).click();
    await expect(page).toHaveURL(/\/how\/?$/);
  });

  test("넓은 화면 — 사이트로 가기는 flapfx.com", async ({ page }) => {
    test.skip(isPhone(page), "넓은 화면 왼쪽 메뉴");
    await page.goto("/log");
    await expect(page.getByRole("link", { name: "사이트로 가기" })).toHaveAttribute("href", "https://flapfx.com");
  });
});

test.describe("찾기 창 · 단축키 (ADD-02 · ADD-03)", () => {
  test("⌘K / Ctrl+K 로 열고 초성으로 찾아 Enter 로 그 판에 감 · Esc 로 닫힘", async ({ page }) => {
    test.skip(isPhone(page), "글쇠 단축키는 넓은 화면");
    await page.goto("/geo");
    await hydrated(page.locator(".adm-find")); // 단축키는 하이드레이션 뒤에 붙음
    await page.keyboard.press("ControlOrMeta+k");
    const box = page.getByRole("dialog", { name: "찾기" });
    await expect(box).toBeVisible();
    await page.keyboard.type("ㄱㅅ");
    const options = box.getByRole("option");
    await expect(options.first()).toContainText("관세청 과세환율");
    await page.keyboard.press("Enter");
    await expect(box).toHaveCount(0);
    await expect(page.getByRole("searchbox", { name: "질문 걸러 보기" })).toHaveValue(/관세청 과세환율/);
    await page.keyboard.press("ControlOrMeta+k");
    await expect(box).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(box).toHaveCount(0);
  });

  test("휴대폰 — 찾기 단추로 열림", async ({ page }) => {
    test.skip(!isPhone(page), "휴대폰 위쪽 탭");
    await page.goto("/how");
    await page.getByRole("button", { name: "찾기" }).click();
    await expect(page.getByRole("dialog", { name: "찾기" })).toBeVisible();
  });

  test("숫자 단축키 1 · 2 · 3 으로 화면 이동 · 글을 입력하는 중에는 쓰지 않음", async ({ page }) => {
    test.skip(isPhone(page), "글쇠 단축키는 넓은 화면");
    await page.goto("/log");
    await hydrated(page.locator(".adm-find"));
    await page.keyboard.press("2");
    await expect(page).toHaveURL(/\/geo\/?$/);
    await hydrated(page.locator(".adm-find"));
    await page.getByRole("searchbox", { name: "질문 걸러 보기" }).fill("3");
    await expect(page).toHaveURL(/\/geo\/?$/);
    await page.getByRole("searchbox", { name: "질문 걸러 보기" }).blur();
    await page.keyboard.press("3");
    await expect(page).toHaveURL(/\/how\/?$/);
  });
});

test.describe("작업실 (ADD-04)", () => {
  test("상태 숫자 칸 → 실시간 기록 · 팀(다섯 자리 · 같은 높이) → 작업 흐름 → 이 사이트를 어떻게 만들었나", async ({ page }) => {
    await page.goto("/log");
    const order = await page.evaluate(() => ["status-board", "record-card", "work-flow", "site-story"].map((id) => document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().top ?? -1));
    for (let i = 1; i < order.length; i++) expect(order[i], `순서 ${i}`).toBeGreaterThan(order[i - 1]);
    await expect(tid(page, "team-desks").locator("li")).toHaveCount(5);
    await expect(tid(page, "team-desks")).toContainText("data");
    await expect(tid(page, "work-flow").locator("li.key")).toContainText("자동 검사 통과");
    if (!isPhone(page)) {
      const [a, b] = await Promise.all([tid(page, "record-card").boundingBox(), page.locator("#log-team").boundingBox()]);
      expect(Math.abs((a?.height ?? 0) - (b?.height ?? 0)), "실시간 기록 · 팀 같은 높이").toBeLessThan(2);
    }
  });

  test("다시 받기 단추 · 남은 시간(5분) · 누르면 알림", async ({ page }) => {
    await page.goto("/log");
    const btn = page.getByRole("button", { name: /사이트 상태 다시 받기/ });
    await expect(btn).toContainText(/[0-4]:\d\d|5:00/);
    await btn.click();
    await expect(page.getByRole("status")).toContainText("사이트 상태를 다시 받았습니다", { timeout: 10_000 });
  });
});

test.describe("GEO 측정 (ADD-05)", () => {
  test("요약 숫자 4 · 날마다 그래프(막대마다 그날 기록 글) · 막대를 누르면 아래에 그날 기록", async ({ page }) => {
    await page.goto("/geo");
    await expect(tid(page, "geo-cards").locator(".adm-stat")).toHaveCount(4);
    const bars = tid(page, "day-bar");
    const n = await bars.count();
    expect(n).toBeGreaterThan(0);
    const btn = bars.last().getByRole("button");
    const label = (await btn.getAttribute("aria-label")) ?? "";
    expect(label).toMatch(/^\d{4}-\d{2}-\d{2} (응답 받은 질문 \d+개 · 인용 \d+개|측정 실패)/);
    await expect(bars.last().locator(".sr-only")).toHaveText(label);
    await btn.click();
    await expect(tid(page, "geo-answers").locator(".adm-tip")).toHaveText(label);
  });

  test("서버가 그린 HTML 에도 막대 숫자 · 날마다 기록 · 요약 숫자가 그대로", async ({ page }) => {
    const html = await (await page.request.get("/geo")).text();
    for (const id of ["bar-row", "day-bar", "geo-cards", "rename-compare", "geo-bot-pages"]) expect(html, id).toContain(`data-testid="${id}"`);
  });

  test("가로 막대 숫자(글)는 data-value 와 같음", async ({ page }) => {
    await page.goto("/geo");
    const rows = tid(page, "geo-bots").locator('[data-testid="bar-row"]');
    expect(await rows.count()).toBeGreaterThan(0);
    const values = await rows.evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-value") ?? "0")));
    for (let i = 0; i < values.length; i++) expect((await rows.nth(i).innerText()).replace(/,/g, "")).toContain(String(values[i]));
  });

  test("일반 질문 걸러 보기(낱자 · 초성) · 정렬 · 맞는 것이 없으면 안내", async ({ page }) => {
    await page.goto("/geo");
    const table = tid(page, "rename-questions");
    test.skip((await table.locator("tbody tr[data-q]").count()) === 0, "질문 자료 없음");
    const all = await table.locator("tbody tr[data-q]").count();
    const box = page.getByRole("searchbox", { name: "질문 걸러 보기" });
    await box.fill("환율");
    const n = await table.locator("tbody tr[data-q]").count();
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThan(all);
    await expect(table.locator(".adm-count")).toHaveText(`${n} / ${all}개`);
    await box.fill("ㅎㅇ");
    await expect(table.locator("tbody tr[data-q]").first()).toContainText(/환율|해외/);
    await box.fill("없는질문글자");
    await expect(table).toContainText("맞는 질문이 없습니다");
    await box.fill("");
    await table.getByRole("button", { name: "가나다" }).click();
    const names = await table.locator("tbody tr[data-q]").evaluateAll((els) => els.map((e) => e.getAttribute("data-q") ?? ""));
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "ko")));
  });

  test("봇별 읽은 페이지 — AI 봇 · 검색 엔진으로 묶어 보기", async ({ page }) => {
    await page.goto("/geo");
    const card = tid(page, "geo-bot-pages");
    const all = await card.locator('[data-testid="bot-pages-bot"]').count();
    test.skip(all === 0, "봇 자료 없음");
    await card.getByRole("button", { name: "검색 엔진" }).click();
    const eng = await card.locator('[data-testid="bot-pages-bot"]').count();
    await card.getByRole("button", { name: "AI 봇" }).click();
    const ai = await card.locator('[data-testid="bot-pages-bot"]').count();
    expect(eng + ai).toBe(all);
  });
});

test.describe("만드는 방식 (ADD-06 · ADD-07)", () => {
  test("흐름 그림 — 자리를 누르면 하는 일 · 하지 않는 일 · 사람은 기획 · 설계 · 디자인 방향", async ({ page }) => {
    await page.goto("/how");
    const flow = tid(page, "how-flow");
    await flow.locator('[data-node="human"]').click();
    const detail = tid(page, "how-node-detail");
    await expect(detail).toContainText("기획과 설계를 정합니다");
    await expect(detail).toContainText("디자인 방향과 레퍼런스");
    await flow.locator('[data-node="builder"]').click();
    await expect(detail).toContainText("하지 않는 일");
    await expect(detail).toContainText("테스트 파일을 고치지 않습니다");
  });

  test("따라가기 — 단계가 차례로 켜짐", async ({ page }) => {
    await page.goto("/how");
    const flow = tid(page, "how-flow");
    await flow.getByRole("button", { name: "따라가기" }).click();
    await expect(flow.locator(".adm-steps li.on")).toHaveCount(1);
    await expect(flow.locator(".adm-steps li").nth(1)).toHaveClass(/on/, { timeout: 5_000 });
  });

  test("규칙 12 — 묶음 · 펼치면 내용과 원본 링크 · 모두 펼치기", async ({ page }) => {
    await page.goto("/how");
    const rules = tid(page, "how-rules");
    await expect(rules.locator(".adm-rule")).toHaveCount(12);
    const seg = rules.getByRole("group", { name: "규칙 묶음" });
    await seg.getByRole("button", { name: /^안전/ }).click();
    await expect(rules.locator(".adm-rule")).toHaveCount(4);
    const first = rules.locator(".adm-rule").first();
    await first.getByRole("button", { expanded: false }).click();
    await expect(first.getByRole("link", { name: /원본/ })).toHaveAttribute("href", /github\.com\/kyungchan3007\/agents-auto-web\/blob\/main\//);
    await seg.getByRole("button", { name: /^전체/ }).click();
    await rules.getByRole("button", { name: "모두 펼치기" }).click();
    await expect(rules.getByRole("button", { expanded: true })).toHaveCount(12);
  });

  test("궁금한 것 — 질문을 고르면 답이 바뀜 · 모델을 나눈 이유 · 화살표로 넘김", async ({ page }) => {
    await page.goto("/how");
    const faq = tid(page, "how-faq");
    await expect(faq.locator(".adm-ans")).toContainText("기획과 설계를 정합니다");
    await faq.getByRole("button", { name: "모델을 나눈 이유는 무엇인가요?" }).click();
    await expect(faq.locator(".adm-ans")).toContainText("하는 일의 성격이 달라서");
    await faq.getByRole("button", { name: "모델을 나눈 이유는 무엇인가요?" }).focus();
    await page.keyboard.press(isPhone(page) ? "ArrowRight" : "ArrowDown");
    await expect(faq.locator(".adm-ans h3")).toHaveText("규칙은 누가 어떻게 바꾸나요?");
  });

  test("숫자는 저장소에서 센 값 — 작업 수가 0보다 큼", async ({ page }) => {
    await page.goto("/how");
    const tasks = page.locator(".adm-stat").filter({ hasText: "작업" }).first().locator(".adm-flap");
    const n = Number(((await tasks.getAttribute("aria-label")) ?? "0").replace(/,/g, ""));
    expect(n).toBeGreaterThan(200);
  });
});

test.describe("만드는 방식 — 세 칸 · 검색 · 시행착오 (작업 0306)", () => {
  test("세 칸 · 검색 설명 → 규칙 → 궁금한 것 → 시행착오 순서", async ({ page }) => {
    await page.goto("/how");
    await expect(page.getByTestId("how-focus").locator(".adm-panel")).toHaveCount(3);
    const order = await page.evaluate(() => ["how-focus", "how-search", "how-rules", "how-faq", "how-trials"].map((id) => document.querySelector(`[data-testid="${id}"]`)?.getBoundingClientRect().top ?? -1));
    for (let i = 1; i < order.length; i++) expect(order[i], `순서 ${i}`).toBeGreaterThan(order[i - 1]);
  });

  test("검색 예시 — 다낭 → VND(도시 앞글자) · 화살표 · Enter 로 고름 · 없으면 안내", async ({ page }) => {
    await page.goto("/how");
    const box = page.getByTestId("how-search");
    const input = box.getByRole("combobox", { name: "통화 검색 예시" });
    await input.fill("다낭");
    const first = box.getByRole("option").first();
    await expect(first).toContainText("VND");
    await expect(first).toContainText("도시 앞글자");
    await input.press("ArrowDown");
    await expect(first).toHaveAttribute("aria-selected", "true");
    await input.press("Enter");
    await expect(box.locator(".adm-srch-picked")).toContainText("/currencies/VND");
    await input.fill("없는도시이름");
    await expect(box).toContainText("찾는 통화가 없습니다");
  });

  test("시행착오 — 종류로 골라 보기 · 펼치면 원인 · 바꾼 것 · 근거 링크", async ({ page }) => {
    await page.goto("/how");
    const tr = page.getByTestId("how-trials");
    const all = await tr.locator("[data-trial]").count();
    expect(all).toBeGreaterThan(10);
    await tr.getByRole("group", { name: "시행착오 종류" }).getByRole("button", { name: /^데이터/ }).click();
    const data = await tr.locator("[data-trial]").count();
    expect(data).toBeLessThan(all);
    const first = tr.locator("[data-trial]").first();
    await first.getByRole("button").first().click();
    await expect(first).toContainText("원인");
    await expect(first).toContainText("바꾼 것");
    await expect(first.locator(".src a").first()).toHaveAttribute("href", /github\.com\/kyungchan3007\/agents-auto-web/);
    await expect(tr).not.toContainText("영어로 답함");
  });
});

test.describe("움직임 줄이기 (ADD-08)", () => {
  test.use({ reducedMotion: "reduce" });
  test("안내판 숫자는 처음부터 최종 값 · 화면 읽기 이름도 최종 값", async ({ page }) => {
    await page.goto("/geo");
    const flap = tid(page, "geo-cards").locator(".adm-flap").first();
    const label = (await flap.getAttribute("aria-label")) ?? "";
    expect(label.length).toBeGreaterThan(0);
    expect((await flap.innerText()).replace(/\s/g, "")).toBe(label.replace(/\s/g, ""));
    expect(await flap.locator("i.on").count()).toBe(0);
  });
});

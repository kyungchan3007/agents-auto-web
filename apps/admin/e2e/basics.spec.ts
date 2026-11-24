// 어드민 화면 기본기 (작업 0312 에 운영 e2e 에서 어드민 경로 부분만 옮김)
//   a11y.spec(0213) · features.spec(0101 · 0105) · emphasis.spec · light-only.spec(0173) · no-photos.spec(0222) · site-name.spec(0197) · pages.spec(SR-LOG-01 · SR-GEO-01)
import { type Locator, type Page, expect, test } from "@playwright/test";
import { mockGeo, quietSession } from "./helpers";

const PAGES = ["/log", "/geo", "/how"];
const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const box = async (loc: Locator) => {
  const b = await loc.first().boundingBox();
  if (!b) throw new Error("보이지 않음");
  return b;
};
function watchErrors(page: Page) {
  const errs: string[] = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error" && /hydrat|#418|#425|#423/i.test(m.text())) errs.push(m.text());
  });
  return errs;
}

test.describe("제목 구조 · 본문 바로가기 (작업 0213)", () => {
  for (const path of PAGES) {
    test(`${path} — h1 하나 · 섹션 제목은 h2 · 단계를 건너뛰지 않음`, async ({ page }) => {
      // 작업 0352: /geo 는 빌드가 열쇠 없이 401 로 만들어(작업 0326) 섹션 제목(h2)이 브라우저가 /bff/geo 를 받은 뒤에 생김 — 고정 자료로 채움
      if (path === "/geo") {
        await mockGeo(page);
        await quietSession(page);
      }
      await page.goto(path);
      await page.waitForTimeout(300);
      const hs = await page.evaluate(() => [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => ({ level: Number(h.tagName[1]), text: (h.textContent ?? "").trim().slice(0, 24) })));
      expect(hs.filter((h) => h.level === 1), "h1 개수").toHaveLength(1);
      expect(hs.filter((h) => h.level === 2).length, "섹션 제목(h2)").toBeGreaterThan(0);
      let prev = 0;
      for (const h of hs) {
        expect(h.level - prev, `"${h.text}" 앞 단계에서 건너뜀`).toBeLessThanOrEqual(1);
        prev = h.level;
      }
    });

    test(`${path} — 본문 바로가기: 평소엔 숨김 · 첫 Tab 에서 보임 · Enter 로 main 에 초점`, async ({ page }) => {
      await page.goto(path);
      await page.waitForTimeout(300);
      const skip = page.getByRole("link", { name: "본문 바로가기" });
      const hidden = await skip.boundingBox();
      expect((hidden?.width ?? 0) <= 1 && (hidden?.height ?? 0) <= 1, "평소 숨김").toBe(true);
      await page.keyboard.press("Tab");
      await expect(skip).toBeFocused();
      await page.keyboard.press("Enter");
      const active = await page.evaluate(() => ({ tag: document.activeElement?.tagName, id: document.activeElement?.id }));
      expect(active).toEqual({ tag: "MAIN", id: "main" });
      expect(await page.locator("main").count(), "main 은 하나").toBe(1);
    });
  }
});

for (const path of ["/log", "/geo"]) {
  test(`${path} — 페이지 오류 없음 · 가로로 넘치지 않음 · 사진 요청 없음`, async ({ page }) => {
    const errs = watchErrors(page);
    const photos: string[] = [];
    page.on("request", (r) => /\/images\/photos\//.test(r.url()) && photos.push(r.url()));
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(errs).toEqual([]);
    expect(photos, "사진 요청").toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });
}

test.describe("기기 다크 모드 (작업 0173)", () => {
  test.use({ colorScheme: "dark" });
  for (const path of ["/log", "/geo"]) {
    test(`${path} — 기기 다크 모드여도 color-scheme 은 light @design`, async ({ page }) => {
      await page.goto(path);
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe("light");
    });
  }
});

test.describe("탭 제목 (작업 0197)", () => {
  for (const [path, title] of [["/geo", "GEO 측정 · Flapfx"], ["/log", "작업실 · Flapfx"]] as const) {
    test(`${path} 탭 제목 '${title}'`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveTitle(title);
    });
  }
});

test.describe("작업실 /log (SR-LOG-01)", () => {
  test("사이트 상태 점검판이 맨 위 · 지금 화면 표시가 작업실 (작업 0105 · 0303)", async ({ page }) => {
    await page.goto("/log");
    const board = page.locator('section[aria-labelledby="status-title"]');
    await expect(board).toContainText("사이트 상태");
    await expect(board).toContainText(/오늘 환율 수집|상태를 받지 못했습니다/);
    await expect(page.locator('a[aria-current="page"]:visible').first()).toContainText("작업실");
  });

  test("큰 제목은 숫자가 없으면 강조 부품이 없음 (없는 숫자를 칠하지 않음)", async ({ page }) => {
    await page.goto("/log");
    await expect(page.getByRole("heading", { level: 1 }).locator('[data-testid="emph"]')).toHaveCount(0);
  });

  test("큰 제목 · 상태판 · 팀 책상 네 역할 · 작업 흐름 여섯 단계", async ({ page }) => {
    await page.goto("/log");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("AI 에이전트 팀이 이 사이트를 만듭니다");
    await expect(tid(page, "status-board")).toContainText("사이트 상태");
    const desks = tid(page, "team-desks");
    for (const role of ["lead", "builder", "test", "geo"]) await expect(desks).toContainText(role);
    const flow = tid(page, "work-flow");
    for (const step of ["요청 원문 보관", "계획", "테스트 먼저", "구현", "자동 검사 통과", "사람 머지"]) await expect(flow).toContainText(step);
  });

  test("요약 구간 — 이 사이트를 어떻게 만들었나 · 다섯 단계 (작업 0172) · 작업 흐름보다 아래", async ({ page }) => {
    await page.goto("/log");
    const story = tid(page, "site-story");
    await expect(story).toContainText("이 사이트를 어떻게 만들었나");
    await expect(tid(page, "story-step")).toHaveCount(5);
    for (const title of ["문제 정의", "외부 공공 API 연결", "구현 · 운영", "사고 대응", "결과 측정"]) await expect(story).toContainText(title);
    expect((await box(story)).y).toBeGreaterThan((await box(tid(page, "work-flow"))).y);
  });

  test("위에서 아래 순서 — 상태판 → 팀 책상 → 작업 흐름", async ({ page }) => {
    await page.goto("/log");
    const [board, desks, flow] = [await box(tid(page, "status-board")), await box(tid(page, "team-desks")), await box(tid(page, "work-flow"))];
    expect(board.y).toBeLessThan(desks.y);
    expect(desks.y).toBeLessThan(flow.y);
  });
});

test.describe("GEO 측정 /geo (SR-GEO-01)", () => {
  test("큰 제목 · 측정 수치 카드 4개 · 읽는 법", async ({ page }) => {
    await mockGeo(page); // 작업 0352: 수치 카드는 /bff/geo 를 받은 뒤에 그려짐(빌드는 열쇠가 없어 401 · 작업 0326)
    await quietSession(page);
    await page.goto("/geo");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("AI 검색에서 이 사이트가 어떻게 쓰이는지 잽니다");
    const cards = tid(page, "geo-cards");
    for (const label of ["AI 답변 인용", "구글 검색 노출", "AI · 검색 봇 방문", "AI 서비스 유입"]) await expect(cards).toContainText(label);
    await expect(tid(page, "geo-reading")).toContainText("이 수치를 읽는 법");
    await expect(tid(page, "geo-reading")).toContainText("숫자를 추정하지 않습니다");
  });
});

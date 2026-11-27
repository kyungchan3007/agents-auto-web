// 작업 0385 — 첫 페이지 hero 캐러셀 e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   요구(prd R1~R5): 블프 기간엔 두 장(1장 블랙프라이데이 · 2장 여행 타이밍) · 자동 넘김 블프 9초 · 기본 7초 · 입력하면 자동 넘김 영구 취소 · 마우스 올리면 멈춤 · 움직임 줄이기면 자동 없음
//     숫자만(블프 입력칸) · 두 장 높이 같음(JS 로 안 잼) · 영수증 찍는 동안 입력칸 · 글 애니메이션 다시 시작 안 함 · 기간 뒤 버튼 없음 · h1 하나
//   builder 가 다는 표시(data-testid) — 홈 안
//     hero-carousel  바깥 (data-auto="on"|"off" — 자동 넘김이 켜져 있는지 · 입력 · 초점 · 움직임 줄이기면 off)
//     hero-slide ×2  data-slide="bf"|"sea" · data-active="true"|"false" · 안 보이는 장은 inert + aria-hidden=true + visibility:hidden
//     hero-tabs(tablist) · hero-tab ×2(role=tab · data-slide · aria-selected · 글 "블랙프라이데이" | "여행 타이밍")
//     hero-prev · hero-next  양옆 ‹ › (폭 900 이상에서만 보임)
//     hero-progress  고른 알약 안 노란 줄 (자동 넘김이 off 면 없음)
//   기존 표시: home-hero(sea 장) · bf-hero(블프 장) · hero-search · hero-chip · bf-amount · bf-route · bf-receipt …
//   모양 · 위치 · 크기(겹침 · 화면 밖 · 가로 스크롤 · 높이 같음 · 넓은 글꼴)는 별도 측정(.tmp/wt-0385-test) · 여기서는 높이 같음만 세 폭에서 한 번 확인
//   시간: 시계는 page.clock.install 로 블프 기간 안(2026-11-27 낮)에 두고 흐르게 둠 — 실제 시간으로 9초 · 7초를 기다림
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const IN_BF = "2026-11-27T12:00:00+09:00";
const AFTER = "2026-12-02T00:00:00+09:00";
const active = (page: Page) => page.locator('[data-testid="hero-slide"][data-active="true"]');
const slideOf = async (page: Page) => (await active(page).getAttribute("data-slide")) ?? "";
const tab = (page: Page, slide: "bf" | "sea") => page.locator(`[data-testid="hero-tab"][data-slide="${slide}"]`);

const open = async (page: Page, now = IN_BF, reduced = false) => {
  if (reduced) await page.emulateMedia({ reducedMotion: "reduce" });
  await page.clock.install({ time: new Date(now) });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
};
/** 보이는 제목(접근성 트리에 있는 h1) 수 */
const visibleH1 = (page: Page) => page.evaluate(() => [...document.querySelectorAll("h1")].filter((e) => (e as HTMLElement).checkVisibility({ checkVisibilityCSS: true })).length);
const heroH = async (page: Page) => Math.round((await tid(page, "hero-carousel").boundingBox())?.height ?? Number.NaN);

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("flapfx:intro-off", "1"));
});

test.describe("처음 · 자동 넘김 (블프 9초 · 기본 7초)", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 700, "시간을 기다리는 검사는 넓은 화면 프로젝트에서만");

  test("처음 열리면 블프 장 · 알약 '블랙프라이데이'가 눌려 있음 · 자동 넘김 켜짐 · 노란 줄 있음", async ({ page }) => {
    await open(page);
    await expect(tid(page, "hero-slide")).toHaveCount(2);
    expect(await slideOf(page)).toBe("bf");
    await expect(tab(page, "bf")).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, "sea")).toHaveAttribute("aria-selected", "false");
    await expect(tid(page, "hero-carousel")).toHaveAttribute("data-auto", "on");
    await expect(tid(page, "hero-progress")).toHaveCount(1);
  });

  test("블프 9초 뒤 기본 장 · 기본 7초 뒤 다시 블프 장", async ({ page }) => {
    test.setTimeout(60_000);
    await open(page);
    const t0 = Date.now();
    await expect(page.locator('[data-testid="hero-slide"][data-slide="sea"]')).toHaveAttribute("data-active", "true", { timeout: 12_000 });
    const first = Date.now() - t0;
    expect(first, "블프 장 시간(약 9초)").toBeGreaterThan(8_000);
    expect(first).toBeLessThan(11_000);
    await expect(tab(page, "sea")).toHaveAttribute("aria-selected", "true");
    const t1 = Date.now();
    await expect(page.locator('[data-testid="hero-slide"][data-slide="bf"]')).toHaveAttribute("data-active", "true", { timeout: 10_000 });
    const second = Date.now() - t1;
    expect(second, "기본 장 시간(약 7초)").toBeGreaterThan(6_000);
    expect(second).toBeLessThan(9_000);
  });
});

test.describe("입력하면 자동 넘김 취소 (두 장 모두 · 11초 넘지 않음)", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 700, "시간을 기다리는 검사는 넓은 화면 프로젝트에서만");

  test("블프 장 — 입력칸에 쓰면 11초가 지나도 안 넘어가고 노란 줄이 사라짐", async ({ page }) => {
    test.setTimeout(40_000);
    await open(page);
    await tid(page, "bf-amount").click();
    await page.keyboard.type("120");
    await page.mouse.move(2, 2);
    await tid(page, "bf-amount").blur();
    await expect(tid(page, "hero-carousel")).toHaveAttribute("data-auto", "off");
    await expect(tid(page, "hero-progress")).toHaveCount(0);
    await page.waitForTimeout(11_000);
    expect(await slideOf(page)).toBe("bf");
  });

  test("블프 장 — 값을 넣지 않고 초점만 가도 취소 (고르기 칸 · select 도 같음)", async ({ page }) => {
    test.setTimeout(40_000);
    await open(page);
    await tid(page, "bf-route").focus();
    await page.mouse.move(2, 2);
    await expect(tid(page, "hero-carousel")).toHaveAttribute("data-auto", "off");
    await tid(page, "bf-route").blur();
    await page.waitForTimeout(11_000);
    expect(await slideOf(page)).toBe("bf");
  });

  test("기본 장 — 입력창에 쓰면 11초가 지나도 안 넘어감", async ({ page }) => {
    test.setTimeout(40_000);
    await open(page);
    await tab(page, "sea").click();
    expect(await slideOf(page)).toBe("sea");
    await tid(page, "hero-search").click();
    await page.keyboard.type("도쿄");
    await page.mouse.move(2, 2);
    await tid(page, "hero-search").blur();
    await expect(tid(page, "hero-carousel")).toHaveAttribute("data-auto", "off");
    await page.waitForTimeout(11_000);
    expect(await slideOf(page)).toBe("sea");
  });

  test("취소는 영구 — 입력 뒤 초점을 빼도 다시 켜지지 않고 · 알약 버튼으로 넘기는 것은 됨", async ({ page }) => {
    await open(page);
    await tid(page, "bf-amount").fill("50");
    await tid(page, "bf-amount").blur();
    await expect(tid(page, "hero-carousel")).toHaveAttribute("data-auto", "off");
    await tab(page, "sea").click();
    expect(await slideOf(page)).toBe("sea");
    await expect(tid(page, "hero-carousel")).toHaveAttribute("data-auto", "off");
    await expect(tid(page, "hero-progress")).toHaveCount(0);
  });
});

test.describe("움직임 줄이기 · 마우스 올리면 멈춤", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 700, "시간을 기다리는 검사는 넓은 화면 프로젝트에서만");

  test("움직임 줄이기 — 자동 넘김 없음(data-auto=off · 노란 줄 없음) · 10초 뒤에도 같은 장 · 알약은 됨", async ({ page }) => {
    test.setTimeout(40_000);
    await open(page, IN_BF, true);
    await expect(tid(page, "hero-carousel")).toHaveAttribute("data-auto", "off");
    await expect(tid(page, "hero-progress")).toHaveCount(0);
    await page.mouse.move(2, 2);
    await page.waitForTimeout(10_000);
    expect(await slideOf(page)).toBe("bf");
    await tab(page, "sea").click();
    expect(await slideOf(page)).toBe("sea");
  });

  test("마우스를 hero 위에 올리면 멈추고 떼면 남은 시간부터 다시 감", async ({ page }) => {
    test.setTimeout(60_000);
    await open(page);
    const box = await tid(page, "hero-carousel").boundingBox();
    expect(box).toBeTruthy();
    await page.mouse.move((box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + 40);
    await page.waitForTimeout(10_500);
    expect(await slideOf(page), "올려 두는 동안(9초 넘어도) 그대로").toBe("bf");
    await page.mouse.move(2, 2);
    await expect(page.locator('[data-testid="hero-slide"][data-slide="sea"]')).toHaveAttribute("data-active", "true", { timeout: 10_000 });
  });
});

test.describe("알약 · 양옆 버튼 · 밀기", () => {
  test("알약을 누르면 그 장 · aria-selected 가 따라감 · tablist / tab", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page);
    await expect(tid(page, "hero-tabs")).toHaveAttribute("role", "tablist");
    await expect(tab(page, "bf")).toHaveAttribute("role", "tab");
    await expect(tab(page, "bf")).toHaveText("블랙프라이데이");
    await expect(tab(page, "sea")).toHaveText("여행 타이밍");
    await tab(page, "sea").click();
    expect(await slideOf(page)).toBe("sea");
    await expect(tab(page, "sea")).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, "bf")).toHaveAttribute("aria-selected", "false");
    await tab(page, "bf").click();
    expect(await slideOf(page)).toBe("bf");
  });

  test("폭 900 이상 — ‹ › 가 보이고 누르면 다음 · 이전 · 899 이하는 안 보임", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page);
    await expect(tid(page, "hero-next")).toBeVisible();
    await expect(tid(page, "hero-prev")).toBeVisible();
    await tid(page, "hero-next").click();
    expect(await slideOf(page)).toBe("sea");
    await tid(page, "hero-prev").click();
    expect(await slideOf(page)).toBe("bf");
    await tid(page, "hero-prev").click();
    expect(await slideOf(page), "처음에서 이전은 마지막 장으로").toBe("sea");
    await page.setViewportSize({ width: 899, height: 900 });
    await expect(tid(page, "hero-next")).toBeHidden();
    await expect(tid(page, "hero-prev")).toBeHidden();
    await expect(tab(page, "bf")).toBeVisible();
  });

  test("옆으로 50px 이상 밀면 넘어가고 미만이면 그대로 (휴대폰 폭)", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    const box = await tid(page, "hero-carousel").boundingBox();
    const y = (box?.y ?? 0) + 120;
    const drag = async (from: number, to: number) => {
      await page.mouse.move(from, y);
      await page.mouse.down();
      await page.mouse.move((from + to) / 2, y, { steps: 4 });
      await page.mouse.move(to, y, { steps: 4 });
      await page.mouse.up();
    };
    await drag(60, 20); // 왼쪽으로 40px — 넘기지 않음
    expect(await slideOf(page)).toBe("bf");
    await drag(300, 200); // 왼쪽으로 100px — 다음
    expect(await slideOf(page)).toBe("sea");
    await drag(100, 200); // 오른쪽으로 100px — 이전
    expect(await slideOf(page)).toBe("bf");
  });
});

test.describe("접근성 — h1 하나 · 안 보이는 장은 inert", () => {
  test("어느 장이든 보이는 h1 은 하나 · 안 보이는 장은 inert + aria-hidden", async ({ page }) => {
    await open(page);
    for (const s of ["bf", "sea"] as const) {
      await tab(page, s).click();
      expect(await visibleH1(page), `${s} 장에서 보이는 h1`).toBe(1);
      const other = page.locator(`[data-testid="hero-slide"][data-slide="${s === "bf" ? "sea" : "bf"}"]`);
      await expect(other).toHaveAttribute("inert", "");
      await expect(other).toHaveAttribute("aria-hidden", "true");
      await expect(other).toHaveCSS("visibility", "hidden");
      await expect(active(page)).not.toHaveAttribute("inert", /.*/);
    }
  });

  test("안 보이는 장의 입력칸 · 버튼은 Tab 으로 닿지 않음", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page);
    await tab(page, "sea").click();
    const reached = new Set<string>();
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      reached.add(await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset?.testid ?? ""));
    }
    expect(reached.has("bf-amount"), "블프 입력칸은 가려진 장이라 안 닿음").toBe(false);
    expect(reached.has("hero-search")).toBe(true);
  });
});

test.describe("숫자만 — 블프 입력칸", () => {
  test("입력칸 속성 inputmode=numeric · pattern=[0-9]*", async ({ page }) => {
    await open(page);
    await expect(tid(page, "bf-amount")).toHaveAttribute("inputmode", "numeric");
    await expect(tid(page, "bf-amount")).toHaveAttribute("pattern", "[0-9]*");
  });

  const cases: [string, string][] = [["12a3", "123"], ["abc", ""], ["1.5", "15"], ["-20", "20"], ["1,000", "1000"], ["가나12", "12"], ["$250", "250"]];
  for (const [typed, want] of cases) {
    test(`키보드로 ${JSON.stringify(typed)} → ${JSON.stringify(want)}`, async ({ page }) => {
      await open(page);
      const box = tid(page, "bf-amount");
      await box.click();
      await page.keyboard.type(typed);
      await expect(box).toHaveValue(want);
    });
  }

  test("붙여넣기 'ab99cd' → '99'", async ({ page }) => {
    await open(page);
    const box = tid(page, "bf-amount");
    await box.click();
    await box.evaluate((el) => {
      const input = el as HTMLInputElement;
      input.focus();
      const dt = new DataTransfer();
      dt.setData("text/plain", "ab99cd");
      input.dispatchEvent(new ClipboardEvent("paste", { clipboardData: dt, bubbles: true, cancelable: true }));
      // 붙여넣기를 막지 않는 구현이면 값이 그대로 들어가 input 이벤트가 오므로, 값이 안 바뀐 경우를 위해 한 번 더 값을 넣고 이벤트를 보냄
      if (input.value !== "99") {
        input.value = "ab99cd";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });
    await expect(box).toHaveValue("99");
  });

  test("숫자를 넣으면 계산이 됨(약 N원) · 숫자 아닌 글만 넣으면 입력 전 안내", async ({ page }) => {
    await open(page);
    await tid(page, "bf-amount").click();
    await page.keyboard.type("250");
    await expect(tid(page, "bf-krw")).toContainText("원");
    await tid(page, "bf-amount").fill("");
    await page.keyboard.type("abc");
    await expect(tid(page, "bf-amount")).toHaveValue("");
    await expect(tid(page, "bf-hint")).toBeVisible();
  });
});

test.describe("영수증이 찍히는 동안 입력칸 · 글이 다시 그려지지 않음", () => {
  test("입력칸은 같은 요소 · 글 애니메이션 다시 시작 0회 · hero 클래스 바뀜 0회 (4.5초)", async ({ page }) => {
    test.setTimeout(30_000);
    await page.addInitScript(() => {
      (window as unknown as { __ev: number[] }).__ev = [];
      addEventListener("animationstart", (e) => {
        const t = e.target as Element;
        if (t.closest && t.closest('[data-testid="bf-hero"]') && !t.closest('[data-testid="bf-receipt"]')) (window as unknown as { __ev: number[] }).__ev.push(performance.now());
      }, true);
    });
    await open(page);
    const probe = await page.evaluate(() => {
      const input = document.querySelector('[data-testid="bf-amount"]') as HTMLInputElement;
      (window as unknown as { __input: Element }).__input = input;
      const w = window as unknown as { __cls: number; __resize: number };
      w.__cls = 0;
      w.__resize = 0;
      const host = document.querySelector('[data-testid="hero-carousel"]') as HTMLElement;
      new MutationObserver((m) => { w.__cls += m.filter((x) => x.target === host || (x.target as Element).matches?.('[data-testid="bf-hero"]')).length; }).observe(host, { attributes: true, attributeFilter: ["class"], subtree: true });
      new ResizeObserver(() => { w.__resize++; }).observe(input);
      return performance.now();
    });
    await page.waitForTimeout(4_500);
    const r = await page.evaluate((t0) => {
      const w = window as unknown as { __ev: number[]; __input: Element; __cls: number; __resize: number };
      return { same: w.__input === document.querySelector('[data-testid="bf-amount"]') && w.__input.isConnected, anim: w.__ev.filter((t) => t > t0).length, cls: w.__cls, resize: w.__resize - 1 };
    }, probe);
    expect(r.same, "입력칸이 다시 만들어지지 않음").toBe(true);
    expect(r.anim, "글 애니메이션 다시 시작").toBe(0);
    expect(r.cls, "hero class 바뀜").toBe(0);
    expect(r.resize, "입력칸 크기 바뀜").toBeLessThanOrEqual(0);
  });

  test("영수증이 찍히는 동안 입력해도 초점 · 입력한 값이 그대로", async ({ page }) => {
    await open(page);
    const box = tid(page, "bf-amount");
    await box.click();
    await page.keyboard.type("1");
    await page.waitForTimeout(600);
    await page.keyboard.type("2");
    await page.waitForTimeout(600);
    await page.keyboard.type("3");
    await expect(box).toHaveValue("123");
    await expect(box).toBeFocused();
  });
});

test.describe("두 장 높이 같음 — 넘겨도 위아래로 움직이지 않음 (JS 로 재지 않고 CSS 로)", () => {
  for (const [w, h] of [[1440, 900], [820, 1100], [390, 844]] as const) {
    test(`${w}px — 두 장을 넘겨도 hero 높이가 같음 (영수증이 다 찍힌 뒤)`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await open(page);
      await page.waitForTimeout(3_500);
      const heights: number[] = [];
      for (const s of ["bf", "sea", "bf"] as const) {
        await tab(page, s).click();
        await page.waitForTimeout(700);
        heights.push(await heroH(page));
      }
      expect(Math.max(...heights) - Math.min(...heights), `높이 ${heights.join(" · ")}`).toBeLessThanOrEqual(1);
    });
  }
});

test.describe("기간 뒤 — 기본 hero 한 장 · 캐러셀 버튼 없음", () => {
  test("12-02: 기본 hero 만 · 알약 · ‹ › 안 보임 · 블프 장 안 보임 · 보이는 h1 하나 · 자동 넘김 없음", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page, AFTER);
    await expect(page.locator("html")).toHaveAttribute("data-hero", "default");
    await expect(tid(page, "home-hero")).toBeVisible();
    await expect(tid(page, "bf-hero")).toBeHidden();
    await expect(tid(page, "hero-tabs")).toBeHidden();
    await expect(tab(page, "bf")).toBeHidden();
    await expect(tab(page, "sea")).toBeHidden();
    await expect(tid(page, "hero-prev")).toBeHidden();
    await expect(tid(page, "hero-next")).toBeHidden();
    expect(await visibleH1(page)).toBe(1);
    await expect(page.getByRole("tab")).toHaveCount(0); // 접근성 트리에도 알약이 없음
  });

  test("기간 뒤에는 위아래로 움직이는 것 없음 — 20초가 아니라 8초 지켜봐도 기본 장 그대로", async ({ page }) => {
    test.skip(({ viewport }) => (viewport?.width ?? 0) < 700, "넓은 화면에서만");
    test.setTimeout(30_000);
    await open(page, AFTER);
    const before = await heroH(page);
    await page.waitForTimeout(8_000);
    await expect(tid(page, "home-hero")).toBeVisible();
    expect(await heroH(page)).toBe(before);
  });
});

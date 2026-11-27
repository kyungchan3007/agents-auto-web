// 작업 0385 — 첫 페이지 hero 캐러셀 e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   요구(prd R1~R5): 블프 기간엔 두 장(1장 블랙프라이데이 · 2장 여행 타이밍) · 자동 넘김 블프 9초 · 기본 7초 · 입력하면 자동 넘김 영구 취소 · 마우스 올리면 멈춤 · 움직임 줄이기면 자동 없음
//     숫자만(블프 입력칸) · 두 장 높이 같음(JS 로 안 잼) · 영수증 찍는 동안 입력칸 · 글 애니메이션 다시 시작 안 함 · 기간 뒤 버튼 없음 · h1 하나
//   builder 가 다는 표시(data-testid) — 홈 안
//     hero-carousel  바깥 (data-auto="on"|"off" — 자동 넘김이 켜져 있는지 · 입력 · 초점 · 움직임 줄이기면 off)
//     hero-slide ×2  data-slide="bf"|"sea" · data-active="true"|"false" · 안 보이는 장은 inert + aria-hidden=true + visibility:hidden
//     hero-tabs(tablist) · hero-tab ×2(role=tab · data-slide · aria-selected · 글 "블랙프라이데이" | "여행 타이밍")
//     hero-prev · hero-next  양옆 ‹ › (폭 900 이상에서만 보임)
//     hero-progress  고른 알약 안 노란 줄 (자동 넘김이 off 면 없음)
//   기존 표시: home-hero(sea 장) · bf-hero(블프 장) · hero-search · hero-chip · bf-amount · bf-route(통관 고정 글자 · 작업 0389) · bf-receipt …
//   모양 · 위치 · 크기(겹침 · 화면 밖 · 가로 스크롤 · 높이 같음 · 넓은 글꼴)는 별도 측정(.tmp/wt-0385-test) · 여기서는 높이 같음만 세 폭에서 한 번 확인
//   작업 0386: 첫 페이지 헤더(banner) 색이 지금 장 hero 바탕을 따라감 — 블프 장 검정 · 여행 타이밍 장 울트라마린 · 0.5초 함께 바뀜 · 움직임 줄이기면 바로 · 첫 그림부터(자바스크립트가 붙기 전) 검정 · 기간 뒤 울트라마린 · 다른 페이지 그대로 · 글자 · 초점 고리 대비
//   시간: 시계는 page.clock.install 로 블프 기간 안(2026-11-27 낮)에 두고 흐르게 둠 — 실제 시간으로 9초 · 7초를 기다림
import { type Locator, type Page, expect, test } from "@playwright/test";

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

  test("블프 장 — 값을 넣지 않고 입력칸에 초점만 가도 취소 (통관은 글자라 초점이 가지 않음 · 작업 0389)", async ({ page }) => {
    test.setTimeout(40_000);
    await open(page);
    await tid(page, "bf-amount").focus();
    await page.mouse.move(2, 2);
    await expect(tid(page, "hero-carousel")).toHaveAttribute("data-auto", "off");
    await tid(page, "bf-amount").blur();
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
    const cdp = await page.context().newCDPSession(page);
    const drag = async (from: number, to: number) => {
      // 손가락으로 미는 것 — 터치 이벤트(touchstart → touchmove → touchend)
      await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: from, y }] });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: (from + to) / 2, y }] });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: to, y }] });
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
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
      await expect.poll(() => visibleH1(page), { message: `${s} 장에서 보이는 h1(넘김 0.35초 뒤)`, timeout: 3_000 }).toBe(1);
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
    await page.keyboard.insertText("ab99cd"); // 붙여넣기처럼 글을 한꺼번에 넣음(beforeinput · input 이벤트)
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

  test("기간 뒤에는 위아래로 움직이는 것 없음 — 8초 지켜봐도 기본 장 그대로 · 높이 같음", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 700, "넓은 화면에서만");
    test.setTimeout(30_000);
    await open(page, AFTER);
    const before = await heroH(page);
    await page.waitForTimeout(8_000);
    await expect(tid(page, "home-hero")).toBeVisible();
    expect(await heroH(page)).toBe(before);
  });
});

// ── 작업 0386 — 헤더 색이 캐러셀 장을 따라감 ──
const BLUE = "rgb(36, 56, 168)";
const header = (page: Page) => page.getByRole("banner");
const rgbOf = (c: string) => (c.match(/\d+(\.\d+)?/g) ?? ["0", "0", "0"]).slice(0, 3).map(Number);
const lum = ([r, g, b]: number[]) => {
  const f = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a: string, b: string) => {
  const [x, y] = [lum(rgbOf(a)), lum(rgbOf(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
/** 글자 · 고리 색이 oklab · 투명도 섞인 값이어도 바탕 위에 올린 실제 색(rgb)으로 바꿈 */
const onBg = (page: Page, color: string, bg: string) =>
  page.evaluate(([c, b]) => {
    const cv = document.createElement("canvas");
    cv.width = cv.height = 1;
    const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
    ctx.fillStyle = b;
    ctx.fillRect(0, 0, 1, 1);
    ctx.fillStyle = c;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, bl] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r}, ${g}, ${bl})`;
  }, [color, bg]);
const bgOf = (loc: Locator) => loc.evaluate((el) => getComputedStyle(el).backgroundColor);
const near = (a: string, b: string, tol = 14) => rgbOf(a).every((v, i) => Math.abs(v - rgbOf(b)[i]) <= tol);
/** hero 바탕 = 지금 장의 바탕 (캐러셀 바깥 요소의 바탕) */
const heroBg = (page: Page) => bgOf(tid(page, "hero-carousel"));

test.describe("헤더 색 — 지금 장 hero 바탕을 따라감 (작업 0386)", () => {
  test("블프 장: 헤더 바탕 = hero 바탕(검정 · 울트라마린이 아님)", async ({ page }) => {
    await open(page);
    await page.waitForTimeout(700);
    const h = await bgOf(header(page));
    const hero = await heroBg(page);
    expect(h, "헤더가 검정 계열").not.toBe(BLUE);
    expect(near(h, hero, 2), `헤더 ${h} · hero ${hero}`).toBe(true);
    expect(lum(rgbOf(h)), "아주 어두운 바탕").toBeLessThan(0.02);
  });

  test("여행 타이밍 장으로 넘기면 헤더 · hero 둘 다 울트라마린 · 다시 블프로 오면 둘 다 검정", async ({ page }) => {
    await open(page);
    await tab(page, "sea").click();
    await expect.poll(() => bgOf(header(page)), { timeout: 3_000 }).toBe(BLUE);
    await expect.poll(() => heroBg(page), { timeout: 3_000 }).toBe(BLUE);
    await tab(page, "bf").click();
    await expect.poll(async () => lum(rgbOf(await bgOf(header(page)))), { timeout: 3_000 }).toBeLessThan(0.02);
    await expect.poll(async () => near(await bgOf(header(page)), await heroBg(page), 2), { timeout: 3_000 }).toBe(true); // 전환이 끝나면 같은 색
  });

  test("넘어가는 0.5초 동안 헤더와 hero 가 같이 바뀜 (중간에도 색 차이가 작음)", async ({ page }) => {
    test.skip((page.viewportSize()?.width ?? 0) < 700, "넓은 화면에서만");
    await open(page);
    await page.waitForTimeout(600);
    await tab(page, "sea").click();
    const gaps: number[] = [];
    for (let i = 0; i < 6; i++) {
      const [h, hero] = [rgbOf(await bgOf(header(page))), rgbOf(await heroBg(page))];
      gaps.push(Math.max(...h.map((v, k) => Math.abs(v - hero[k]))));
      await page.waitForTimeout(90);
    }
    expect(Math.max(...gaps), `헤더 · hero 색 차이 ${gaps.join(" · ")}`).toBeLessThanOrEqual(40);
  });

  test("움직임 줄이기 — 장을 넘기면 헤더 색도 바로 바뀜(전환 없음)", async ({ page }) => {
    await open(page, IN_BF, true);
    await page.waitForTimeout(300);
    await tab(page, "sea").click();
    await page.waitForTimeout(120);
    expect(await bgOf(header(page))).toBe(BLUE);
    await tab(page, "bf").click();
    await page.waitForTimeout(120);
    expect(lum(rgbOf(await bgOf(header(page))))).toBeLessThan(0.02);
  });

  test("자바스크립트가 붙기 전 첫 그림부터 헤더 검정 (앱 스크립트를 막고 봄)", async ({ page }) => {
    await page.route("**/_next/static/**/*.js", (route) => route.abort());
    await page.clock.install({ time: new Date(IN_BF) });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-hero", "bf"); // 머리 안 작은 스크립트가 이미 정함
    expect(await page.evaluate(() => (document.querySelector('[data-testid="hero-slide"]') as HTMLElement | null)?.dataset.active ?? "ssr"), "아직 붙지 않음(서버 첫 그림)").not.toBe("");
    const h = await bgOf(header(page));
    expect(h, "첫 그림의 헤더 바탕").not.toBe(BLUE);
    expect(lum(rgbOf(h)), "검정 계열").toBeLessThan(0.02);
  });

  test("다른 페이지(/flights · /prices · /calc · /currencies/USD) 헤더는 늘 울트라마린 — 블프 기간에도 그대로", async ({ page }) => {
    await page.clock.install({ time: new Date(IN_BF) });
    for (const path of ["/flights", "/prices", "/calc", "/currencies/USD"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      expect(await bgOf(header(page)), `${path} 헤더`).toBe(BLUE);
    }
  });

  test("기간 뒤(12-02) 첫 페이지 헤더는 울트라마린 · hero 도 울트라마린", async ({ page }) => {
    await open(page, AFTER);
    await page.waitForTimeout(700);
    expect(await bgOf(header(page))).toBe(BLUE);
    expect(await heroBg(page)).toBe(BLUE);
  });

  test("헤더 글자 · 초점 고리가 두 바탕 위에서 읽힘 — 글자 대비 4.5:1 · 고리 대비 3:1 이상", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await open(page);
    for (const s of ["bf", "sea"] as const) {
      await tab(page, s).click();
      await page.waitForTimeout(800);
      await page.evaluate(() => window.scrollTo(0, 0));
      const bg = await bgOf(header(page));
      const links = header(page).getByRole("link");
      const n = await links.count();
      expect(n, "헤더 링크").toBeGreaterThan(2);
      for (let i = 0; i < n; i++) {
        const el = links.nth(i);
        if (!(await el.isVisible())) continue;
        const color = await el.evaluate((e) => getComputedStyle(e).color);
        // 로고(노란 fx 가 섞인 그림 글자)는 큰 글자 기준 3:1
        const isLogo = (await el.getAttribute("href")) === "/";
        expect(contrast(await onBg(page, color, bg), bg), `${s} 장 헤더 링크 ${i} 글자 ${color} / 바탕 ${bg}`).toBeGreaterThanOrEqual(isLogo ? 3 : 4.5);
      }
      // 초점 고리 — 헤더 링크에 키보드로 초점이 갔을 때 고리 색 대비
      await page.keyboard.press("Shift"); // 키보드 조작이 마지막이어야 :focus-visible 고리가 그려짐
      await header(page).getByRole("link").nth(1).focus();
      const ring = await page.evaluate(async () => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || !el.closest("header")) return null;
        await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
        const cs = getComputedStyle(el);
        return { style: cs.outlineStyle, color: cs.outlineColor };
      });
      expect(ring, `${s} 장에서 헤더 링크에 키보드 초점`).not.toBeNull();
      expect(ring?.style).not.toBe("none");
      expect(contrast(await onBg(page, ring?.color ?? "rgb(0,0,0)", bg), bg), `${s} 장 고리 ${ring?.color} / 바탕 ${bg}`).toBeGreaterThanOrEqual(3);
    }
  });
});

// ── 작업 0389 — 블프 hero 높이 고정 (영수증이 찍혀도 hero · 아래 화면이 밀리지 않음) ──
test.describe("높이 고정 — 첫 화면부터 영수증이 다 찍힐 때까지 hero 높이 변화 0 (작업 0389)", () => {
  for (const [w, h] of [[320, 700], [390, 844], [768, 1000], [1000, 800], [1440, 900], [1600, 900]] as const) {
    test(`${w}px — 첫 그림부터 7초 동안 hero 높이 · 아래 구역 위치 변화 0`, async ({ page }) => {
      test.setTimeout(40_000);
      await page.setViewportSize({ width: w, height: h });
      await page.addInitScript(() => {
        const w = window as unknown as { __hh: number[]; __below: number[] };
        w.__hh = [];
        w.__below = [];
        const t0 = performance.now();
        const tick = () => {
          const car = document.querySelector('[data-testid="hero-carousel"]');
          const below = document.querySelector('[data-testid="year-bars"]')?.closest("section") ?? null; // hero 바로 아래 구역(12달 막대)
          if (car) w.__hh.push(Math.round(car.getBoundingClientRect().height * 10) / 10);
          if (below) w.__below.push(Math.round((below.getBoundingClientRect().top + window.scrollY) * 10) / 10);
          if (performance.now() - t0 < 7000) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      await page.clock.install({ time: new Date(IN_BF) });
      await page.goto("/", { waitUntil: "commit" });
      await page.waitForTimeout(7_300);
      const r = await page.evaluate(() => {
        const w = window as unknown as { __hh: number[]; __below: number[] };
        return { hh: w.__hh, below: w.__below };
      });
      expect(r.hh.length, "잰 횟수").toBeGreaterThan(30);
      expect(Math.max(...r.hh) - Math.min(...r.hh), `hero 높이 ${[...new Set(r.hh)].join(" · ")}`).toBeLessThanOrEqual(1);
      expect(Math.max(...r.below) - Math.min(...r.below), `아래 구역 위치 ${[...new Set(r.below)].join(" · ")}`).toBeLessThanOrEqual(1);
    });
  }

  for (const [w, h] of [[320, 700], [390, 844], [768, 1000], [1000, 800], [1440, 900], [1600, 900]] as const) {
    test(`${w}px — 두 장(블프 · 여행 타이밍) hero 높이가 같음`, async ({ page }) => {
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

  test("블프 장에 select · combobox 가 없음 (통관은 글자)", async ({ page }) => {
    await open(page);
    await expect(page.locator('[data-testid="bf-hero"] select')).toHaveCount(0);
    await expect(page.locator('[data-testid="bf-hero"]').getByRole("combobox")).toHaveCount(0);
  });
});

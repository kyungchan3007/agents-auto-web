// 작업 0381 — 블랙프라이데이 hero e2e (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   요구(prd): 기간 판정은 브라우저 지금 시각 · 깜빡임 없음(서버 HTML 에 두 hero · 첫 그림 전에 html 의 data-hero 가 정해짐) · 새 문구 · 계산기 · 입력값은 보내거나 저장하지 않음 · 영수증 모션 한 번 · 움직임 줄이기
//   모양 · 위치 · 크기는 새 테스트 없음(작업 종류 ②) — 반응형 겹침 · 넘침은 별도 측정(.tmp/wt-0381-test)
//
//   builder 가 다는 표시(data-testid) — 홈 안
//     bf-hero          블프 hero 전체 (기간 밖이면 화면에 보이지 않음 · display none)
//     bf-label         제목 위 노란 알약
//     bf-title         제목 (h1 · "$200" 은 data-testid="bf-accent" 로 감싸 노랑)
//     bf-lede · bf-tag 한 줄 · 꼬리표
//     bf-amount        금액 입력 (role=textbox · 접근 이름 "금액(달러)" · inputmode decimal)
//     bf-route         선택칸 <select> (옵션 "미국 · 목록통관" = us-list · "그 밖 나라 · 일반통관" = other)
//     bf-krw · bf-judge   "약 N원" · 판정 글(면세 · 한도까지 … / 한도 초과 …) · 틀린 입력이면 bf-error 만
//     bf-hint · bf-bar    입력 전 안내 · 한도 막대(data-over="true|false")
//     bf-source · bf-note 환율 기준 · 출처 줄 · 합산 안내 작은 글
//     bf-receipt          영수증(aria-hidden 이어도 됨) · bf-receipt-item(줄) · bf-receipt-stamp(도장 · 글 "면세" | "과세") · bf-receipt-note
//   html 속성: <html data-hero="bf|default"> — head 의 작은 인라인 스크립트가 첫 그림 전에 지금 시각으로 정함 (CSS 로 하나만 보임)
//   기본 hero(home-hero)는 기간 안에서 화면에 보이지 않음 · 기간 밖에서 보임 (둘 다 서버 HTML 에 있음)
import { type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const BF_LAST = "2026-12-01T16:59:59+09:00";
const BF_END = "2026-12-01T17:00:00+09:00";
const open = async (page: Page, now: string) => {
  await page.clock.install({ time: new Date(now) });
  await page.goto("/");
};
const type = async (page: Page, s: string) => {
  await tid(page, "bf-amount").fill(s);
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("flapfx:intro-off", "1"));
});

test.describe("기간 — 브라우저 지금 시각으로 고름", () => {
  test("끝 1초 전(2026-12-01 16:59:59 KST) — 블프 hero 만 보임", async ({ page }) => {
    await open(page, BF_LAST);
    await expect(page.locator("html")).toHaveAttribute("data-hero", "bf");
    await expect(tid(page, "bf-hero")).toBeVisible();
    await expect(tid(page, "home-hero")).toBeHidden();
  });

  test("끝 시각 정각(17:00:00 KST) — 기본 hero 만 보임", async ({ page }) => {
    await open(page, BF_END);
    await expect(page.locator("html")).toHaveAttribute("data-hero", "default");
    await expect(tid(page, "home-hero")).toBeVisible();
    await expect(tid(page, "bf-hero")).toBeHidden();
  });

  test("배포 즉시(11-26) 블프 · 끝난 뒤(12-02 · 다음 해) 기본", async ({ page }) => {
    await open(page, "2026-11-26T20:00:00+09:00");
    await expect(page.locator("html")).toHaveAttribute("data-hero", "bf");
    for (const now of ["2026-12-02T00:00:00+09:00", "2027-11-27T00:00:00+09:00"]) {
      const p = await page.context().newPage();
      await p.addInitScript(() => localStorage.setItem("flapfx:intro-off", "1"));
      await p.clock.install({ time: new Date(now) });
      await p.goto("/");
      await expect(p.locator("html"), now).toHaveAttribute("data-hero", "default");
      await expect(p.locator('[data-testid="home-hero"]'), now).toBeVisible();
      await p.close();
    }
  });

  test("깜빡임 없음 — 서버가 준 HTML 에 두 hero 가 모두 있고 지금 시각 판정 스크립트가 들어 있음", async ({ page }) => {
    const h = await (await page.request.get("/")).text();
    expect(h, "블프 hero").toContain("블랙프라이데이 11.27 · 사이버먼데이 11.30");
    expect(h, "기본 hero").toMatch(/data-testid="home-hero"/);
    expect(h, "첫 그림 전에 data-hero 를 정하는 스크립트").toMatch(/data-hero|dataset\.hero/);
  });

  test("첫 그림 전에 정해짐 — 문서 로드 직후 첫 확인에서 이미 data-hero 가 있음", async ({ page }) => {
    await page.clock.install({ time: new Date(BF_LAST) });
    const seen: string[] = [];
    await page.exposeFunction("__seen", (v: string) => seen.push(v));
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => (window as unknown as { __seen: (v: string) => void }).__seen(document.documentElement.getAttribute("data-hero") ?? "none"));
    });
    await page.goto("/");
    expect(seen[0], "DOMContentLoaded 때 이미 정해져 있음 (react 가 붙은 뒤가 아님)").toBe("bf");
  });
});

test.describe("문구 — 정한 글 그대로 (새 문구 · 블프 안)", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "2026-11-28T12:00:00+09:00");
  });

  test("라벨 · 제목($200 노랑) · 한 줄 · 꼬리표", async ({ page }) => {
    await expect(tid(page, "bf-label")).toHaveText("블랙프라이데이 11.27 · 사이버먼데이 11.30");
    await expect(tid(page, "bf-title")).toHaveText(/\$200 넘기 전에\s*먼저 계산하세요\./);
    await expect(tid(page, "bf-accent")).toHaveText("$200");
    const [accent, sun] = await Promise.all([
      tid(page, "bf-accent").evaluate((el) => getComputedStyle(el).color),
      tid(page, "bf-label").evaluate((el) => getComputedStyle(el).backgroundColor),
    ]);
    expect(accent, "제목 $200 과 라벨 알약은 같은 해 노랑").toBe(sun);
    await expect(tid(page, "bf-lede")).toHaveText("미국 직구는 $200까지 면세입니다.");
    await expect(tid(page, "bf-tag")).toHaveText("관세청 · 목록통관 기준");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  });

  test("입력 전 — 안내 글 · 아래 작은 글 · 선택칸 두 값", async ({ page }) => {
    await expect(tid(page, "bf-hint")).toHaveText("원화로 얼마인지 바로 봅니다");
    await expect(tid(page, "bf-note")).toContainText("같은 판매자에게 같은 날 산 물건은 합쳐서 봅니다 · 예상 금액");
    await expect(tid(page, "bf-route").locator("option")).toHaveText(["미국 · 목록통관", "그 밖 나라 · 일반통관"]);
    await expect(tid(page, "bf-route")).toHaveValue("us-list");
    await expect(tid(page, "bf-krw")).toHaveCount(0);
  });

  test("긴 줄표(—)가 없음", async ({ page }) => {
    expect(await tid(page, "bf-hero").innerText()).not.toMatch(/[—–]/);
  });
});

test.describe("계산기 — 입력 즉시 (한도는 import-calc rules 와 같음)", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "2026-11-28T12:00:00+09:00");
  });

  test("미국 180 → 약 N원 · 면세 · 한도까지 $20 남음 · 막대 한도 안", async ({ page }) => {
    await type(page, "180");
    await expect(tid(page, "bf-krw")).toHaveText(/^약 [\d,]+원$/);
    await expect(tid(page, "bf-judge")).toHaveText("면세 · 한도까지 $20 남음");
    await expect(tid(page, "bf-bar")).toHaveAttribute("data-over", "false");
    await expect(tid(page, "bf-hint")).toHaveCount(0);
  });

  test("미국 250 → 한도 초과 $50 · 관부가세 대상 · 막대 한도 밖", async ({ page }) => {
    await type(page, "250");
    await expect(tid(page, "bf-judge")).toHaveText("한도 초과 $50 · 관부가세 대상");
    await expect(tid(page, "bf-bar")).toHaveAttribute("data-over", "true");
  });

  test("한도와 같은 200 은 면세 · 남음 $0", async ({ page }) => {
    await type(page, "200");
    await expect(tid(page, "bf-judge")).toHaveText("면세 · 한도까지 $0 남음");
  });

  test("그 밖 나라로 바꾸면 한도 150 — 160 은 한도 초과 $10", async ({ page }) => {
    await tid(page, "bf-route").selectOption("other");
    await type(page, "160");
    await expect(tid(page, "bf-judge")).toHaveText("한도 초과 $10 · 관부가세 대상");
    await tid(page, "bf-route").selectOption("us-list");
    await expect(tid(page, "bf-judge")).toHaveText("면세 · 한도까지 $40 남음");
  });

  test("금액을 지우면 다시 안내 글", async ({ page }) => {
    await type(page, "180");
    await expect(tid(page, "bf-krw")).toBeVisible();
    await type(page, "");
    await expect(tid(page, "bf-hint")).toHaveText("원화로 얼마인지 바로 봅니다");
    await expect(tid(page, "bf-krw")).toHaveCount(0);
  });

  test("틀린 입력(글자 · 0 · 음수)은 결과 숫자 대신 안내", async ({ page }) => {
    await type(page, "abc");
    await expect(tid(page, "bf-error")).toHaveText("물건 값은 0 이상의 숫자만 됩니다");
    await expect(tid(page, "bf-krw")).toHaveCount(0);
    await expect(tid(page, "bf-judge")).toHaveCount(0);
    await type(page, "0");
    await expect(tid(page, "bf-error")).toHaveText("물건 값은 0보다 커야 합니다");
    await type(page, "-5");
    await expect(tid(page, "bf-error")).toBeVisible();
    await expect(tid(page, "bf-krw")).toHaveCount(0);
  });

  test("환율 기준 · 출처 줄 — 과세환율이면 관세청 · 없으면 은행 예상 금액", async ({ page }) => {
    await type(page, "100");
    await expect(tid(page, "bf-source")).toHaveText(/관세청 과세환율 · \d{4}-\d{2}-\d{2} 주 고시|수출입은행 환율로 계산한 예상 금액 \(이번 주 과세환율 없음\)/);
  });
});

test.describe("입력값은 보내거나 저장하지 않음 (IMP-01)", () => {
  test("금액을 넣어도 새 요청 없음 · 저장소에 금액 없음 · 주소에 금액 없음", async ({ page }) => {
    await open(page, "2026-11-28T12:00:00+09:00");
    await expect(tid(page, "bf-amount")).toBeVisible();
    const sent: string[] = [];
    page.on("request", (r) => sent.push(`${r.method()} ${r.url()} ${r.postData() ?? ""}`));
    await type(page, "187654");
    await expect(tid(page, "bf-krw")).toBeVisible();
    await page.waitForTimeout(500);
    expect(sent.filter((s) => s.includes("187654")), "금액을 담은 요청").toEqual([]);
    expect(sent.filter((s) => s.startsWith("POST")), "보낸 POST").toEqual([]);
    const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }) + document.cookie);
    expect(stored).not.toContain("187654");
    expect(page.url()).not.toContain("187654");
  });
});

test.describe("영수증 — 한 번만 찍힘 · 면세 · 면세 · 과세", () => {
  test.beforeEach(async ({ page }) => {
    await open(page, "2026-11-28T12:00:00+09:00");
  });

  test("품목 3줄 · 맨 아래 글 · 머리 글", async ({ page }) => {
    const receipt = tid(page, "bf-receipt");
    await expect(receipt).toContainText("FLAPFX DIRECT");
    await expect(receipt).toContainText("해외 직구 · 장바구니 확인");
    await expect(tid(page, "bf-receipt-item")).toHaveCount(3);
    await expect(tid(page, "bf-receipt-item").nth(0)).toContainText("에스프레소 머신");
    await expect(tid(page, "bf-receipt-item").nth(0)).toContainText("$149");
    await expect(tid(page, "bf-receipt-item").nth(1)).toContainText("원두");
    await expect(tid(page, "bf-receipt-item").nth(1)).toContainText("$38");
    await expect(tid(page, "bf-receipt-item").nth(2)).toContainText("머그");
    await expect(tid(page, "bf-receipt-item").nth(2)).toContainText("$24");
    await expect(tid(page, "bf-receipt-note")).toHaveText("예상 금액 · 실제 세액은 관세청 기준");
  });

  test("도장이 면세 → 면세 → 과세 차례로 바뀌고 마지막에 과세로 끝남 (시계를 앞으로 돌려 확인)", async ({ page }) => {
    const stamp = tid(page, "bf-receipt-stamp");
    const seen: string[] = [];
    const read = async () => {
      const t = (await stamp.last().textContent({ timeout: 500 }).catch(() => null))?.trim() ?? "";
      if (t && seen[seen.length - 1] !== t) seen.push(t);
    };
    for (let i = 0; i < 40; i++) {
      await page.clock.runFor(250);
      await read();
    }
    expect(seen, "찍힌 도장 차례(같은 글이 이어지면 한 번으로 셈)").toEqual(["면세", "과세"]);
    expect(seen[seen.length - 1], "마지막 도장").toBe("과세");
  });

  test("반복하지 않음 — 다 찍힌 뒤 한참 지나도 품목 3줄 · 마지막 도장 그대로", async ({ page }) => {
    await page.clock.runFor(15_000);
    await expect(tid(page, "bf-receipt-item")).toHaveCount(3);
    await expect(tid(page, "bf-receipt-stamp").last()).toHaveText("과세");
    await page.clock.runFor(30_000);
    await expect(tid(page, "bf-receipt-item")).toHaveCount(3);
    await expect(tid(page, "bf-receipt-stamp").last()).toHaveText("과세");
  });
});

test.describe("움직임 줄이기 — 다 찍힌 상태 + 마지막 도장", () => {
  test("시계를 돌리지 않아도 바로 품목 3줄 · 도장 과세", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, "2026-11-28T12:00:00+09:00");
    await expect(tid(page, "bf-receipt-item")).toHaveCount(3);
    await expect(tid(page, "bf-receipt-stamp").last()).toHaveText("과세");
  });
});

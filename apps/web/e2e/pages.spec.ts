// 나머지 화면 — 작업 0170 (디자인 변경 ③) · 실행은 lead 가 PR 직전에 (빌드한 사이트를 읽음 · 단위 테스트가 아니라 여기서는 문구 · 쌓임 순서 · 연결만)
// 값은 날마다 · 자료 유무에 따라 달라서 동작 · 순서 · 문구만 봄
//   builder · geo 가 다는 표시: src/shared/pages-redesign.test.ts 머리 주석의 data-testid 목록
//   모바일 쌓임 순서(Figma 설명)는 "휴대폰" 프로젝트에서만 · 2단 배치(입력 왼쪽 · 결과 오른쪽 등)는 "넓은 화면" 프로젝트에서만
import { type Locator, type Page, expect, test } from "@playwright/test";
import { openMenuIfCollapsed } from "./helpers";

const box = async (loc: Locator) => {
  const b = await loc.first().boundingBox();
  if (!b) throw new Error("화면에 없음");
  return b;
};
const isPhone = () => test.info().project.name === "휴대폰";
const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);

test.describe("통화 /currencies/USD (SR-CUR-01)", () => {
  test("목록 · 상세 · 환산기 · 물가 링크", async ({ page }) => {
    await page.goto("/currencies/USD");
    await expect(tid(page, "currency-list")).toContainText("둘러보기");
    const detail = tid(page, "currency-detail");
    await expect(detail).toContainText("USD");
    await expect(detail).toContainText("실제로 바꿀 때");
    await expect(detail.getByRole("link", { name: /이 통화 쓰는 나라 물가 보기/ })).toHaveAttribute("href", "/prices?currency=USD");
    // 1년 최저 · 최고 · 평균은 받은 값으로만 — 있으면 세 칸 모두 보임
    for (const label of ["1년 최저", "1년 최고", "1년 평균"]) await expect(detail).toContainText(label);
  });

  test("기준일 · 출처 한 줄은 통화 상세에 그대로 (홈에서는 뺌 · 작업 0174)", async ({ page }) => {
    await page.goto("/currencies/USD");
    await expect(tid(page, "currency-detail")).toContainText(/\d{4}-\d{2}-\d{2} (한국수출입은행|Frankfurter)/);
  });

  test("판정 핀은 쌈 · 보통 · 비쌈 글자와 함께 (색만으로 전하지 않음)", async ({ page }) => {
    await page.goto("/currencies/USD");
    await expect(tid(page, "currency-detail")).toContainText(/쌈|보통|비쌈|신호/);
  });

  test("그래프 최고 · 최저 금액 — 카드와 같은 값 · 기간을 바꾸면 그 기간 값 · 라벨이 그래프 안 (작업 0175)", async ({ page }) => {
    await page.goto("/currencies/USD");
    const detail = tid(page, "currency-detail");
    const group = page.getByRole("group", { name: "기간" });
    const num = (t: string | null) => Number((t ?? "").replace(/[^\d.]/g, ""));
    await group.getByRole("button", { name: "1년" }).click();
    const maxLabel = detail.locator('[data-testid="extreme-max"]');
    const minLabel = detail.locator('[data-testid="extreme-min"]');
    await expect(maxLabel).toHaveText(/^최고 [\d,]+(\.\d+)?원$/);
    await expect(minLabel).toHaveText(/^최저 [\d,]+(\.\d+)?원$/);
    const [max1y, min1y] = [num(await maxLabel.textContent()), num(await minLabel.textContent())];
    // 위 '1년 최저 · 최고' 카드와 같은 값 (카드는 정수 표기일 수 있어 0.6 이하 차이 허용)
    const card = async (label: string) => num((await detail.getByText(label, { exact: true }).locator("xpath=..").textContent())?.replace(label, "") ?? "");
    expect(Math.abs(max1y - (await card("1년 최고")))).toBeLessThanOrEqual(0.6);
    expect(Math.abs(min1y - (await card("1년 최저")))).toBeLessThanOrEqual(0.6);
    // 1개월로 바꾸면 그 기간의 최고 · 최저 (1년 범위 안 · 같거나 좁아짐)
    await group.getByRole("button", { name: "1개월" }).click();
    await expect(page.getByRole("img", { name: /^1개월 흐름 — / })).toBeVisible();
    const [max1m, min1m] = [num(await maxLabel.textContent()), num(await minLabel.textContent())];
    expect(max1m).toBeLessThanOrEqual(max1y + 0.01);
    expect(min1m).toBeGreaterThanOrEqual(min1y - 0.01);
    expect(max1m).toBeGreaterThanOrEqual(min1m);
    // 라벨이 그래프(svg)를 벗어나 잘리지 않음 · 두 라벨이 서로 안 겹침 (휴대폰 포함)
    const svg = await detail.getByRole("img", { name: /흐름 — / }).boundingBox();
    const [a, b] = [await maxLabel.boundingBox(), await minLabel.boundingBox()];
    if (!svg || !a || !b) throw new Error("그래프 · 라벨이 없음");
    for (const [name, box] of [["최고", a], ["최저", b]] as const) {
      expect(box.x, `${name} 왼쪽`).toBeGreaterThanOrEqual(svg.x - 1);
      expect(box.x + box.width, `${name} 오른쪽`).toBeLessThanOrEqual(svg.x + svg.width + 1);
    }
    expect(a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height, "두 라벨이 겹침").toBe(false);
  });

  test("배치 — 넓은 화면은 목록이 상세 왼쪽 · 휴대폰은 목록이 위 · 상세가 아래", async ({ page }) => {
    await page.goto("/currencies/USD");
    const list = await box(tid(page, "currency-list"));
    const detail = await box(tid(page, "currency-detail"));
    if (isPhone()) expect(list.y).toBeLessThan(detail.y);
    else expect(list.x).toBeLessThan(detail.x);
  });
});

test.describe("여행 타이밍 /flights (SR-TRV-01)", () => {
  test("큰 문장 · 지수가 없으면 '준비 중' · 그래프 · 비행기 · 카드 없음 / 있으면 모두 보임", async ({ page }) => {
    await page.goto("/flights");
    const title = page.getByRole("heading", { level: 1 });
    await expect(title).toBeVisible();
    if ((await title.textContent())?.includes("준비 중")) {
      await expect(tid(page, "travel-graph")).toHaveCount(0);
      await expect(tid(page, "plane-route")).toHaveCount(0);
      await expect(tid(page, "yoy-cards")).toHaveCount(0);
    } else {
      await expect(tid(page, "travel-graph")).toBeVisible();
      await expect(tid(page, "plane-route")).toHaveCount(1);
      await expect(tid(page, "travel-legend")).toContainText("국제항공료");
    }
  });

  test("휴대폰 — 그래프 아래 범례 · 그 아래 카드 (지수가 있을 때)", async ({ page }) => {
    test.skip(!isPhone(), "휴대폰 전용");
    await page.goto("/flights");
    if ((await tid(page, "travel-graph").count()) === 0) return;
    const [graph, legend, cards] = [await box(tid(page, "travel-graph")), await box(tid(page, "travel-legend")), await box(tid(page, "yoy-cards"))];
    expect(graph.y).toBeLessThan(legend.y);
    expect(legend.y).toBeLessThan(cards.y);
  });
});

test.describe("여행 물가 /prices (SR-PRC-01)", () => {
  test("큰 문장 · 물가 구간 · 하루 예산", async ({ page }) => {
    await page.goto("/prices");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const bands = tid(page, "price-bands");
    await expect(bands).toBeVisible();
    for (const label of ["한국보다 싼 곳", "비슷한 곳", "한국보다 비싼 곳"]) await expect(bands).toContainText(label);
    await expect(tid(page, "budget")).toContainText("여행 하루 예산");
  });
});

// 작업 0193 — 통화 상세의 "이 통화 쓰는 나라 물가 보기" 를 누르면 그 통화를 쓰는 나라만 보임 → 전체 보기로 돌아감
test.describe("여행 물가 — 통화로 거르기 (작업 0193)", () => {
  const bandsOf = (page: Page) => tid(page, "price-bands");
  const filtered = (page: Page) => page.getByTestId("price-filter");
  // 전체 목록은 구간마다 나라 2곳만 보이고 나머지는 "나라 더 보기" 로 펼침 — 전체 목록 확인은 펼친 뒤에
  const openAll = async (page: Page) => {
    await bandsOf(page).getByRole("button", { name: /나라 더 보기/ }).click();
    await expect(bandsOf(page).getByRole("button", { name: "나라 접기" })).toBeVisible();
  };

  test("상세 → 링크 → 그 통화 나라만 · 안내 · 전체 보기", async ({ page }) => {
    await page.goto("/currencies/JPY");
    await tid(page, "currency-detail").getByRole("link", { name: /이 통화 쓰는 나라 물가 보기/ }).click();
    await expect(page).toHaveURL(/\/prices\/?\?currency=JPY$/);
    await expect(filtered(page)).toContainText("엔화를 쓰는 나라 1곳");
    await expect(bandsOf(page)).toContainText("일본");
    await expect(bandsOf(page)).not.toContainText("태국");
    await expect(bandsOf(page)).not.toContainText("미국");
    await filtered(page).getByRole("link", { name: /전체 보기/ }).click();
    await expect(page).toHaveURL(/\/prices\/?$/);
    await expect(filtered(page)).toHaveCount(0);
    await openAll(page);
    await expect(bandsOf(page)).toContainText("태국");
    await expect(bandsOf(page)).toContainText("일본");
  });

  test("유로 — 유로 나라가 여럿 보이고 일본은 안 보임 · 자료 없는 나라는 '물가 자료 없음'", async ({ page }) => {
    await page.goto("/prices?currency=EUR");
    await expect(filtered(page)).toContainText(/유로를 쓰는 나라 \d+곳/);
    await expect(bandsOf(page)).toContainText("프랑스");
    await expect(bandsOf(page)).toContainText("독일");
    await expect(bandsOf(page)).not.toContainText("일본");
    // 핀란드는 자료가 있으면 목록에, 없으면 "물가 자료 없음" 으로 — 둘 중 하나로는 반드시 보임
    // 국기의 <title>핀란드 국기</title> 가 먼저 잡히지 않게 글자 그대로("핀란드") 만 (작업 0199)
    await expect(page.getByText("핀란드", { exact: true }).first()).toBeVisible();
  });

  test("모르는 코드 — 거르지 않고 전체 + 안내", async ({ page }) => {
    await page.goto("/prices?currency=ZZZ");
    await expect(filtered(page)).toContainText("전체");
    await openAll(page);
    await expect(bandsOf(page)).toContainText("일본");
    await expect(bandsOf(page)).toContainText("태국");
  });

  test("주소에 통화가 없으면 안내 없이 전체", async ({ page }) => {
    await page.goto("/prices");
    await expect(filtered(page)).toHaveCount(0);
    await openAll(page);
    await expect(bandsOf(page)).toContainText("일본");
  });
});

test.describe("직구 계산 /calc (SR-CALC-01)", () => {
  async function fill(page: Page, price: string, extra: { duty?: string } = {}) {
    const input = tid(page, "calc-input");
    await input.getByLabel(/물건 값/).fill(price);
    if (extra.duty) await input.getByLabel(/관세율/).fill(extra.duty);
  }

  test("한도 안 — 큰 문장 '세금 없이 받습니다' · 노란 도장 '면세 한도 안'", async ({ page }) => {
    await page.goto("/calc");
    await fill(page, "180");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("세금 없이 받습니다");
    await expect(tid(page, "calc-result").getByRole("status")).toContainText("면세 한도 안");
    await expect(tid(page, "calc-result")).toContainText("예상 금액");
  });

  test("한도 넘음 + 관세율 — 큰 문장 '관세 · 부가세 약 ○원이 붙습니다' · 도장 없음", async ({ page }) => {
    await page.goto("/calc");
    await fill(page, "250", { duty: "8" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/관세 · 부가세 약 [\d,]+원이 붙습니다/);
    await expect(tid(page, "calc-result").getByRole("status")).toHaveCount(0);
  });

  test("입력 · 결과 · 과세환율 · 수입물가 구간이 모두 있음 · 숫자가 아닌 입력은 이유 (IMP-05)", async ({ page }) => {
    await page.goto("/calc");
    await expect(tid(page, "customs-section")).toContainText("이번 주 과세환율");
    await expect(tid(page, "import-price-section")).toContainText("수입물가와 환율");
    await fill(page, "abc");
    await expect(tid(page, "calc-result")).toContainText("숫자");
  });

  test("배치 — 넓은 화면은 입력이 결과 왼쪽 · 수입물가(가로 전체) → 과세환율 · 휴대폰은 입력 → 결과 → 수입물가 → 과세환율 순서로 쌓임 (작업 0200)", async ({ page }) => {
    await page.goto("/calc");
    const [input, result, imports, customs] = [await box(tid(page, "calc-input")), await box(tid(page, "calc-result")), await box(tid(page, "import-price-section")), await box(tid(page, "customs-section"))];
    expect(input.y + input.height).toBeLessThanOrEqual(imports.y + 1);
    expect(result.y + result.height).toBeLessThanOrEqual(imports.y + 1);
    expect(imports.y + imports.height).toBeLessThanOrEqual(customs.y + 1);
    if (isPhone()) {
      expect(input.y).toBeLessThan(result.y);
    } else {
      expect(input.x).toBeLessThan(result.x);
      // 수입물가 · 과세환율은 가로 전체 (위 입력 + 결과 묶음과 같은 폭)
      expect(Math.abs(imports.x - input.x)).toBeLessThan(2);
      expect(Math.abs(imports.x + imports.width - (result.x + result.width))).toBeLessThan(2);
      expect(Math.abs(customs.width - imports.width)).toBeLessThan(2);
      // 입력 묶음과 결과 칸은 같은 높이
      expect(Math.abs(input.height - result.height)).toBeLessThan(2);
    }
  });
});

// 작업 0200 (#235) — 처음 들어오면 예시 값 · 값을 바꿔도 칸이 움직이지 않음 · 다른 통화로 오면 빈 칸
test.describe("직구 계산 — 예시 값 · 고정 크기 (작업 0200)", () => {
  const input = (page: Page) => tid(page, "calc-input");
  const sizes = async (page: Page) => {
    const [a, b, c] = [await box(tid(page, "calc-input")), await box(tid(page, "calc-result")), await box(tid(page, "import-price-section"))];
    // 맨 위 큰 문장은 입력으로 바뀌어 줄 수가 달라질 수 있어(칸 밖) 입력 칸 위에서 아래 칸까지 거리로 비교 (같은 화면 좌표라 스크롤과 무관)
    return { inputH: Math.round(a.height), resultH: Math.round(b.height), importGap: Math.round(c.y - a.y) };
  };

  test("처음 — 달러 · 180 · 미국 목록통관 결과가 보이고 '예시' 표시 · 고치면 표시만 사라짐", async ({ page }) => {
    await page.goto("/calc");
    await expect(input(page).getByLabel(/통화/)).toHaveValue("USD");
    await expect(input(page).getByLabel(/물건 값/)).toHaveValue("180");
    await expect(input(page).getByLabel(/보내는 곳/)).toContainText("미국");
    await expect(tid(page, "calc-result")).toContainText("면세 한도 안");
    await expect(tid(page, "calc-result")).toContainText("원");
    await expect(tid(page, "calc-example")).toContainText("예시");
    await input(page).getByLabel(/관세율/).fill("8");
    await expect(tid(page, "calc-example")).toHaveCount(0);
    await expect(input(page).getByLabel(/물건 값/)).toHaveValue("180");
  });

  test("값을 바꿔도(결과 · 한도 넘음 · 빈 값 · 오류) 입력 · 결과 칸 높이와 아래 칸 위치가 그대로", async ({ page }) => {
    await page.goto("/calc");
    const before = await sizes(page);
    const price = input(page).getByLabel(/물건 값/);
    // 작업 0208: 휴대폰은 결과 카드가 글만큼만(아래 빈칸 없음) — 결과가 나온 상태끼리만 같고 · 빈 값 · 오류 글은 더 짧아도 됨. 입력 칸 높이는 늘 같음
    const phone = (page.viewportSize()?.width ?? 0) < 640;
    for (const v of ["250", "abc", "", "99999999", "180"]) {
      await price.fill(v);
      await input(page).getByLabel(/관세율/).fill(v === "250" ? "8" : "");
      const now = await sizes(page);
      if (phone && ["abc", "", "99999999"].includes(v)) expect(now.inputH).toBe(before.inputH);
      else expect(now).toEqual(before);
    }
    await input(page).getByLabel(/국제 배송비/).fill("xyz");
    const last = await sizes(page);
    if (phone) expect(last.inputH).toBe(before.inputH);
    else expect(last).toEqual(before);
  });

  test("다른 통화로 들어오면(?currency=JPY) 예시 없이 빈 칸", async ({ page }) => {
    await page.goto("/calc?currency=JPY");
    await expect(input(page).getByLabel(/통화/)).toHaveValue("JPY");
    await expect(input(page).getByLabel(/물건 값/)).toHaveValue("");
    await expect(tid(page, "calc-example")).toHaveCount(0);
  });

  test("수입물가와 환율 — 큰 숫자 두 개 · 선 끝 금액", async ({ page }) => {
    await page.goto("/calc");
    const sec = tid(page, "import-price-section");
    await expect(sec.locator('[data-testid="import-kpi"]')).toHaveCount(2);
    await expect(sec.locator('[data-testid="import-end-label"]')).toHaveCount(2);
  });
});

test.describe("작업실 /log (SR-LOG-01)", () => {
  test("큰 제목 · 상태판 · 팀 책상 네 역할 · 작업 흐름 여섯 단계", async ({ page }) => {
    await page.goto("/log");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("AI 에이전트 팀이 이 사이트를 만듭니다");
    await expect(tid(page, "status-board")).toContainText("사이트 상태");
    const desks = tid(page, "team-desks");
    for (const role of ["lead", "builder", "test", "geo"]) await expect(desks).toContainText(role);
    const flow = tid(page, "work-flow");
    for (const step of ["요청 원문 보관", "계획", "테스트 먼저", "구현", "자동 검사 통과", "사람 머지"]) await expect(flow).toContainText(step);
  });

  test("맨 위 요약 구간 — 이 사이트를 어떻게 만들었나 · 다섯 단계 (작업 0172) · 상태판보다 위", async ({ page }) => {
    await page.goto("/log");
    const story = tid(page, "site-story");
    await expect(story).toContainText("이 사이트를 어떻게 만들었나");
    await expect(tid(page, "story-step")).toHaveCount(5);
    for (const title of ["문제 정의", "외부 공공 API 연결", "구현 · 운영", "사고 대응", "결과 측정"]) await expect(story).toContainText(title);
    expect((await box(story)).y).toBeLessThan((await box(tid(page, "status-board"))).y);
  });

  test("위에서 아래 순서 — 상태판 → 팀 책상 → 작업 흐름", async ({ page }) => {
    await page.goto("/log");
    const [board, desks, flow] = [await box(tid(page, "status-board")), await box(tid(page, "team-desks")), await box(tid(page, "work-flow"))];
    expect(board.y).toBeLessThan(desks.y);
    expect(desks.y).toBeLessThan(flow.y);
  });
});

test.describe("소개 /about (SR-ABT-01)", () => {
  test("기준 카드 6개 · 큰 제목", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("어떤 자료를, 어떤 기준으로 보여 주나요");
    await expect(tid(page, "criteria-card")).toHaveCount(6);
  });
});

test.describe("GEO 측정 /geo (SR-GEO-01)", () => {
  test("큰 제목 · 측정 수치 카드 4개 · 읽는 법", async ({ page }) => {
    await page.goto("/geo");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("AI 검색에서 이 사이트가 어떻게 쓰이는지 잽니다");
    const cards = tid(page, "geo-cards");
    for (const label of ["AI 답변 인용", "구글 검색 노출", "AI · 검색 봇 방문", "AI 서비스 유입"]) await expect(cards).toContainText(label);
    await expect(tid(page, "geo-reading")).toContainText("이 수치를 읽는 법");
    await expect(tid(page, "geo-reading")).toContainText("숫자를 추정하지 않습니다");
  });
});

test("메뉴 — 새 화면으로 이동 (휴대폰은 메뉴 버튼을 먼저 펼침)", async ({ page }) => {
  for (const [name, path] of [["직구 계산", "/calc"], ["작업실", "/log"], ["GEO 측정", "/geo"]] as const) {
    await page.goto("/");
    await openMenuIfCollapsed(page);
    await page.getByRole("banner").getByRole("navigation").getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}/?$`));
  }
});

// 작업 0198 — "나라 더 보기 · 나라 접기" 가 버튼으로 보이고, 펼친 뒤에도 접기를 쉽게 찾고, 접으면 목록 머리로 돌아감 (#231)
test.describe("여행 물가 — 나라 접기 버튼 (작업 0198)", () => {
  const bandsOf = (page: Page) => tid(page, "price-bands");
  const openBtn = (page: Page) => bandsOf(page).getByRole("button", { name: /나라 더 보기/ });
  const foldBtn = (page: Page) => bandsOf(page).getByRole("button", { name: "나라 접기" });

  test("버튼 모양 — 테두리 알약 · 높이 44px 이상 · 초점 표시", async ({ page }) => {
    await page.goto("/prices");
    const btn = openBtn(page);
    await expect(btn).toBeVisible();
    expect((await box(btn)).height).toBeGreaterThanOrEqual(44);
    const style = await btn.evaluate((el) => {
      const s = getComputedStyle(el);
      return { border: parseFloat(s.borderTopWidth), radius: parseFloat(s.borderTopLeftRadius) };
    });
    expect(style.border).toBeGreaterThanOrEqual(2);
    expect(style.radius).toBeGreaterThanOrEqual(20);
    await page.keyboard.press("Tab");
    await btn.focus();
    const outline = await btn.evaluate((el) => getComputedStyle(el).outlineStyle);
    expect(outline).not.toBe("none");
  });

  test("펼친 뒤 목록 중간까지 스크롤해도 나라 접기가 화면 안에 보임", async ({ page }) => {
    await page.goto("/prices");
    await openBtn(page).click();
    const fold = foldBtn(page);
    await expect(fold).toBeVisible();
    const bands = await box(bandsOf(page));
    const vh = page.viewportSize()?.height ?? 0;
    // 목록 윗부분 · 중간에서 각각 접기 버튼이 화면 안에 있는지
    for (const frac of [0.15, 0.5]) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, bands.y + bands.height * frac - vh / 2 + (await page.evaluate(() => window.scrollY))));
      await expect(fold).toBeInViewport();
    }
  });

  test("접으면 목록 머리가 화면 안에 들어오고 더 보기로 돌아감", async ({ page }) => {
    await page.goto("/prices");
    await openBtn(page).click();
    await foldBtn(page).click();
    await expect(openBtn(page)).toBeVisible();
    await expect(page.locator('[data-testid="price-bands"] section').first()).toBeInViewport();
    await expect(bandsOf(page).locator("ul").first().locator("li")).toHaveCount(2);
  });
});

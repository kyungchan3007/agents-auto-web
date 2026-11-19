// 작업 0227 모션 4번(숫자 굴러가기) — 직구 계산 결과 e2e · 테스트 먼저
//   기준: 스크린샷 .tmp/lead-motion-1119/07-calc-4.png · 참고 구현 .tmp/motion-pages/m-calc.js · 원본 시안 .tmp/motion-1119/roll/index.html
//   굴러가는 숫자 부품 RollingNumber(packages/ui) DOM 계약 — 계산하는 곳마다 아래 뼈대 하나씩
//     <span data-testid="rolling-number" data-slot="big|usd|price|taxable|duty|vat|total" data-value="242136"(반올림한 정수) data-final="242,136원"(보이는 최종 글) data-state="idle|rolling">
//       <span data-testid="roll-prefix">$</span>            (있을 때만 · 굴러가지 않음)
//       <span aria-hidden="true">                            (굴러가는 칸 묶음 · 화면 읽기에서 빠짐)
//         <span data-testid="roll-cell" data-kind="digit" data-digit="2" [data-moving="true"(굴러가는 중에만)]><span data-testid="roll-strip">0 1 … 9 (여러 벌)</span></span>   (한 칸 = 자리 하나 · 위 칸이 막대 한 줄 높이로 가림)
//         <span data-testid="roll-cell" data-kind="comma">,</span>                 (쉼표 · 띠 없음)
//       </span>
//       <span data-testid="roll-suffix" aria-hidden="true">원</span>               (굴러가지 않음)
//       <span data-testid="roll-sr">242,136원</span>                               (화면 읽기용 최종 값 한 번 · 눈에는 안 보임)
//     </span>
//   slot 의미: big = 위 남색 큰 금액 · usd = 막대 아래 $ 금액(prefix $ · suffix 없음) · price · taxable · duty · vat · total = 아래 내역의 원화 금액
//   보이는 숫자 = 칸 안에서 가려진 띠의 위치로 읽음(각 칸의 가운데에 걸린 띠 숫자) — 멈춘 뒤 data-digit · data-value 와 정확히 같아야 함
//   데이터 없음(가짜 API 가 없어 결과가 안 나오는 경우)만 건너뜀 — 구현이 없어서 건너뛰지 않음(결과 칸 calc-limit-fill 은 지금 화면에도 있음)
import { type Locator, type Page, expect, test } from "@playwright/test";

const tid = (page: Page, id: string) => page.locator(`[data-testid="${id}"]`);
const isPhone = (page: Page) => (page.viewportSize()?.width ?? 0) < 640;
const SLOTS = ["big", "usd", "price", "taxable", "duty", "vat", "total"] as const;
type Slot = (typeof SLOTS)[number];
const roll = (page: Page, slot: Slot) => page.locator(`[data-testid="calc-result"] [data-testid="rolling-number"][data-slot="${slot}"]`);
const en = (n: number) => n.toLocaleString("en-US");

async function ready(page: Page) {
  await page.goto("/calc");
  return (await tid(page, "calc-limit-fill").count()) > 0;
}
const setInputs = async (page: Page, o: { currency?: string; price?: string; shipping?: string; duty?: string }) => {
  if (o.currency) await page.locator("#currency").selectOption(o.currency);
  if (o.price !== undefined) await page.locator("#price").fill(o.price);
  if (o.shipping !== undefined) await page.locator("#shipping").fill(o.shipping);
  if (o.duty !== undefined) await page.locator("#duty").fill(o.duty);
};

/** 한 숫자 부품의 지금 모습 — 보이는 숫자는 띠의 실제 위치로 읽음 */
async function snap(root: Locator) {
  return root.evaluate((el) => {
    const q = (s: string) => [...el.querySelectorAll(s)] as HTMLElement[];
    const cells = q('[data-testid="roll-cell"]').filter((c) => c.getBoundingClientRect().width >= 0.5);
    let visible = "";
    for (const c of cells) {
      if (c.getAttribute("data-kind") === "comma") { visible += ","; continue; }
      const cr = c.getBoundingClientRect();
      let t = "?";
      for (const s of (c.querySelector('[data-testid="roll-strip"]')?.children ?? []) as unknown as HTMLElement[]) {
        const r = s.getBoundingClientRect();
        const cy = (r.top + r.bottom) / 2;
        if (cy >= cr.top && cy < cr.bottom) { t = (s.textContent ?? "").trim(); break; }
      }
      visible += t;
    }
    return {
      value: el.getAttribute("data-value"), final: el.getAttribute("data-final"), state: el.getAttribute("data-state"),
      sr: el.querySelector('[data-testid="roll-sr"]')?.textContent ?? null, visible, moving: q('[data-moving="true"]').length,
      suffix: q('[data-testid="roll-suffix"]').map((x) => x.textContent), prefix: q('[data-testid="roll-prefix"]').map((x) => x.textContent),
      anims: (el as unknown as { getAnimations(o: object): unknown[] }).getAnimations({ subtree: true }).length,
    };
  });
}
/** 멈출 때까지 기다린 뒤 최종 값과 정확히 같은지 */
async function expectSettled(root: Locator, value: number, label: string) {
  await expect.poll(async () => { const s = await snap(root); return s.moving === 0 && s.state === "idle"; }, { message: `${label} 멈춤`, timeout: 4000 }).toBe(true);
  const s = await snap(root);
  const slot = await root.getAttribute("data-slot");
  const unit = slot === "usd" ? "" : "원";
  const pre = slot === "usd" ? "$" : "";
  expect(s.value, `${label} data-value`).toBe(String(value));
  expect(s.final, `${label} data-final`).toBe(`${pre}${en(value)}${unit}`);
  expect(s.sr, `${label} 읽기용 글`).toBe(s.final);
  expect(s.visible, `${label} 보이는 숫자`).toBe(en(value));
  expect(s.suffix, `${label} 단위`).toEqual(unit ? [unit] : []);
  expect(s.prefix, `${label} 앞 기호`).toEqual(pre ? [pre] : []);
  expect(s.anims, `${label} 남은 움직임`).toBe(0);
}
const valueOf = async (root: Locator) => Number(await root.getAttribute("data-value"));
/** 지금 화면에 있는 자리들의 값 */
async function values(page: Page) {
  const out: Partial<Record<Slot, number>> = {};
  for (const s of SLOTS) if ((await roll(page, s).count()) > 0) out[s] = await valueOf(roll(page, s));
  return out;
}
async function settleAll(page: Page, label: string) {
  for (const s of SLOTS) if ((await roll(page, s).count()) > 0) await expectSettled(roll(page, s), await valueOf(roll(page, s)), `${label} ${s}`);
}

test.describe("직구 계산 — 숫자 굴러가기 (작업 0227 · 모션 4번)", () => {
  test("처음 화면 — 큰 금액 · 막대 아래 $ · 내역 금액이 부품으로 · 처음 값은 굴러가지 않고 그대로 · 서로 같은 값", async ({ page }) => {
    test.skip(!(await ready(page)), "환율 자료 없음");
    for (const s of ["big", "usd", "price", "total"] as const) await expect(roll(page, s), s).toHaveCount(1);
    // 처음 값은 시안처럼 그대로 보임 — 0.8초 동안 한 번도 굴러가지 않음
    for (let i = 0; i < 8; i++) {
      expect(await tid(page, "calc-result").locator('[data-moving="true"]').count(), "처음에 굴러감").toBe(0);
      await page.waitForTimeout(100);
    }
    await settleAll(page, "처음");
    const v = await values(page);
    expect(v.big, "큰 금액 = 내역 물건 값").toBe(v.price);
    expect(v.usd, "$ 금액은 정수").toBe(Math.round(v.usd!));
  });

  test("값을 바꾸면 굴러감 — 바뀌자마자 읽기용 글 · 값은 최종 값 · 굴러가는 중 표시 · 멈추면 최종 값과 정확히 같음 (세 곳 모두)", async ({ page }) => {
    test.skip(!(await ready(page)), "환율 자료 없음");
    await setInputs(page, { currency: "USD", price: "100" });
    await settleAll(page, "100달러");
    const before = await values(page);
    await page.locator("#price").fill("300");
    const big = roll(page, "big");
    // 굴러가기 시작 — 굴러가는 칸이 생기고 띠에 움직임이 걸림
    await expect.poll(async () => (await snap(big)).moving, { timeout: 1500 }).toBeGreaterThan(0);
    const mid = await snap(big);
    expect(mid.state).toBe("rolling");
    expect(mid.anims, "띠에 움직임").toBeGreaterThan(0);
    // 굴러가는 도중에도 값 · 읽기용 글은 이미 최종 값 하나
    const target = await valueOf(big);
    expect(target).not.toBe(before.big);
    expect(mid.sr).toBe(mid.final);
    expect(mid.final).toBe(`${en(target)}원`);
    await settleAll(page, "300달러");
    const after = await values(page);
    expect(after.big).toBe(after.price);
    expect(after.big! / 300, "큰 금액 ÷ 300 = 환율").toBeCloseTo(before.big! / 100, 0);
    expect(Math.abs(after.big! - (before.big! * 3))).toBeLessThanOrEqual(3);
  });

  test("쉼표 · '원'은 굴러가지 않음 — 띠 없음 · 움직임 없음 · '원'은 한 번만", async ({ page }) => {
    test.skip(!(await ready(page)), "환율 자료 없음");
    await setInputs(page, { currency: "USD", price: "100" });
    await settleAll(page, "시작");
    await page.locator("#price").fill("5000");
    await expect.poll(async () => (await snap(roll(page, "big"))).moving, { timeout: 1500 }).toBeGreaterThan(0);
    const info = await roll(page, "big").evaluate((el) => {
      const commas = [...el.querySelectorAll('[data-testid="roll-cell"][data-kind="comma"]')] as HTMLElement[];
      const suf = [...el.querySelectorAll('[data-testid="roll-suffix"]')] as HTMLElement[];
      const anim = (e: HTMLElement) => (e as unknown as { getAnimations(o: object): unknown[] }).getAnimations({ subtree: true }).length;
      return {
        commas: commas.length, commaStrips: commas.filter((c) => c.querySelector('[data-testid="roll-strip"]')).length, commaAnims: commas.reduce((a, c) => a + anim(c), 0),
        suffixCount: suf.length, suffixStrips: suf.filter((c) => c.querySelector('[data-testid="roll-strip"]')).length, suffixAnims: suf.reduce((a, c) => a + anim(c), 0),
        suffixInsideCell: suf.filter((c) => c.closest('[data-testid="roll-cell"]')).length,
        digitsMoving: [...el.querySelectorAll('[data-testid="roll-cell"][data-kind="digit"][data-moving="true"]')].length,
        movingNonDigit: [...el.querySelectorAll('[data-testid="roll-cell"][data-kind="comma"][data-moving="true"]')].length,
      };
    });
    expect(info.commas, "쉼표").toBeGreaterThan(0);
    expect(info.commaStrips + info.commaAnims + info.movingNonDigit, "쉼표가 굴러감").toBe(0);
    expect(info.suffixCount).toBe(1);
    expect(info.suffixStrips + info.suffixAnims + info.suffixInsideCell, "'원'이 굴러감").toBe(0);
    expect(info.digitsMoving, "숫자 칸은 굴러감").toBeGreaterThan(0);
    await settleAll(page, "5000달러");
  });

  test("세금이 붙는 경우 — 내역 다섯 곳(물건 값 · 과세 가격 · 관세 · 부가세 · 합계)이 굴러가고 멈춘 값이 계산 규칙과 맞음 · $ 금액 = 막대 비율", async ({ page }) => {
    test.skip(!(await ready(page)), "환율 자료 없음");
    await setInputs(page, { currency: "USD", price: "300", shipping: "10", duty: "13" });
    await page.waitForTimeout(100);
    await settleAll(page, "세금");
    const v = await values(page);
    for (const s of ["big", "usd", "price", "taxable", "duty", "vat", "total"] as const) expect(v[s], `${s} 가 없음`).toBeDefined();
    const rate = v.price! / 300;
    expect(Math.abs(v.taxable! - 310 * rate), "과세 가격 = (물건 값 + 배송비) × 환율").toBeLessThanOrEqual(3);
    expect(Math.abs(v.duty! - v.taxable! * 0.13), "관세 = 과세 가격 × 13%").toBeLessThanOrEqual(2);
    expect(Math.abs(v.vat! - (v.taxable! + v.duty!) * 0.1), "부가세 = (과세 가격 + 관세) × 10%").toBeLessThanOrEqual(2);
    expect(Math.abs(v.total! - (v.taxable! + v.duty! + v.vat!)), "합계").toBeLessThanOrEqual(3);
    const limit = Number(((await tid(page, "calc-limit-bar").innerText()).match(/한도 \$(\d+)/) ?? [])[1]);
    const ratio = Number(await tid(page, "calc-limit-bar").getAttribute("data-ratio"));
    expect(Math.abs(v.usd! - ratio * limit), "막대 아래 $ = 비율 × 한도").toBeLessThanOrEqual(0.6);
    await expect(tid(page, "calc-tag-top")).toContainText(`면세 한도 $${limit} 넘음 · 세금 붙음`);
  });

  test("한도 안 → 넘음으로 바뀔 때 · 넘음 → 안으로 — 합계 · 관세 · 부가세가 굴러 0 으로/값으로 (과세 가격 칸의 글 '— 한도 안이라 계산 안 함' 은 그대로)", async ({ page }) => {
    test.skip(!(await ready(page)), "환율 자료 없음");
    await setInputs(page, { currency: "USD", price: "100", shipping: "", duty: "" });
    await settleAll(page, "한도 안");
    let v = await values(page);
    expect(v.duty, "한도 안 관세").toBe(0);
    expect(v.vat, "한도 안 부가세").toBe(0);
    expect(v.total, "한도 안 합계 = 물건 값").toBe(v.price);
    await expect(roll(page, "taxable"), "한도 안 과세 가격 자리").toHaveCount(0);
    await expect(tid(page, "calc-tag-bottom")).toContainText("— 한도 안이라 계산 안 함");
    await expect(tid(page, "calc-tag-top")).toContainText("면세 한도 안");
    await setInputs(page, { price: "400", duty: "8" });
    await expect.poll(async () => await roll(page, "vat").count(), { timeout: 2000 }).toBe(1);
    await settleAll(page, "넘음");
    v = await values(page);
    expect(v.taxable!).toBeGreaterThan(0);
    expect(v.duty!).toBeGreaterThan(0);
    await setInputs(page, { price: "100" });
    await settleAll(page, "다시 안");
    v = await values(page);
    expect(v.duty).toBe(0);
    expect(v.vat).toBe(0);
    expect(v.total).toBe(v.price);
  });

  test("자리 수가 달라져도 · 이어 입력해도 최종 값 정확 — 5 → 250 → 180,000 → 7 → 9,999,999", async ({ page }) => {
    test.skip(!(await ready(page)), "환율 자료 없음");
    await setInputs(page, { currency: "USD", price: "100", shipping: "", duty: "" });
    await settleAll(page, "시작");
    const base = (await valueOf(roll(page, "big"))) / 100;
    for (const p of ["5", "250", "180000", "7", "9999999"]) {
      await page.locator("#price").fill(p);
      await settleAll(page, `${p}달러`);
      const v = await values(page);
      expect(Math.abs(v.big! - Number(p) * base), `${p}달러 큰 금액`).toBeLessThanOrEqual(Number(p) * 0.01 + 2);
      expect(v.big).toBe(v.price);
    }
    // 멈추기 전에 세 번 연속 — 마지막 값으로
    for (const p of ["300", "450", "120"]) await page.locator("#price").fill(p);
    await settleAll(page, "연속");
    const v = await values(page);
    expect(Math.abs(v.big! - 120 * base), "연속 입력 마지막 값").toBeLessThanOrEqual(2);
  });

  test("움직이는 중에 새 값이 오면 지금 위치에서 이어 감 — 한 자리 띠가 되감기지 않음(프레임마다 반 칸 이하로 움직임)", async ({ page }) => {
    test.skip(!(await ready(page)), "환율 자료 없음");
    await setInputs(page, { currency: "USD", price: "100", shipping: "", duty: "" });
    await settleAll(page, "시작");
    // 일의 자리 칸의 띠 위치(칸 높이 단위, 0~10 로 접음)를 프레임마다 모음
    await page.evaluate(() => {
      const root = document.querySelector('[data-testid="calc-result"] [data-testid="rolling-number"][data-slot="big"]')!;
      const w = window as unknown as { __pos: number[]; __stop: boolean };
      w.__pos = []; w.__stop = false;
      const tick = () => {
        const cells = [...root.querySelectorAll('[data-testid="roll-cell"][data-kind="digit"]')].filter((c) => c.getBoundingClientRect().width >= 0.5);
        const c = cells[cells.length - 1] as HTMLElement | undefined; // 맨 오른쪽 = 일의 자리
        const strip = c?.querySelector('[data-testid="roll-strip"]') as HTMLElement | null;
        if (c && strip) {
          const h = c.getBoundingClientRect().height || 1;
          const m = new DOMMatrix(getComputedStyle(strip).transform).m42;
          w.__pos.push((((-m / h) % 10) + 10) % 10);
        }
        if (!w.__stop) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.locator("#price").fill("377");
    await page.waitForTimeout(260);
    await page.locator("#price").fill("123");
    await page.waitForTimeout(2200);
    const pos = await page.evaluate(() => { const w = window as unknown as { __pos: number[]; __stop: boolean }; w.__stop = true; return w.__pos; });
    expect(pos.length, "표본").toBeGreaterThan(40);
    let worst = 0;
    for (let i = 1; i < pos.length; i++) {
      let d = pos[i] - pos[i - 1];
      d = ((((d + 5) % 10) + 10) % 10) - 5; // 한 바퀴 접기
      worst = Math.max(worst, Math.abs(d));
    }
    expect(worst, "한 프레임에 건너뛴 칸 수(되감기는 수 칸)").toBeLessThan(1.5);
  });

  test("움직임 줄이기 — 굴러가지 않고 바로 최종 값", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    test.skip(!(await ready(page)), "환율 자료 없음");
    await setInputs(page, { currency: "USD", price: "100", shipping: "", duty: "" });
    await settleAll(page, "시작");
    await page.locator("#price").fill("300");
    const big = roll(page, "big");
    await expect.poll(async () => (await snap(big)).final, { timeout: 1500 }).not.toBe(`${en(await valueOf(roll(page, "price")))}원`).catch(() => {});
    for (let i = 0; i < 10; i++) {
      const s = await snap(big);
      expect(s.moving, "굴러가는 칸").toBe(0);
      expect(s.anims, "띠 움직임").toBe(0);
      expect(s.state).toBe("idle");
      await page.waitForTimeout(40);
    }
    await expect.poll(async () => (await snap(big)).visible, { timeout: 800 }).toBe(en(await valueOf(big)));
    await settleAll(page, "줄임");
  });

  test("화면 읽기 — 최종 값 글 한 번 · 나머지 글은 모두 aria-hidden 안 · 굴러가는 도중에도", async ({ page }) => {
    test.skip(!(await ready(page)), "환율 자료 없음");
    await setInputs(page, { currency: "USD", price: "100", shipping: "", duty: "" });
    await settleAll(page, "시작");
    await page.locator("#price").fill("350");
    await expect.poll(async () => (await snap(roll(page, "big"))).moving, { timeout: 1500 }).toBeGreaterThan(0);
    for (const slot of SLOTS) {
      const root = roll(page, slot);
      if ((await root.count()) === 0) continue;
      const leaks = await root.evaluate((el) => {
        const bad: string[] = [];
        const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) {
          const t = (n.textContent ?? "").trim();
          if (!t) continue;
          const p = n.parentElement!;
          if (p.closest('[data-testid="roll-sr"]')) continue;
          const hid = p.closest('[aria-hidden="true"]');
          if (!hid || !el.contains(hid)) bad.push(t);
        }
        return { bad, srCount: el.querySelectorAll('[data-testid="roll-sr"]').length };
      });
      expect(leaks.srCount, `${slot} 읽기용 글 개수`).toBe(1);
      expect(leaks.bad, `${slot} 읽기에 새는 글`).toEqual([]);
    }
    await settleAll(page, "읽기");
  });

  test("가로 넘침 없음 · 큰 금액은 한 줄로 카드 안 · 내역 금액이 줄 안 (아주 큰 값 · 작은 값 · 세금 붙음)", async ({ page }) => {
    test.skip(!(await ready(page)), "환율 자료 없음");
    await setInputs(page, { currency: "USD", shipping: "10", duty: "13" });
    for (const p of ["8", "300", "9999999"]) {
      await page.locator("#price").fill(p);
      await expect(roll(page, "big"), "큰 금액 부품").toHaveCount(1);
      await settleAll(page, `${p}달러`);
      const card = (await tid(page, "calc-result").boundingBox())!;
      for (const slot of SLOTS) {
        const root = roll(page, slot);
        if ((await root.count()) === 0) continue;
        const b = (await root.boundingBox())!;
        expect(b.x, `${p} ${slot} 왼쪽`).toBeGreaterThanOrEqual(card.x - 1);
        expect(b.x + b.width, `${p} ${slot} 오른쪽`).toBeLessThanOrEqual(card.x + card.width + 1);
        const cell = (await root.locator('[data-testid="roll-cell"]').first().boundingBox())!;
        expect(b.height, `${p} ${slot} 줄바꿈`).toBeLessThanOrEqual(cell.height * 1.5);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `${p} 가로 넘침`).toBeLessThanOrEqual(1);
    }
    // 카드 높이는 값이 바뀌어도 그대로(0208 크기 안정)
    await page.locator("#price").fill("8");
    await settleAll(page, "작게");
    const h1 = (await tid(page, "calc-result").boundingBox())!.height;
    await page.locator("#price").fill("9999999");
    await settleAll(page, "크게");
    const h2 = (await tid(page, "calc-result").boundingBox())!.height;
    expect(Math.abs(h1 - h2), "카드 높이").toBeLessThanOrEqual(1);
    void isPhone;
  });

  test("기존 요소 그대로 — 도장 · 막대 · 내역 줄 이름 · 안내 글 · 값이 비면 '—원' 과 안내 · 다시 넣으면 정확한 값", async ({ page }) => {
    test.skip(!(await ready(page)), "환율 자료 없음");
    await setInputs(page, { currency: "USD", price: "100", shipping: "", duty: "" });
    await settleAll(page, "시작");
    const bottom = tid(page, "calc-tag-bottom");
    for (const t of ["물건 값 (원화)", "과세 가격 (물건 값 + 국제 배송비)", "관세", "부가세 10% ((과세 가격 + 관세) × 10%)", "적용 환율", "모두 합쳐 예상", "예상 금액입니다. 실제 세금은 통관 때 정해집니다."]) await expect(bottom, t).toContainText(t);
    await expect(tid(page, "calc-limit-fill")).toHaveCount(1);
    await expect(tid(page, "calc-tag-top").getByText(/면세 한도 안/)).toBeVisible();
    await setInputs(page, { price: "400", duty: "" });
    await settleAll(page, "넘음");
    await expect(bottom).toContainText("— 관세율을 넣으면 계산"); // 관세율이 비면 합계 칸의 글 그대로
    await expect(roll(page, "total"), "관세율이 비면 합계는 글").toHaveCount(0);
    await setInputs(page, { price: "" });
    await expect(tid(page, "calc-tag-top")).toContainText("—");
    await expect(tid(page, "calc-tag-top")).toContainText("물건 값을 넣어 주세요");
    await expect(roll(page, "big"), "빈 값에서는 '—원'").toHaveCount(0);
    await setInputs(page, { price: "250" });
    await expect.poll(async () => await roll(page, "big").count(), { timeout: 2000 }).toBe(1);
    await settleAll(page, "다시");
    const v = await values(page);
    expect(v.big).toBe(v.price);
  });

  test("콘솔 오류 · 페이지 오류 없음 (여러 번 바꿔도)", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    test.skip(!(await ready(page)), "환율 자료 없음");
    await setInputs(page, { currency: "USD", price: "100", duty: "10" });
    for (const p of ["300", "", "12", "abc", "99999", "180"]) { await page.locator("#price").fill(p); await page.waitForTimeout(150); }
    await page.locator("#currency").selectOption("JPY");
    await page.waitForTimeout(800);
    expect(errors).toEqual([]);
  });
});

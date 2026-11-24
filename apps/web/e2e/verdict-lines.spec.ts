// 작업 0298(0289 를 바꿈) — 통화 상세 판정 설명 두 줄 지우기 · 달러 고정 통화 셋째 줄만 남기기 · 빈 칸 지우기 (사용자가 정한 조건: 시안 67번)
//   ① '최근 90일 중 …' 줄 · '… 고시 · 예측이 아닙니다' 줄이 없음(낮음 · 보통 · 높음 · 신호 없음 모두) — 판정 줄 '하위 N% · 낮음' 은 그대로
//   ② 셋째 줄('…은(는) 미국 달러에 고정된 통화라 달러와 같이 움직입니다')은 사우디 리얄(SAR) · 아랍에미리트 디르함(AED) · 바레인 디나르(BHD) 에만 — 다른 통화에는 보이지 않는 자리(invisible)도 없음(빈 칸 없음)
//   ③ '실제로 바꿀 때' 카드 아래 '매매기준율 · 날짜 · 출처' 줄은 금액 입력이 틀려도 늘 보임(FX-01) · 오류 글('0 이상의 숫자만 넣어 주세요.')은 따로 한 줄 · 오류가 떠도 아래 칸이 밀리지 않음
//   ④ 가로 넘침 0 (1280 · 390)
import { type Page, expect, test } from "@playwright/test";

const PEGGED = ["SAR", "AED", "BHD"];
const OTHERS = ["USD", "JPY", "EUR", "HKD", "KWD", "CNH", "DKK", "BND"];
const WIDTHS = [1280, 390];

async function open(page: Page, code: string, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`/currencies/${code}`);
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await Promise.race([Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Number.POSITIVE_INFINITY).map((a) => a.finished.catch(() => undefined))), new Promise((res) => setTimeout(res, 3000))]);
  });
}
/** 큰 환율 제목 바로 아래 판정 줄(색 점 + '하위 N% · 낮음') 칸의 글 */
const verdictText = (page: Page) => page.getByTestId("big-rate").evaluate((h) => (h.nextElementSibling as HTMLElement).innerText.replace(/\s+/g, " ").trim());
const overflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

test.describe("통화 판정 줄 (작업 0298)", () => {
  for (const code of ["USD", "JPY", "EUR", "SAR", "HKD"]) {
    test(`/currencies/${code} — 판정 설명 두 줄이 없음('최근 90일 중 …' · '… 고시 · 예측이 아닙니다') · 판정 줄 '하위 N% · 낮음' 은 그대로`, async ({ page }) => {
      await open(page, code, 1280);
      const v = await verdictText(page);
      expect(v, "판정 줄 칸의 글").not.toMatch(/최근 \d+일|날보다|중간 수준|예측이 아닙니다|예측 아님|고시 ·/);
      expect(v, "판정 줄은 '하위 · 상위 N% · 낮음 · 보통 · 높음' 또는 신호 없음 안내").toMatch(/^(하위|상위) \d+% · (낮음|보통|높음)$|^신호를 받지 못했습니다|^$/);
      const body = await page.locator("body").innerText();
      expect(body, "판정 설명 첫 줄").not.toMatch(/최근 \d+일 중 (\d+%의 날보다|가장 (낮|높)습니다)|최근 \d+일 중간 수준입니다/);
      expect(body, "판정 설명 둘째 줄").not.toMatch(/\d{1,2}월 \d{1,2}일 (한국수출입은행 고시|Frankfurter 값) · 예측이 아닙니다/);
    });
  }

  // 작업 0351: 통화 상세 질문 1 의 답이 지운 설명 문장('최근 90일 중 N%의 날보다 …')을 되살렸던 것 — 판정 줄 말('하위 N% · 낮음')로 쓴다
  for (const code of ["USD", "JPY", "EUR"]) {
    test(`/currencies/${code} — 자주 묻는 질문 1 의 답은 판정 줄 말('… 하위 · 상위 N% · 낮음 · 보통 · 높음' 또는 신호 없음)이고 지운 설명 문장이 아님 (작업 0351)`, async ({ page }) => {
      await open(page, code, 1280);
      const answer = (await page.getByTestId("faq-item").first().innerText()).replace(/\s+/g, " ");
      expect(answer, "질문 1 답에 신호 말").toMatch(/(하위|상위) \d+% · (낮음|보통|높음)|신호를 받지 못했습니다/);
      expect(answer, "지운 설명 문장이 아님").not.toMatch(/최근 \d+일 중 (\d+%의 날보다|가장 (낮|높)습니다)|최근 \d+일 중간 수준/);
    });
  }

  for (const code of PEGGED) {
    test(`/currencies/${code} — 셋째 줄이 보임: '(통화 이름)은(는) 미국 달러에 고정된 통화라 달러와 같이 움직입니다'`, async ({ page }) => {
      await open(page, code, 1280);
      const note = page.getByTestId("peg-note");
      await expect(note).toBeVisible();
      await expect(note).toHaveText(/^.+(은|는) 미국 달러에 고정된 통화라 달러와 같이 움직입니다$/);
    });
  }
  for (const code of OTHERS) {
    test(`/currencies/${code} — 셋째 줄 없음 · 보이지 않는 자리도 없음(빈 칸 없음)`, async ({ page }) => {
      await open(page, code, 1280);
      await expect(page.getByTestId("peg-note"), "셋째 줄 칸 자체가 없음").toHaveCount(0);
      expect(await page.locator("body").innerText(), "고정 통화 문장").not.toContain("미국 달러에 고정된 통화");
      const hidden = await page.locator('[data-testid="currency-detail"] span[aria-hidden].invisible').evaluateAll((els) => els.map((e) => (e.textContent ?? "").trim()).filter((t) => t.includes("고정된 통화")));
      expect(hidden, "보이지 않는 자리 글").toEqual([]);
      // 판정 줄 칸 바로 다음 칸이 빈 자리(보이는 글이 없는 칸)가 아님
      const next = await page.getByTestId("big-rate").evaluate((h) => { const n = (h.nextElementSibling as HTMLElement).nextElementSibling as HTMLElement | null; return n ? { text: n.innerText.trim(), h: n.getBoundingClientRect().height } : null; });
      if (next) expect(next.text.length > 0 || next.h < 1, `판정 줄 다음 칸이 빈 자리(높이 ${next.h})`).toBe(true);
    });
  }

  for (const width of WIDTHS) {
    test(`${width}px — 판정 줄 아래 ~ '1년 최저' 카드 덩어리 거리: 달러 고정 통화가 아니면 서로 같고(빈 칸 없음) 고정 통화(SAR · AED · BHD)만 셋째 줄만큼 더 김 · 가로 넘침 0`, async ({ page }) => {
      const gap: Record<string, number> = {};
      for (const code of [...OTHERS, ...PEGGED]) {
        await open(page, code, width);
        expect(await overflow(page), `${code} 가로 넘침`).toBeLessThanOrEqual(0);
        gap[code] = await page.evaluate(() => {
          const verdict = (document.querySelector('[data-testid="big-rate"]') as HTMLElement).nextElementSibling as HTMLElement;
          // 판정 줄과 같은 칸 안에서 '1년 최저' 카드 덩어리(mt-8 칸)가 시작하는 자리
          const card = Array.from(verdict.parentElement!.children).find((c) => c !== verdict && (c as HTMLElement).innerText.includes("1년 최저")) as HTMLElement;
          return Math.round((card.getBoundingClientRect().top - verdict.getBoundingClientRect().bottom) * 10) / 10;
        });
      }
      for (const code of OTHERS) expect(Math.abs(gap[code] - gap.USD), `${code} 거리 ${gap[code]} (USD ${gap.USD}) — 보이지 않는 빈 자리가 있으면 이 값이 커짐`).toBeLessThanOrEqual(1);
      for (const code of PEGGED) expect(gap[code] - gap.USD, `${code} 은 셋째 줄만큼 더 긺(${gap[code]} − ${gap.USD})`).toBeGreaterThan(14);
    });
  }

  for (const width of WIDTHS) {
    test(`${width}px — 금액이 틀려도 '매매기준율 · 날짜 · 출처' 줄이 늘 보이고 오류 글은 따로 한 줄 · 오류가 떠도 아래 칸이 밀리지 않음`, async ({ page }) => {
      await open(page, "USD", width);
      const note = page.locator("#converter-note");
      const input = page.getByTestId("converter").locator("input").first();
      const measure = () => page.evaluate(() => {
        const n = document.getElementById("converter-note") as HTMLElement;
        const r = n.getBoundingClientRect();
        const below = (n.closest('[data-testid="converter"]')?.nextElementSibling ?? n.nextElementSibling) as HTMLElement | null;
        const alertEl = n.querySelector('[role="alert"]') as HTMLElement | null;
        return { h: Math.round(r.height * 10) / 10, top: Math.round((r.top + scrollY) * 10) / 10, below: below ? Math.round((below.getBoundingClientRect().top + scrollY) * 10) / 10 : 0, alert: alertEl ? alertEl.innerText.trim() : "", source: (n.querySelector("p") as HTMLElement).innerText, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      await input.fill("100");
      const ok = await measure();
      expect(ok.source, "정상 입력의 기준일 · 출처 줄").toMatch(/매매기준율 · \d{4}-\d{2}-\d{2} · (한국수출입은행|Frankfurter)/);
      expect(ok.alert, "정상 입력에는 오류 글 없음").toBe("");
      // 빈 입력('')은 '송금으로 바꾸면' 글이 원래 없어 한 줄 짧아짐(이번 작업 전부터 · 오류 글 아님) — 틀린 입력(글자 · 음수)만 봄
      for (const bad of ["abc", "-5"]) {
        await input.fill(bad);
        const m = await measure();
        expect(m.source, `'${bad}' 입력에서도 기준일 · 출처 줄이 보임`).toMatch(/매매기준율 · \d{4}-\d{2}-\d{2} · (한국수출입은행|Frankfurter)/);
        if (bad) expect(m.alert, `'${bad}' 오류 글(따로 한 줄)`).toBe("0 이상의 숫자만 넣어 주세요.");
        expect(Math.abs(m.h - ok.h), `'${bad}' 안내 칸 높이 ${m.h} (정상 ${ok.h})`).toBeLessThanOrEqual(1);
        expect(Math.abs(m.top - ok.top), `'${bad}' 안내 칸 위치`).toBeLessThanOrEqual(1);
        expect(Math.abs(m.below - ok.below), `'${bad}' 아래 칸 위치`).toBeLessThanOrEqual(1);
        expect(m.overflow, `'${bad}' 가로 넘침`).toBeLessThanOrEqual(0);
      }
      await expect(note).toContainText("실제 환전은 은행 · 환전소 수수료");
    });
  }
});

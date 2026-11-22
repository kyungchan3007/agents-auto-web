// 작업 0272 — 화면에 보이는 글자가 12px 이상 · 가로로 넘치지 않음 (기능 테스트 · 사용자가 정한 조건: 시안 45번 "추천안대로")
//   대상 페이지: 홈 · 여행 타이밍 · 여행 물가 · 통화 상세 · 직구 계산 · 소개 — 넓은 화면(1280) · 휴대폰(390) 모두 · 이 파일은 두 프로젝트에서 돌며 폭은 테스트 안에서 정함
//   "보이는 글자" = 글자가 든 요소 중 크기가 있고 숨겨지지 않았으며 화면 읽기 전용(sr-only · 1px 상자)이 아닌 것 · SVG 글자(그래프 눈금 · 달력 · 창밖 달 이름)는 그림 배율을 곱한 실제 화면 크기 기준
//   제외(작업서): /geo · /log · 글자판(안내판 숫자: flap-board · hero-board · status-board · window-flap · flap-row · flap-cell · 로딩 판) · 통화 상세의 큰 환율 숫자(big-rate) · 카운트 숫자(count-up · rolling-number 는 큰 숫자 부품)
//   기준값 12px 에서 0.1px 까지는 소수 반올림으로 보고 봐줌(11.9 이상)
import { type Page, expect, test } from "@playwright/test";

const MIN = 11.9;
const PAGES = ["/", "/flights", "/prices", "/currencies/USD", "/calc", "/about"];
const SIZES = [
  { name: "넓은 화면 1280", width: 1280, height: 800 },
  { name: "휴대폰 390", width: 390, height: 844 },
];
const EXCLUDE = ['[data-testid="flap-board"]', '[data-testid="hero-board"]', '[data-testid="status-board"]', '[data-testid="window-flap"]', '[data-testid="flap-row"]', '[data-testid="flap-cell"]', '[data-testid="intro-loading-board"]', '[data-testid="big-rate"]', '[data-testid="count-up"]', '[data-testid="rolling-number"]'];

type Small = { px: number; text: string; el: string };

/** 화면에 보이는 글자 중 12px 미만을 모아 돌려줌(글자 수 · 가장 작은 크기도) */
async function scan(page: Page) {
  return page.evaluate(
    ({ exclude, min }) => {
      const out: { px: number; text: string; el: string }[] = [];
      let total = 0;
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set<Element>();
      while (walker.nextNode()) {
        const n = walker.currentNode;
        if (!(n.textContent ?? "").trim()) continue;
        const e = n.parentElement;
        if (!e || seen.has(e)) continue;
        seen.add(e);
        if (e.closest("script,style,noscript,[hidden],[aria-hidden='true']") || exclude.some((q) => e.closest(q))) continue;
        const cs = getComputedStyle(e);
        const r = e.getBoundingClientRect();
        if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.01) continue;
        if (r.width <= 1 || r.height <= 1) continue; // 화면 읽기 전용(sr-only) 칸
        if (cs.clip !== "auto" && /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(cs.clip)) continue;
        let px = parseFloat(cs.fontSize);
        // SVG 글자: 그림 배율(화면 좌표 변환)을 곱한 실제 크기
        const svg = e instanceof SVGElement ? (e as unknown as SVGGraphicsElement) : null;
        if (svg && typeof svg.getScreenCTM === "function") {
          const m = svg.getScreenCTM();
          if (m) px = px * Math.sqrt(m.a * m.a + m.b * m.b);
        }
        total++;
        if (px < min) out.push({ px: Math.round(px * 10) / 10, text: (n.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 18), el: `${e.tagName.toLowerCase()}${(e as HTMLElement).dataset?.testid ? `[${(e as HTMLElement).dataset.testid}]` : ""}` });
      }
      return { total, small: out };
    },
    { exclude: EXCLUDE, min: MIN },
  );
}

/** 등장 움직임 · 글꼴이 자리 잡은 뒤에 잼 */
async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await Promise.race([Promise.all(document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Number.POSITIVE_INFINITY).map((a) => a.finished.catch(() => undefined))), new Promise((res) => setTimeout(res, 3000))]);
    await (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
  });
}

test.describe("보이는 글자 12px 이상 · 가로 넘침 없음 (작업 0272)", () => {
  for (const size of SIZES) {
    for (const path of PAGES) {
      test(`${size.name} ${path} — 보이는 글자(SVG 포함) 12px 미만 0 · 문서 가로 넘침 0`, async ({ page }) => {
        await page.setViewportSize({ width: size.width, height: size.height });
        await page.goto(path);
        await settle(page);
        // 페이지 전체를 훑어 늦게 그려지는 칸(화면에 들어올 때 생기는 그림)도 포함
        const total = await page.evaluate(() => document.documentElement.scrollHeight);
        let small: Small[] = [];
        let texts = 0;
        for (const y of [0, 0.35, 0.7, 1]) {
          await page.evaluate((v) => { document.documentElement.style.scrollBehavior = "auto"; window.scrollTo(0, v); }, total * y);
          await page.waitForTimeout(250);
          await settle(page);
          let r = await scan(page);
          // 그래프 꼬리표(최저 · 최고 글자)는 그려지는 동안 크기가 커지며 나타남(자바스크립트로 움직임) — 작은 글자가 보이면 끝나 자리 잡을 때까지(최대 6초) 같은 자리를 다시 잼 · 끝난 크기로 판정
          for (let k = 0; k < 9 && r.small.length > 0; k++) {
            await page.waitForTimeout(700);
            r = await scan(page);
          }
          texts = Math.max(texts, r.total);
          small = small.concat(r.small);
        }
        expect(texts, "잰 글자 요소 수").toBeGreaterThan(10);
        const uniq = [...new Map(small.map((s) => [`${s.el}|${s.text}|${s.px}`, s])).values()];
        expect(uniq.map((s) => `${s.px}px ${s.el} "${s.text}"`), `12px 미만 글자 ${uniq.length}곳`).toEqual([]);
        expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), "문서 가로 넘침").toBeLessThanOrEqual(0);
      });
    }
  }
});

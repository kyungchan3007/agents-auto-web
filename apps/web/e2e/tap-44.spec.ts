// 작업 0268 — 휴대폰(폭 390)에서 누르는 자리가 44px 이상 (시안 42 A안 · 사용자 결정 "둘 다 추천안으로") · 테스트 먼저는 아님(builder 구현 뒤 확인) · 기능 테스트(@design 아님: 사용자가 정한 조건)
//   조건: 보이는 모양 · 크기 · 위치는 그대로 두고 "눌리는 영역"만 높이 44px 이상(폭이 44px 미만인 것은 폭도) · 넓힌 영역끼리 겹치지 않음(맞닿음은 됨)
//   "눌리는 영역" = 요소 자신 + 보이지 않는 덧칸(::after) 을 합친, 실제로 눌림이 그 요소로 가는 범위 — 가운데에서 위 · 아래 · 옆으로 0.5px 씩 가며 document.elementFromPoint 가 그 요소(또는 안쪽)를 가리키는 한 구간
//     (덧칸이 부모 칸의 overflow 에 잘리거나 이웃 위에 덮이면 그 부분은 눌림이 안 가므로 영역에서 빠짐)
//   겹침 = 두 요소의 눌리는 영역(요소 상자 + ::after 상자의 합) 사이 겹치는 넓이가 있음(맞닿음 · 0.5px 이하는 겹침 아님)
//   보이는 크기 = 요소 자신의 상자(::after 제외)가 작업서가 잰 값 ± 2px 안(키우지 않음)
//   제외(작업서 · lead): 여행 타이밍 창밖 달 버튼(window-month) · /geo · /log — 범례 탭 3개는 사용자 결정("4px 늘려서 맞춤")으로 대상에 넣음
import { type Locator, type Page, expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";

test.beforeEach(async ({ page }) => {
  await forceDefaultHero(page);
});

const VIEW = { width: 390, height: 844 };
const MIN = 43.5; // 0.5px 간격으로 잰 값이라 44 에서 0.5 까지 허용

type Target = { id: string; page: string; sel: string; size?: { w?: number; h?: number; /** 같은 대상이 다른 모양일 때 허용하는 또 다른 높이들 (작업 0351) */ alsoH?: number[] }; need?: "both" | "h" };
// 크기 = claude-desktop 이 390px 에서 잰 값(작업서) — 맞는지는 이 테스트가 확인(± 2px)
const TARGETS: Target[] = [
  { id: "로고", page: "/", sel: 'header a[href="/"]', size: { w: 54, h: 33 } },
  { id: "메뉴 버튼", page: "/", sel: 'header button[aria-expanded]', size: { w: 40, h: 40 } },
  { id: "year-link", page: "/", sel: '[data-testid="year-link"]', size: { h: 28 } },
  { id: "more-currencies", page: "/", sel: '[data-testid="more-currencies"]', size: { h: 30 } },
  { id: "달력 이전 airfare-prev", page: "/flights", sel: '[data-testid="airfare-prev"]', size: { w: 32, h: 32 } },
  { id: "달력 다음 airfare-next", page: "/flights", sel: '[data-testid="airfare-next"]', size: { w: 32, h: 32 } },
  { id: "도시 칩 airfare-chip", page: "/flights", sel: '[data-testid="airfare-chip"]', size: { h: 40 } },
  { id: "다시 보기 window-replay", page: "/flights", sel: '[data-testid="window-replay"]', size: { h: 41 } },
  // 작업 0268 이어서(사용자 결정 "4px 늘려서 맞춤"): 그래프 범례 탭 3개 — 휴대폰에서 두 줄 · 보이는 크기(높이 32)는 그대로 · 줄 사이를 8 → 12px 로 늘려 넓힌 영역이 겹치지 않게(줄 사이 값 자체는 고정하지 않고 "겹침 없음"으로만 봄)
  { id: "범례 탭 travel-legend", page: "/flights", sel: '[data-testid="travel-legend"] button', size: { h: 32 } },
  { id: "나라 단추 route-stop", page: "/prices", sel: '[data-testid="route-stop"]', size: { h: 31 } },
  { id: "나라 더 보기", page: "/prices", sel: 'button[aria-expanded="false"]:has-text("나라 더 보기")', size: { h: 30 } },
  // 작업 0351: '보통' 판정 핀은 2px 테두리(border-2 · signal-pin.tsx)라 원래 디자인이 32px · 쌈 · 비쌈 핀은 28px — 그날 신호에 따라 둘 다 나옴(작업서는 쌈 · 비쌈만 잼)
  { id: "통화 상세 링크", page: "/prices", sel: 'a[aria-label$="통화 상세"]', size: { h: 28, alsoH: [32] } },
  // 작업 0351: 0344 나라 이름 링크(보이는 높이 27px 그대로) · 0345 통화 상세 질문 속 '나라 물가 자세히 보기' 링크(20px 그대로)도 같은 조건(눌리는 영역 44px)
  { id: "나라 이름 링크 price-band-link", page: "/prices", sel: '[data-testid="price-band-link"]', size: { h: 27 } },
  { id: "질문 링크 faq-link", page: "/currencies/USD", sel: '[data-testid="faq-link"]', size: { h: 20 } },
  { id: "금액 칩", page: "/currencies/USD", sel: '[role="group"][aria-label="빠른 금액"] button', size: { h: 32 } },
  { id: "통화 칩 chip", page: "/currencies/USD", sel: '[data-testid="chip"]', size: { h: 36 } },
  { id: "기간 단추(1개월 · 3개월 · 1년)", page: "/currencies/USD", sel: '[data-testid="year-flow"] button[aria-pressed]' },
];

/** 한 요소의 눌리는 영역(위 · 아래 · 왼 · 오른쪽 길이) · 요소 자신의 상자 · 덧칸 상자 — 화면 안 가운데로 가져온 뒤 같은 순간에 잼 */
async function measure(loc: Locator) {
  return loc.evaluate(async (el) => {
    (el as HTMLElement).scrollIntoView({ block: "center", inline: "center" });
    // 화면에 들어오면 시작하는 등장 움직임(페이드 업 · 위로 28px 떠오름)이 끝난 뒤에 잼 — 움직이는 동안은 이웃 칸이 잠깐 덧칸 위를 덮을 수 있음(CI 에서 한 번 흔들림: year-link 높이 40.5)
    const finite = () => document.getAnimations().filter((a) => a.effect && a.effect.getComputedTiming().iterations !== Number.POSITIVE_INFINITY && a.playState !== "finished");
    await Promise.race([Promise.all(finite().map((a) => a.finished.catch(() => undefined))), new Promise((res) => setTimeout(res, 3000))]);
    await new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));
    // 작업 0395: 화면에 들어오면 시작하는 등장 움직임 · 아래 구역(도착지별 환전 타이밍)이 들어올 때 435 → 984px 로 늘어나는 높이 변화 때문에, 가운데로 가져온 요소가 다시 화면 아래로 밀리거나 움직이는 중에 재면 "가운데를 눌러도 다른 요소"(CI)
    //   → 요소 위치가 12프레임 연속 같을 때까지(최대 3초) 기다리고 · 화면 밖으로 밀렸으면 다시 가운데로 가져와 같은 일을 반복(최대 4번)
    const settle = () =>
      new Promise<void>((res) => {
        let last = Number.NaN, same = 0;
        const t0 = performance.now();
        const tick = () => {
          const top = el.getBoundingClientRect().top;
          same = top === last ? same + 1 : 0;
          last = top;
          if (same >= 12 || performance.now() - t0 > 3000) res();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    for (let n = 0; n < 4; n++) {
      await settle();
      const b = el.getBoundingClientRect();
      const c = b.top + b.height / 2;
      if (c >= 0 && c <= innerHeight && Math.abs(c - innerHeight / 2) < 4) break;
      (el as HTMLElement).scrollIntoView({ block: "center", inline: "center" });
    }
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const hit = (x: number, y: number) => { const h = document.elementFromPoint(x, y); return !!h && (el === h || el.contains(h)); };
    const scan = (dx: number, dy: number) => { let d = 0; while (d < 40 && hit(cx + dx * (d + 0.5), cy + dy * (d + 0.5))) d += 0.5; return d; };
    return { up: scan(0, -1), down: scan(0, 1), left: scan(-1, 0), right: scan(1, 0), w: r.width, h: r.height, centerHit: hit(cx, cy), text: (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 24) };
  });
}

async function open(page: Page, path: string) {
  await page.setViewportSize(VIEW);
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  // 접힌 질문 속 링크(faq-link)도 재도록 펼쳐 둠 — 펼침은 화면 아래쪽 높이만 바꿈 (작업 0351)
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => { d.open = true; }));
}

const byPage = [...new Set(TARGETS.map((t) => t.page))];

test.describe("휴대폰 390px — 누르는 자리 44px 이상 (작업 0268)", () => {
  for (const path of byPage) {
    test(`${path} — 대상의 눌리는 영역 높이 ≥ 44px(폭 44 미만은 폭도) · 넓힌 영역끼리 겹치지 않음 · 보이는 크기 그대로`, async ({ page }) => {
      await open(page, path);
      const found: { t: Target; m: Awaited<ReturnType<typeof measure>> }[] = [];
      for (const t of TARGETS.filter((x) => x.page === path)) {
        const loc = page.locator(t.sel);
        const n = await loc.count();
        // 자료가 없어 그려지지 않는 칸(나라 더 보기 · 통화 상세 링크 · 출발일 달력 · 12달 구역 등)은 건너뜀 — 로고 · 메뉴 · 통화 칩 · 기간 단추처럼 늘 있는 대상은 반드시 있어야 함
        if (n === 0 && ["도시 칩 pick-chip", "year-link", "more-currencies", "통화 상세 링크", "도시 칩 airfare-chip", "다시 보기 window-replay", "달력 이전 airfare-prev", "달력 다음 airfare-next", "나라 더 보기", "나라 이름 링크 price-band-link", "질문 링크 faq-link", "범례 탭 travel-legend"].includes(t.id)) continue;
        expect(n, `${t.id} 가 화면에 있음`).toBeGreaterThan(0);
        for (let i = 0; i < n; i++) {
          const el = loc.nth(i);
          if (!(await el.isVisible())) continue;
          const m = await measure(el);
          found.push({ t, m });
          const name = `${t.id} #${i + 1} "${m.text}"`;
          expect(m.centerHit, `${name}: 가운데를 누르면 그 요소`).toBe(true);
          expect(m.up + m.down, `${name}: 눌리는 영역 높이(px)`).toBeGreaterThanOrEqual(MIN);
          if (m.w < 44) expect(m.left + m.right, `${name}: 폭이 44 미만이라 눌리는 영역 폭(px)도`).toBeGreaterThanOrEqual(MIN);
          // 보이는 크기는 지금 그대로(작업서 측정값 ± 2px)
          if (t.size?.h) expect(Math.min(...[t.size.h, ...(t.size.alsoH ?? [])].map((h) => Math.abs(m.h - h))), `${name}: 보이는 높이 ${m.h.toFixed(1)}px (작업서 ${[t.size.h, ...(t.size.alsoH ?? [])].join(" 또는 ")}px)`).toBeLessThanOrEqual(2);
          if (t.size?.w) expect(Math.abs(m.w - t.size.w), `${name}: 보이는 폭 ${m.w.toFixed(1)}px (작업서 ${t.size.w}px)`).toBeLessThanOrEqual(2);
        }
      }
      // 넓힌 영역끼리 겹치지 않음(맞닿음 0.5px 까지는 됨) — 모든 대상의 영역(요소 상자 + ::after 상자)을 한 번의 읽기로 함께 잼(대상마다 스크롤하며 재면 좌표가 서로 달라 쌍 비교가 틀림)
      const rects = await page.evaluate((sels) => {
        const out: { id: string; text: string; x1: number; x2: number; y1: number; y2: number }[] = [];
        for (const { id, sel } of sels) {
          // ':has-text("…")' 는 Playwright 전용 선택자라 브라우저 DOM 에서는 못 씀(SyntaxError) — 기본 선택자 + 글 포함으로 나눠 씀
          const m = sel.match(/^(.*?):has-text\("(.*)"\)$/);
          const base = m ? m[1] : sel;
          for (const el of Array.from(document.querySelectorAll(base)).filter((e) => !m || (e.textContent ?? "").includes(m[2]))) {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || r.height === 0) continue;
            // ::after 의 실제 상자 = 요소(position: relative)의 안쪽 가장자리 기준 left/right/top/bottom 과 크기, 그리고 transform 이동(translate)을 모두 반영 — 가운데 기준이라고 가정하지 않음(앞 단추는 오른쪽 기준으로 왼쪽만 · 뒤 단추는 왼쪽 기준으로 오른쪽만 넓히는 경우가 있음)
            const af = getComputedStyle(el, "::after");
            const has = af.content !== "none" && af.content !== "normal";
            let x1 = r.left, x2 = r.right, y1 = r.top, y2 = r.bottom;
            if (has) {
              const w = parseFloat(af.width) || 0, h = parseFloat(af.height) || 0;
              const px = (v: string) => (v === "auto" ? Number.NaN : parseFloat(v));
              const bl = (el as HTMLElement).clientLeft, bt = (el as HTMLElement).clientTop;
              const padL = r.left + bl, padT = r.top + bt, padR = r.right - ((el as HTMLElement).offsetWidth - (el as HTMLElement).clientWidth - bl), padB = r.bottom - ((el as HTMLElement).offsetHeight - (el as HTMLElement).clientHeight - bt);
              const left = px(af.left), right = px(af.right), top = px(af.top), bottom = px(af.bottom);
              let bx = Number.isNaN(left) ? (Number.isNaN(right) ? padL : padR - right - w) : padL + left;
              let by = Number.isNaN(top) ? (Number.isNaN(bottom) ? padT : padB - bottom - h) : padT + top;
              const t = af.transform === "none" ? null : new DOMMatrixReadOnly(af.transform);
              if (t) { bx += t.e; by += t.f; }
              x1 = Math.min(x1, bx); x2 = Math.max(x2, bx + w); y1 = Math.min(y1, by); y2 = Math.max(y2, by + h);
            }
            out.push({ id, text: (el.getAttribute("aria-label") ?? el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 24), x1, x2, y1, y2 });
          }
        }
        return out;
      }, TARGETS.filter((x) => x.page === path).map((x) => ({ id: x.id, sel: x.sel })));
      for (let a = 0; a < rects.length; a++)
        for (let b = a + 1; b < rects.length; b++) {
          const ox = Math.min(rects[a].x2, rects[b].x2) - Math.max(rects[a].x1, rects[b].x1);
          const oy = Math.min(rects[a].y2, rects[b].y2) - Math.max(rects[a].y1, rects[b].y1);
          expect(ox > 0.5 && oy > 0.5, `겹침: ${rects[a].id} "${rects[a].text}" 와 ${rects[b].id} "${rects[b].text}" (겹친 폭 ${ox.toFixed(1)} · 높이 ${oy.toFixed(1)}px)`).toBe(false);
        }
      expect(found.length, "잰 대상 수").toBeGreaterThan(0);
    });
  }

  test("넓은 화면(1280)에서는 덧칸이 없음 — 눌리는 영역이 보이는 모양 그대로(넓히지 않음)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    const chip = page.locator('[data-testid="year-link"]').first();
    test.skip((await chip.count()) === 0, "year-link 없음");
    const after = await chip.evaluate((el) => { const a = getComputedStyle(el, "::after"); return { content: a.content, h: parseFloat(a.height) || 0, r: el.getBoundingClientRect().height }; });
    expect(after.content === "none" || after.content === "normal" || after.h <= after.r + 0.5, "덧칸이 없거나 요소보다 크지 않음(넓은 화면 모양 그대로)").toBe(true);
  });

  test("대상 밖 참고 — 같은 페이지의 그 밖 단추 · 따로 선 링크 중 44px 미만(제외 항목 · 문장 안 링크 · 목록 밖) 수를 기록(실패 아님)", async ({ page }) => {
    const report: string[] = [];
    for (const path of byPage) {
      await open(page, path);
      const small = await page.evaluate(() => {
        const ex = ['[data-testid="window-month"]'];
        return Array.from(document.querySelectorAll<HTMLElement>("main button, main a[href], header a, header button"))
          .filter((e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && !ex.some((q) => e.matches(q)) && !e.closest("p, li > p"); })
          .map((e) => { const r = e.getBoundingClientRect(); const af = getComputedStyle(e, "::after"); const ph = af.content !== "none" ? parseFloat(af.height) || 0 : 0; return { h: Math.max(r.height, ph), w: Math.max(r.width, af.content !== "none" ? parseFloat(af.width) || 0 : 0), label: `${e.tagName.toLowerCase()}${e.dataset.testid ? `[${e.dataset.testid}]` : ""} "${(e.getAttribute("aria-label") ?? e.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 20)}"` }; })
          .filter((x) => x.h < 43.5)
          .map((x) => `${x.label} ${Math.round(x.w)}×${Math.round(x.h)}`);
      });
      report.push(`${path}: ${[...new Set(small)].slice(0, 12).join(" · ") || "없음"}`);
    }
    test.info().annotations.push({ type: "44px 미만 그 밖 대상", description: report.join(" || ") });
    console.log("0268 그 밖 44px 미만 — " + report.join(" || "));
  });
});

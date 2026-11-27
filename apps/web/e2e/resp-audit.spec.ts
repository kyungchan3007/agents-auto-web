// 작업 0398 — 반응형 전수 점검 (a 가로 스크롤 · 화면 밖 · 글자 넘침 · 겹침 / b 나란한 칸 아래 끝 / c 899 이하 가운데 기둥 / d 구역 아래 빈 공간 / e 동적 변화 전후 높이 · 위치)
//   페이지: 홈(블프 장 · 기본 장 · 나라 고른 뒤) · /currencies · /currencies/USD · /currencies/JPY · /prices · /prices/JPN · VNM · FRA · MAC · /flights · /calc · /about · 404
//   폭 320 ~ 1600 20px 간격 × 보통 글꼴 · 넓은 글꼴 — 로컬은 이 spec 만(새 spec) · 넓은 화면 프로젝트에서만 돎(폭을 직접 맞춤)
//   RESP_AUDIT_LIST=1 이면 실패 없이 목록(.tmp/resp-audit/list-*.json) · 문제 폭 캡처(.tmp/resp-audit/shots)만 남김 — 평소에는 하나라도 있으면 실패
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { type Page, expect, test } from "@playwright/test";
import { forceDefaultHero } from "./default-hero";
import { type Violation, auditDom } from "./resp-audit-check";

const LIST = process.env.RESP_AUDIT_LIST === "1";
const OUT = resolve(process.cwd(), "../../.tmp/resp-audit");
const STEP = Number(process.env.RESP_AUDIT_STEP ?? 20); // 점검용: 더 성긴 간격(기본 20)
const ONLY = process.env.RESP_AUDIT_ONLY ? new RegExp(process.env.RESP_AUDIT_ONLY) : null; // 점검용: 이름이 맞는 것만
const WIDTHS = Array.from({ length: Math.floor(1280 / STEP) + 1 }, (_, i) => 320 + i * STEP).filter((w) => w <= 1600); // 320 ~ 1600
const WIDE_FONT = `*{font-family:"Arial Black","Verdana",sans-serif !important;letter-spacing:0.02em !important}`;

type Variant = { name: string; path: string; prep?: (page: Page) => Promise<void>; after?: (page: Page) => Promise<void> };
const VARIANTS: Variant[] = [
  {
    name: "home-bf",
    path: "/",
    // 블프 기간 장 — 지금 시각이 기간 안이라도 기간 밖이 되지 않게 시계를 앞으로 당기지 않고 그대로 둠(기간이 끝난 뒤에는 기간 안으로 되돌림)
    prep: async (page) => {
      await page.addInitScript(() => {
        const realNow = Date.now.bind(Date);
        const end = Date.parse("2026-12-01T17:00:00+09:00");
        const shift = realNow() >= end ? realNow() - (end - 86_400_000) : 0;
        if (shift > 0) Date.now = () => realNow() - shift;
      });
    },
  },
  { name: "home-default", path: "/", prep: forceDefaultHero },
  {
    name: "home-default-picked",
    path: "/",
    prep: forceDefaultHero,
    after: async (page) => {
      await expect(async () => {
        await page.locator('[data-testid="hero-chip"]').filter({ hasText: "방콕" }).first().click();
        await expect(page.locator('[data-testid="hero-pass"][data-s="0"]')).toHaveAttribute("data-city", "방콕", { timeout: 2000 });
      }).toPass({ timeout: 30_000 });
      await page.waitForTimeout(1200);
    },
  },
  { name: "currencies", path: "/currencies" },
  { name: "currency-USD", path: "/currencies/USD" },
  { name: "currency-JPY", path: "/currencies/JPY" },
  { name: "prices", path: "/prices" },
  { name: "prices-JPN", path: "/prices/JPN" },
  { name: "prices-VNM", path: "/prices/VNM" },
  { name: "prices-FRA", path: "/prices/FRA" },
  { name: "prices-MAC", path: "/prices/MAC" },
  { name: "flights", path: "/flights" },
  { name: "calc", path: "/calc" },
  { name: "about", path: "/about" },
  { name: "404", path: "/__no_such_page__" },
];

async function load(page: Page, v: Variant, wide: boolean) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("flapfx:intro-off", "1");
    } catch {}
  });
  await v.prep?.(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(v.path, { waitUntil: "load" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(600);
  if (v.after) await v.after(page);
  if (wide) await page.addStyleTag({ content: WIDE_FONT });
}

const settle = (page: Page) => page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 120)))));
const rangeText = (ws: number[]) => {
  const out: string[] = [];
  for (let i = 0; i < ws.length; ) {
    let j = i;
    while (j + 1 < ws.length && ws[j + 1] - ws[j] <= 20) j++;
    out.push(ws[i] === ws[j] ? `${ws[i]}` : `${ws[i]}~${ws[j]}`);
    i = j + 1;
  }
  return out.join(", ");
};

test.beforeEach(({ isMobile }) => {
  test.skip(isMobile, "폭을 직접 맞춰 재는 점검 — 넓은 화면 프로젝트에서만");
});

for (const v of VARIANTS.filter((x) => !ONLY || ONLY.test(x.name))) {
  for (const wide of [false, true]) {
    test(`${v.name} · ${wide ? "넓은 글꼴" : "보통 글꼴"} — 320 ~ 1600 (a 넘침 · 겹침 / b 두 칸 아래 끝 / c 가운데 기둥 / d 아래 빈 공간)`, async ({ page }) => {
      test.setTimeout(600_000);
      await load(page, v, wide);
      const groups = new Map<string, { item: string; key: string; widths: number[]; vals: number[] }>();
      let shots = 0;
      for (const w of WIDTHS) {
        await page.setViewportSize({ width: w, height: 900 });
        await settle(page);
        const vs: Violation[] = await page.evaluate(auditDom);
        for (const x of vs) {
          // 예외(lead 결정): /prices 목록 첫 구역 두 칸 아래 끝 차이 80px — 작업 0248 3번 사용자 확정 디자인(예산 카드 lg:-mb-20 으로 파랑 면 경계에 걸침) · 이 구역만 걸침 80px 까지
          if (v.name === "prices" && x.item === "b" && Math.abs(x.val) <= 121) continue; // (칸 안쪽 기준 — 왼쪽 칸 아래 안쪽 여백 40 + 걸침 80)
          const g = groups.get(`${x.item}|${x.key}`) ?? { item: x.item, key: x.key, widths: [], vals: [] };
          g.widths.push(w);
          g.vals.push(x.val);
          groups.set(`${x.item}|${x.key}`, g);
        }
        if (LIST && vs.length && shots < 6 && [320, 390, 600, 794, 900, 1024, 1124, 1440].some((s) => Math.abs(s - w) < 20)) {
          mkdirSync(`${OUT}/shots`, { recursive: true });
          await page.screenshot({ path: `${OUT}/shots/${v.name}${wide ? "-wide" : ""}-${w}.png`, fullPage: true });
          shots++;
        }
      }
      const rows = [...groups.values()].map((g) => ({ page: v.name, font: wide ? "넓은 글꼴" : "보통 글꼴", item: g.item, key: g.key, widths: rangeText(g.widths), max: Math.max(...g.vals.map(Math.abs)), count: g.widths.length }));
      if (LIST) {
        mkdirSync(OUT, { recursive: true });
        writeFileSync(`${OUT}/list-${v.name}${wide ? "-wide" : ""}.json`, JSON.stringify(rows, null, 1));
        return;
      }
      expect(rows.map((r) => `${r.item} ${r.key} · ${r.widths}px · 최대 ${r.max}`), `${v.name} 반응형 점검`).toEqual([]);
    });
  }
}

// e — 동적 변화: 스크롤로 구역이 화면에 들어오는 동안 문서 높이 · 구역 위치가 변하지 않음(첫 페이지 section.today 435 → 984 같은 것)
for (const v of VARIANTS.filter((x) => !ONLY || ONLY.test(x.name))) {
  test(`${v.name} · e 스크롤로 들어올 때 높이 · 구역 위치 변화 없음 (390 · 768 · 1280)`, async ({ page }) => {
    test.setTimeout(180_000);
    await page.addInitScript(() => {
      try {
        localStorage.setItem("flapfx:intro-off", "1");
      } catch {}
    });
    await v.prep?.(page);
    const rows: string[] = [];
    for (const w of [390, 768, 1280]) {
      // 폭마다 그 폭에서 새로 열어 잼(폭을 바꾸며 다시 맞추는 지연 흐름과 섞이지 않게 · 사용자는 한 폭에서 열어 스크롤함)
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(v.path, { waitUntil: "load" });
      await page.waitForLoadState("networkidle").catch(() => {});
      await page.waitForTimeout(800);
      // 글꼴 로딩 중(document.fonts.status=loading) 첫 그림 전 제목 줄 수 변화는 실패가 아니라 기록 밖(lead 결정 · 막는 방법이 빈 띠 · 기기별 값 · 브랜드 글꼴 손실 중 하나) — 글꼴이 준비된 뒤 값끼리 비교
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
      if (v.after) await v.after(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await settle(page);
      const snap = () =>
        page.evaluate(() => ({
          h: document.documentElement.scrollHeight,
          tops: [...document.querySelectorAll("main section, main > div > section")].map((s) => Math.round(s.getBoundingClientRect().top + window.scrollY)),
        }));
      const before = await snap();
      const total = before.h;
      for (let y = 0; y < total; y += 450) {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
        await page.waitForTimeout(140);
      }
      await page.waitForTimeout(900);
      await page.evaluate(() => window.scrollTo(0, 0));
      await settle(page);
      const after = await snap();
      if (Math.abs(after.h - before.h) > 1) rows.push(`${w}px 문서 높이 ${before.h} → ${after.h}`);
      before.tops.forEach((t, i) => {
        if (after.tops[i] !== undefined && Math.abs(after.tops[i] - t) > 1) rows.push(`${w}px 구역 ${i} 위치 ${t} → ${after.tops[i]}`);
      });
    }
    if (LIST) {
      mkdirSync(OUT, { recursive: true });
      writeFileSync(`${OUT}/list-e-${v.name}.json`, JSON.stringify(rows.map((r) => ({ page: v.name, item: "e", key: r })), null, 1));
      return;
    }
    expect(rows, `${v.name} 스크롤 전후 높이 · 위치`).toEqual([]);
  });
}

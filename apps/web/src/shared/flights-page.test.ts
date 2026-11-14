// 작업 0164 추가 — 여행 품목 영역을 /prices 에서 새 페이지 /flights 로 (메뉴 이름 '여행 타이밍' · 사용자 결정 2026-11-15)
// (테스트 먼저 · 구현 전에는 FAIL 이 정상) · e2e 는 돌리지 않으므로 단위 테스트로 경계를 확인
//
// builder 가 할 것
//   shared/site.ts: PUBLIC_PAGES 에 "/flights" 추가 (sitemap.ts 가 자동으로 포함)
//   shared/site-nav.tsx: Page 타입에 "flights" · 메뉴에 { href: "/flights", label: "여행 타이밍", current: page === "flights" } 추가 → 메뉴 7개
//   app/flights/page.tsx 새로 만듦: metadata 제목에 "여행 타이밍" · alternates.canonical "/flights" · 여행 품목 영역(TravelIndexSection)을 씀 · SiteNav page="flights"
//     (app/flights/ 안이나 features/travel-price/components/ 의 새 화면 컴포넌트 어디에 두든 됨 — 둘을 합쳐서 검사)
//   /prices (app/prices/page.tsx · price-page.tsx): TravelIndexSection · 여행 품목 API(kosis-cpi) 호출을 뺌 · /flights 로 가는 링크 한 줄(href="/flights")
//   geo 소유 파일(packages/shared/src/domain/geo-visit.ts 방문 집계 경로 목록)에 /flights 추가는 geo 가 함 — 여기서 검사하지 않음
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PUBLIC_PAGES } from "./site";

const SRC = resolve(__dirname, "..");
const read = (p: string) => readFileSync(join(SRC, p), "utf8");
const tsx = (dir: string): string[] => {
  const abs = join(SRC, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true }).flatMap((d) => {
    const rel = join(dir, d.name);
    if (d.isDirectory()) return tsx(rel);
    return /\.tsx?$/.test(d.name) && !/\.test\.tsx?$/.test(d.name) ? [rel] : [];
  });
};

describe("/flights — 검색 · 메뉴", () => {
  it("PUBLIC_PAGES 에 /flights 가 있음 (sitemap 자동 포함) · 기존 페이지는 그대로", () => {
    expect(PUBLIC_PAGES).toContain("/flights");
    for (const p of ["/", "/currencies", "/prices", "/calc", "/log", "/about", "/geo"]) expect(PUBLIC_PAGES).toContain(p);
  });

  it("상단 메뉴에 '여행 타이밍' → /flights · Page 타입에 flights · 메뉴는 7개", () => {
    const nav = read("shared/site-nav.tsx");
    expect(nav).toMatch(/href:\s*"\/flights"\s*,\s*label:\s*"여행 타이밍"/);
    expect(nav).toMatch(/page === "flights"/);
    expect(nav).toMatch(/export type Page\s*=[^;]*"flights"/);
    expect(nav.match(/\{\s*href:\s*"/g)?.length).toBe(7);
    expect(nav).toContain('label: "여행 물가"'); // 기존 메뉴는 그대로
  });
});

describe("/flights — 새 페이지", () => {
  it("app/flights/page.tsx 가 있고 제목 '여행 타이밍' · canonical /flights", () => {
    expect(existsSync(join(SRC, "app/flights/page.tsx"))).toBe(true);
    const page = read("app/flights/page.tsx");
    expect(page).toMatch(/title:\s*"[^"]*여행 타이밍/);
    expect(page).toMatch(/canonical:\s*"\/flights"/);
    expect(page).toMatch(/description:/);
  });

  it("여행 품목 영역(TravelIndexSection)을 /flights 쪽에서 씀 · SiteNav page=\"flights\"", () => {
    const files = [...tsx("app/flights"), ...tsx("features/travel-price/components")].filter((f) => !f.endsWith("travel-index-section.tsx") && !f.endsWith("price-page.tsx"));
    const text = files.map(read).join("\n");
    expect(text).toMatch(/TravelIndexSection/);
    expect(text).toMatch(/page="flights"/);
  });
});

describe("/prices — 여행 품목 영역을 뺌", () => {
  const prices = () => [read("app/prices/page.tsx"), read("features/travel-price/components/price-page.tsx")].join("\n");

  it("TravelIndexSection · 여행 품목 지수 호출(kosis-cpi · fxMonthlyAverage)이 /prices 에 없음", () => {
    const text = prices();
    expect(text).not.toMatch(/TravelIndexSection/);
    expect(text).not.toMatch(/kosis-cpi/);
    expect(text).not.toMatch(/fxMonthlyAverage/);
  });

  it("/flights 로 가는 링크 한 줄은 있음", () => {
    expect(prices()).toMatch(/href="\/flights"/);
  });

  it("그 밖의 /prices 내용(예산 · 가격대)은 그대로", () => {
    const text = prices();
    expect(text).toMatch(/BudgetPlanner/);
    expect(text).toMatch(/PriceBands/);
    expect(text).toMatch(/api\.priceLevels\(\)/);
  });
});

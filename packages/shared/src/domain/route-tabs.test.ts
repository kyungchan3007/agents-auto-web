// 작업 0360 — 나라별 물가 노선 탭: 탭별 노선 · 내 여행지 끼워 넣기 · 자 눈금 범위 · 고른 탭 기억 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구(request.md): 탭 = 물가 차이 큰 곳(기본 · 지금 정책 그대로: 싼 · 비슷 · 비싼 구간마다 물가 낮은 순 맨 위 두 나라 + 한국) · 많이 가는 곳 · 동남아 · 유럽 · 한국은 늘 기준역 ·
//   "많이 가는 곳" 은 공식 출국 통계 순위(docs/domain/travel-price.md · 한국관광공사 데이터랩 2025년 1~12월): 순위 순서대로 물가 자료가 있는 나라만 6곳(대만처럼 자료가 없으면 건너뛰고 다음 순위) ·
//   내 여행지는 그 노선에 없으면 정거장으로 더함 · 자 눈금 범위가 노선에 맞게 · 고른 탭은 브라우저에만 기억 · 지어내지 않음(자료 없는 나라는 정거장으로 만들지 않음)
//
// builder 가 만들 것 — packages/shared/src/domain/route-tabs.ts (+ package.json exports "./route-tabs") · 순수 함수
//   export type RouteTabId = "spread" | "popular" | "sea" | "eu"
//   export const DEFAULT_TAB: RouteTabId = "spread"
//   export const ROUTE_TAB_KEY = "flapfx:route-tab"
//   export const ROUTE_SIZE = 6                                  // 탭마다 나라 수(물가 차이 큰 곳은 구간 × 2)
//   export const SEA_COUNTRIES: readonly string[]                // ["VNM","THA","MYS","PHL","IDN","SGP"]  (TRAVEL_COUNTRIES 키)
//   export const EU_COUNTRIES: readonly string[]                 // ["ESP","ITA","FRA","DEU","GBR","CHE"]
//   export const POPULAR_RANKING: readonly string[]              // 공식 순위 순서: JPN VNM USA THA PHL TWN 그다음 HKG SGP MAC IDN (문서의 순위표 · "그다음" 줄)
//   export type RouteTab = { id: RouteTabId; label: string; note: string }
//   export function routeTabs(ranking?: readonly string[]): RouteTab[]   // 순서 spread · popular · sea · eu · 기본값 ranking = POPULAR_RANKING · ranking 이 비면(출처를 확인하지 못함) popular 탭 없음
//   export type RouteRow = { country: string; name: string; relative: number }
//   export type RouteStop = { country: string; name: string; value: number; mine: boolean }   // value = Math.round(relative × 100) · 한국 = { country: "KR", name: "한국", value: 100, mine: false }
//   export function routeOf(tab: RouteTabId, rows: RouteRow[], o?: { mine?: string | null; ranking?: readonly string[] }): RouteStop[]
//        값 오름차순 · 값이 같으면 한국이 앞 · 물가 자료(rows)에 없는 나라는 정거장으로 만들지 않음 · 나라가 하나도 없으면 [] (한국만 있는 노선을 만들지 않음)
//        spread: 싼(<0.9) · 비슷 · 비싼(>1.1) 구간마다 relative 낮은 두 나라 · sea/eu: 표의 나라 중 rows 에 있는 것 · popular: ranking 순서대로 rows 에 있는 나라 앞 6곳 · ranking 이 비면 spread 와 같음
//        mine: 노선에 없으면 값 순서 자리에 더함 · 이미 있으면 더하지 않고 표시만 · rows 에 없거나 한국이면 무시 · 표시한 정거장만 mine true
//   export function routeScale(tab: RouteTabId, values: number[]): { lo: number; hi: number }
//        spread(지금 그대로): lo = min(30, floor(최소/10)×10) · hi = max(120, ceil(최대/10)×10) · 나머지 탭: lo = floor((최소−6)/10)×10 · hi = ceil((최대+6)/10)×10 (노선에 맞게 · 값에는 한국 100 포함)
//   export function parseTab(raw: string | null | undefined, tabs: RouteTab[]): RouteTabId     // tabs 에 있는 id 만 · 아니면 DEFAULT_TAB
//   export function readTab(storage: Pick<Storage,"getItem"> | null | undefined, tabs: RouteTab[]): RouteTabId   // 저장소가 없거나 던지면 DEFAULT_TAB
//   export function writeTab(storage: Pick<Storage,"setItem"> | null | undefined, id: RouteTabId): boolean       // 저장소가 없거나 던지면 false
import { describe, expect, it } from "vitest";
import { TRAVEL_COUNTRIES } from "./travel";
import { DEFAULT_TAB, EU_COUNTRIES, POPULAR_RANKING, ROUTE_SIZE, ROUTE_TAB_KEY, SEA_COUNTRIES, parseTab, readTab, routeOf, routeScale, routeTabs, writeTab } from "./route-tabs";

const R = (country: string, relative: number) => ({ country, name: TRAVEL_COUNTRIES[country]?.name ?? country, relative });
// 싼 5 · 비슷 3(대만 .95 · 일본 .97 · 홍콩 1.05) · 비싼 8
const ROWS = [R("VNM", 0.46), R("IDN", 0.5), R("THA", 0.58), R("PHL", 0.6), R("MYS", 0.62), R("TWN", 0.95), R("JPN", 0.97), R("HKG", 1.05), R("ESP", 1.11), R("SGP", 1.15), R("ITA", 1.18), R("USA", 1.2), R("DEU", 1.31), R("FRA", 1.34), R("GBR", 1.49), R("CHE", 2.07)];
const view = (s: ReturnType<typeof routeOf>) => s.map((x) => `${x.country}:${x.value}`);

describe("탭 목록 (작업 0360)", () => {
  it("탭 넷 · 순서 물가 차이 큰 곳(기본) → 많이 가는 곳 → 동남아 → 유럽 · 글은 요구 원문 그대로", () => {
    const t = routeTabs();
    expect(t.map((x) => x.id)).toEqual(["spread", "popular", "sea", "eu"]);
    expect(t.map((x) => x.label)).toEqual(["물가 차이 큰 곳", "많이 가는 곳", "동남아", "유럽"]);
    expect(DEFAULT_TAB).toBe("spread");
    for (const x of t) expect(x.note, x.id).toMatch(/[가-힣]/);
    expect(t[0].note).toContain("지금 정책");
  });

  it("출처를 확인하지 못해 순위가 비면 '많이 가는 곳' 탭이 없고 나머지 셋만", () => {
    expect(routeTabs([]).map((x) => x.id)).toEqual(["spread", "sea", "eu"]);
  });
});

describe("나라 표 (작업 0360)", () => {
  it("동남아 · 유럽은 요구 원문의 여섯 나라 · 모두 TRAVEL_COUNTRIES 에 있음", () => {
    expect([...SEA_COUNTRIES].sort()).toEqual(["IDN", "MYS", "PHL", "SGP", "THA", "VNM"]);
    expect([...EU_COUNTRIES].sort()).toEqual(["CHE", "DEU", "ESP", "FRA", "GBR", "ITA"]);
    for (const c of [...SEA_COUNTRIES, ...EU_COUNTRIES, ...POPULAR_RANKING]) expect(TRAVEL_COUNTRIES[c], c).toBeTruthy();
  });

  it("많이 가는 곳 순위: 공식 통계 순서 — 일본 · 베트남 · 미국 · 태국 · 필리핀 · 대만, 그다음 홍콩 · 싱가포르 · 마카오 · 인도네시아", () => {
    expect([...POPULAR_RANKING]).toEqual(["JPN", "VNM", "USA", "THA", "PHL", "TWN", "HKG", "SGP", "MAC", "IDN"]);
    expect(ROUTE_SIZE).toBe(6);
  });
});

describe("탭별 노선 (작업 0360)", () => {
  it("물가 차이 큰 곳(기본) = 지금 정책: 구간마다 물가 낮은 두 나라 + 한국, 값 오름차순", () => {
    expect(view(routeOf("spread", ROWS))).toEqual(["VNM:46", "IDN:50", "TWN:95", "JPN:97", "KR:100", "ESP:111", "SGP:115"]);
  });

  it("동남아: 표의 나라 중 물가 자료가 있는 것 + 한국", () => {
    expect(view(routeOf("sea", ROWS))).toEqual(["VNM:46", "IDN:50", "THA:58", "PHL:60", "MYS:62", "KR:100", "SGP:115"]);
  });

  it("유럽: 한국이 가장 싼 쪽 · 나라는 유럽 평균이 아니라 나라별", () => {
    expect(view(routeOf("eu", ROWS))).toEqual(["KR:100", "ESP:111", "ITA:118", "DEU:131", "FRA:134", "GBR:149", "CHE:207"]);
  });

  it("많이 가는 곳: 순위 순서대로 앞 6곳(대만도 자료가 있으면 포함) + 한국", () => {
    expect(view(routeOf("popular", ROWS))).toEqual(["VNM:46", "THA:58", "PHL:60", "TWN:95", "JPN:97", "KR:100", "USA:120"]);
  });

  it("많이 가는 곳: 물가 자료가 없는 나라(대만)는 건너뛰고 다음 순위(홍콩) — 지어내지 않음", () => {
    const rows = ROWS.filter((r) => r.country !== "TWN");
    expect(view(routeOf("popular", rows))).toEqual(["VNM:46", "THA:58", "PHL:60", "JPN:97", "KR:100", "HKG:105", "USA:120"]);
  });

  it("많이 가는 곳: 자료가 있는 나라가 6곳보다 적으면 있는 만큼", () => {
    expect(view(routeOf("popular", [R("JPN", 0.97), R("VNM", 0.46)]))).toEqual(["VNM:46", "JPN:97", "KR:100"]);
  });

  it("자료에 없는 나라는 정거장으로 만들지 않음(동남아에서 필리핀 · 인도네시아 자료 없음)", () => {
    const rows = ROWS.filter((r) => !["PHL", "IDN"].includes(r.country));
    expect(view(routeOf("sea", rows))).toEqual(["VNM:46", "THA:58", "MYS:62", "KR:100", "SGP:115"]);
  });

  it("값이 한국과 같은(100) 나라는 한국 뒤 — 한국이 앞", () => {
    expect(view(routeOf("sea", [R("VNM", 0.46), R("THA", 1.0)]))).toEqual(["VNM:46", "KR:100", "THA:100"]);
  });

  it("나라가 하나도 없으면 [] (한국만 있는 노선을 만들지 않음)", () => {
    expect(routeOf("sea", [R("JPN", 0.97)])).toEqual([]);
    expect(routeOf("spread", [])).toEqual([]);
  });

  it("한국 정거장 모양 · 값은 relative × 100 을 반올림 (1.15 → 115)", () => {
    const s = routeOf("sea", ROWS);
    expect(s.find((x) => x.country === "KR")).toEqual({ country: "KR", name: "한국", value: 100, mine: false });
    expect(s.find((x) => x.country === "SGP")).toMatchObject({ name: "싱가포르", value: 115, mine: false });
  });
});

describe("내 여행지 끼워 넣기 (작업 0360)", () => {
  it("노선에 없는 나라는 정거장으로 더함 — 값 순서 자리에(유럽 노선에 일본 97 → 한국 앞) · 그 정거장만 mine", () => {
    const s = routeOf("eu", ROWS, { mine: "JPN" });
    expect(view(s)).toEqual(["JPN:97", "KR:100", "ESP:111", "ITA:118", "DEU:131", "FRA:134", "GBR:149", "CHE:207"]);
    expect(s.filter((x) => x.mine).map((x) => x.country)).toEqual(["JPN"]);
  });

  it("이미 노선에 있으면 더하지 않고 표시만 (베트남은 동남아에 있음)", () => {
    const s = routeOf("sea", ROWS, { mine: "VNM" });
    expect(view(s)).toEqual(view(routeOf("sea", ROWS)));
    expect(s.filter((x) => x.mine).map((x) => x.country)).toEqual(["VNM"]);
  });

  it("탭마다 들어감 — 같은 내 여행지가 다른 탭에서도(없으면 더하고 있으면 표시)", () => {
    for (const tab of ["spread", "popular", "sea", "eu"] as const) {
      const s = routeOf(tab, ROWS, { mine: "CHE" });
      expect(s.some((x) => x.country === "CHE" && x.mine), tab).toBe(true);
      expect(s.filter((x) => x.country === "CHE"), `${tab} 중복 없음`).toHaveLength(1);
    }
  });

  it("물가 자료에 없는 나라 · 한국 · 빈 값 · 모르는 코드는 무시(정거장을 만들지 않음)", () => {
    const base = view(routeOf("sea", ROWS));
    for (const mine of ["MAC", "KR", "KOR", "", null, undefined, "XXX"]) {
      const s = routeOf("sea", ROWS, { mine });
      expect(view(s), String(mine)).toEqual(base);
      expect(s.every((x) => !x.mine), String(mine)).toBe(true);
    }
  });

  it("mine 이 없으면 표시된 정거장이 없음", () => {
    expect(routeOf("spread", ROWS).every((x) => !x.mine)).toBe(true);
  });
});

describe("자 눈금 범위 (작업 0360)", () => {
  it("물가 차이 큰 곳(기본)은 지금 그대로: 30 ~ 120 · 값이 밖이면 10 단위로 넓힘", () => {
    expect(routeScale("spread", [46, 50, 95, 97, 100, 111, 115])).toEqual({ lo: 30, hi: 120 });
    expect(routeScale("spread", [26, 100, 207])).toEqual({ lo: 20, hi: 210 });
  });

  it("다른 탭은 노선에 맞게: 동남아 40 ~ 130 · 유럽 90 ~ 220 · 많이 가는 곳 40 ~ 130", () => {
    expect(routeScale("sea", [46, 50, 58, 60, 62, 100, 115])).toEqual({ lo: 40, hi: 130 });
    expect(routeScale("eu", [100, 111, 118, 131, 134, 149, 207])).toEqual({ lo: 90, hi: 220 });
    expect(routeScale("popular", [46, 58, 60, 95, 97, 100, 120])).toEqual({ lo: 40, hi: 130 });
  });

  it("모든 정거장이 범위 안 · 10 의 배수 · lo < hi (탭마다)", () => {
    for (const tab of ["spread", "popular", "sea", "eu"] as const) {
      const values = routeOf(tab, ROWS, { mine: "CHE" }).map((x) => x.value);
      const s = routeScale(tab, values);
      expect(s.lo % 10, `${tab} lo`).toBe(0);
      expect(s.hi % 10, `${tab} hi`).toBe(0);
      expect(s.lo, tab).toBeLessThan(s.hi);
      for (const v of values) expect(v >= s.lo && v <= s.hi, `${tab} ${v}`).toBe(true);
    }
  });
});

describe("고른 탭 기억 — 브라우저에만 (작업 0360)", () => {
  const tabs = routeTabs();
  const store = (init: Record<string, string> = {}) => {
    const m = new Map(Object.entries(init));
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
  };

  it("키는 flapfx:route-tab · 쓰고 읽으면 같은 탭", () => {
    expect(ROUTE_TAB_KEY).toBe("flapfx:route-tab");
    const s = store();
    expect(writeTab(s, "eu")).toBe(true);
    expect(s.m.get("flapfx:route-tab")).toBe("eu");
    expect(readTab(s, tabs)).toBe("eu");
  });

  it("저장값이 없거나 모르는 값 · 탭 목록에 없는 탭(순위를 못 정한 날의 popular)이면 기본 탭", () => {
    expect(readTab(store(), tabs)).toBe("spread");
    for (const raw of ["", "nope", "SEA", "{}", "null", " eu"]) expect(parseTab(raw, tabs), raw).toBe("spread");
    expect(parseTab(null, tabs)).toBe("spread");
    expect(parseTab("popular", routeTabs([]))).toBe("spread");
    expect(parseTab("popular", tabs)).toBe("popular");
  });

  it("저장소가 없거나 읽기 · 쓰기가 던져도 예외 없이 기본 탭 · false", () => {
    const boom = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(readTab(boom, tabs)).toBe("spread");
    expect(readTab(null, tabs)).toBe("spread");
    expect(writeTab(boom, "sea")).toBe(false);
    expect(writeTab(null, "sea")).toBe(false);
  });
});

// 작업 0217 — 새 홈 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 (모두 apps/web/src/features/home/lib/)
//   year-bars.ts      export type YearBar = { month: number; heightPct: number | null; tone: "high" | "low" | "mid" | "none" }
//                     export function yearBars(t: TravelTiming): YearBar[]     // ready 가 아니면 [] · 항상 12개(1~12월) · 값 없는 달은 { heightPct: null, tone: "none" }
//                       가장 비싼 달(t.priciest)=high · 가장 싼 달(t.cheapest)=low · 나머지 값 있는 달=mid · 높이는 가장 싼 달 20% ~ 가장 비싼 달 92% 사이 선형 (모두 같은 값이면 56%)
//   travel-timing.ts  export function heroParts(t: TravelTiming): { month: string; rest: string } | null   // ready 면 { month: "11월", rest: "에 떠나세요" } · 아니면 null (travelTimingCopy 의 title 과 같은 글)
//   dest-motion.ts    export function dotPosition(final: number, progress: number): number   // 막대 위 동그라미 위치 0~1 — 카운트업과 같은 시작 비율(최종의 85%)에서 최종 위치로 progress(0~1)만큼 · progress 1 이면 정확히 final · 범위 밖 progress 는 자름
//   destinations.ts   DestinationRowData 에 rateValue: number | null (baseRate 그대로) · rateDigits: 0 | 1 (baseRate ≥ 100 이면 0 · 아니면 1) — formatCount(rateValue, rateDigits) + "원" 이 rateText 와 같음 · 환율이 없으면 null · 0
//   today-board.ts · picked.ts   반환값에 percentile: number | null (판 아래 막대 길이 · 백분위 0~1) — 가장 싼 곳은 found.percentile · 없으면 null / 고른 나라는 그 통화 신호의 percentile · 없으면 null
import { formatCount } from "@hav/ui/lib/count-up";
import { describe, expect, it } from "vitest";
import { dotPosition } from "./dest-motion";
import { type SignalRow, cheapestDestination, destinationRows } from "./destinations";
import { pickedBoard } from "./picked";
import { todayBoard } from "./today-board";
import { heroParts, travelTiming } from "./travel-timing";
import { yearBars } from "./year-bars";

const pts = (vals: Record<number, number>) => Object.entries(vals).map(([m, v]) => ({ date: `2025-${String(m).padStart(2, "0")}-01`, value: v }));
const FULL = pts({ 1: 120, 2: 100, 3: 98, 4: 130, 5: 160, 6: 150, 7: 150, 8: 149, 9: 140, 10: 141, 11: 90, 12: 100 });

describe("yearBars — 12달 막대", () => {
  const bars = yearBars(travelTiming(FULL));
  it("항상 12개 · 1~12월 순서", () => {
    expect(bars.map((b) => b.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
  it("가장 비싼 달 = high(92%) · 가장 싼 달 = low(20%) — 실제 자료 계산과 같음", () => {
    const t = travelTiming(FULL);
    if (t.kind !== "ready") throw new Error("ready 여야 함");
    const hi = bars.find((b) => b.tone === "high");
    const lo = bars.find((b) => b.tone === "low");
    expect(hi?.month).toBe(t.priciest);
    expect(lo?.month).toBe(t.cheapest);
    expect(hi?.heightPct).toBeCloseTo(92, 5);
    expect(lo?.heightPct).toBeCloseTo(20, 5);
    expect(bars.filter((b) => b.tone === "high")).toHaveLength(1);
    expect(bars.filter((b) => b.tone === "low")).toHaveLength(1);
  });
  it("나머지는 mid · 높이가 값 순서와 같음(선형) · 20~92 사이", () => {
    const t = travelTiming(FULL);
    if (t.kind !== "ready") throw new Error("ready 여야 함");
    for (const b of bars.filter((x) => x.tone === "mid")) {
      expect(b.heightPct).toBeGreaterThan(20);
      expect(b.heightPct).toBeLessThan(92);
    }
    const avg = (m: number) => t.months.find((x) => x.month === m)?.avg ?? 0;
    const h = (m: number) => bars.find((x) => x.month === m)?.heightPct ?? 0;
    expect(avg(4) > avg(1)).toBe(h(4) > h(1));
    expect(avg(2) > avg(3)).toBe(h(2) > h(3));
  });
  it("값 없는 달은 none · 높이 null (지어내지 않음)", () => {
    const partial = yearBars(travelTiming(pts({ 3: 100, 5: 150, 9: 120 })));
    expect(partial).toHaveLength(12);
    expect(partial.find((b) => b.month === 1)).toMatchObject({ tone: "none", heightPct: null });
    expect(partial.find((b) => b.month === 5)?.tone).toBe("high");
    expect(partial.find((b) => b.month === 3)?.tone).toBe("low");
  });
  it("자료가 모자라면(ready 아님) 빈 배열", () => {
    expect(yearBars({ kind: "preparing" })).toEqual([]);
    expect(yearBars(travelTiming(pts({ 3: 100 })))).toEqual([]);
  });
  it("모두 같은 값이면 높이 56% · high 와 low 가 겹치지 않음", () => {
    const flat = yearBars(travelTiming(pts({ 1: 100, 2: 100, 3: 100 })));
    for (const b of flat.filter((x) => x.tone !== "none")) expect(b.heightPct).toBe(56);
    const hi = flat.find((b) => b.tone === "high");
    const lo = flat.find((b) => b.tone === "low");
    expect(hi && lo && hi.month !== lo.month).toBe(true);
  });
});

describe("heroParts — 큰 제목 (월만 노랑)", () => {
  it("ready 면 월과 나머지", () => {
    const t = travelTiming(FULL);
    if (t.kind !== "ready") throw new Error("ready 여야 함");
    expect(heroParts(t)).toEqual({ month: `${t.cheapest}월`, rest: "에 떠나세요" });
  });
  it("자료가 없으면 null", () => {
    expect(heroParts({ kind: "preparing" })).toBeNull();
  });
});

describe("dotPosition — 동그라미가 카운트업과 같이 움직임", () => {
  it("progress 1 = 정확히 최종 · 0 = 최종의 85%", () => {
    expect(dotPosition(0.12, 1)).toBe(0.12);
    expect(dotPosition(0.12, 0)).toBeCloseTo(0.102, 6);
    expect(dotPosition(0.5, 1)).toBe(0.5);
  });
  it("중간은 둘 사이 · 단조 증가 · 범위 밖 progress 는 자름", () => {
    expect(dotPosition(0.4, 0.5)).toBeGreaterThan(dotPosition(0.4, 0));
    expect(dotPosition(0.4, 0.5)).toBeLessThan(0.4);
    expect(dotPosition(0.4, 5)).toBe(0.4);
    expect(dotPosition(0.4, -1)).toBe(dotPosition(0.4, 0));
  });
  it("0 은 0 그대로", () => {
    expect(dotPosition(0, 0.3)).toBe(0);
  });
});

const DEST = [
  { id: "tokyo", name: "도쿄", currency: "JPY", country: "JPN" },
  { id: "bangkok", name: "방콕", currency: "THB", country: "THA" },
  { id: "paris", name: "파리", currency: "EUR", country: "FRA" },
];
const RATES = [
  { currency: "JPY", unit: 100, baseRate: 912.34 },
  { currency: "THB", unit: 1, baseRate: 39.84 },
  { currency: "EUR", unit: 1, baseRate: 1486.2 },
];
const sig = (currency: string, signal: SignalRow["signal"], percentile: number | null): SignalRow => ({ currency, signal, reason: signal ? "ok" : "data-short", percentile });
const SIGNALS = [sig("JPY", "cheap", 0.12), sig("THB", "cheap", 0.25), sig("EUR", "normal", 0.5)];

describe("destinationRows — 금액 카운트업용 숫자", () => {
  const rows = destinationRows(SIGNALS, RATES, DEST);
  it("rateValue · rateDigits — 100 이상은 정수 · 미만은 소수 한 자리", () => {
    expect(rows.map((r) => [r.rateValue, r.rateDigits])).toEqual([[912.34, 0], [39.84, 1], [1486.2, 0]]);
  });
  it("formatCount(rateValue, rateDigits) + 원 = rateText (카운트업 끝 값 = 지금 글)", () => {
    for (const r of rows) expect(`${formatCount(r.rateValue as number, r.rateDigits)}원`).toBe(r.rateText);
  });
  it("환율이 없으면 null · 0", () => {
    const none = destinationRows(SIGNALS, [], DEST);
    expect(none[0]).toMatchObject({ rateValue: null, rateDigits: 0, rateText: null });
  });
});

describe("판 아래 막대 길이 — percentile", () => {
  it("가장 싼 곳(todayBoard)은 found.percentile · 없으면 null", () => {
    const found = cheapestDestination(SIGNALS, RATES, DEST);
    expect(todayBoard({ found, hasRates: true, windowDays: 90 }).percentile).toBe(0.12);
    expect(todayBoard({ found: null, hasRates: true, windowDays: 90 }).percentile).toBeNull();
    expect(todayBoard({ found: null, hasRates: false, windowDays: 90 }).percentile).toBeNull();
  });
  it("고른 나라(pickedBoard)는 그 통화 신호의 percentile · 신호가 없으면 null", () => {
    const base = { city: "방콕", budget: 0, fromCity: "서울" } as never;
    const picked = { ...(base as object), country: "THA", city: "방콕", budget: 0 } as never;
    expect(pickedBoard({ picked, rates: RATES, signals: SIGNALS, windowDays: 90 })?.percentile).toBe(0.25);
    expect(pickedBoard({ picked, rates: RATES, signals: [], windowDays: 90 })?.percentile).toBeNull();
  });
});

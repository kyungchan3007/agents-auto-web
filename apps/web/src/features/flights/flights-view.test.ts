// 작업 0218 — 새 /flights 머리 글자판 · 탑승권 숫자 · 한 줄 띠 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/web/src/features/flights/flights-view.ts   (IndexPoint 는 travel-index.ts 것)
//   latestNumbers(points): { period: string; month: number; value: number; yoy: number | null } | null
//     가장 최근 달의 지수(value · 받은 그대로) · month(1~12) · yoy = 작년 같은 달 대비 % (작년 값이 없거나 0 이하면 null) · 자료가 없으면 null
//   flapLine(name: string, value: string, cols: number): { text: string; whiteUntil: number }
//     이름은 왼쪽(흰 글자 칸) · 값은 오른쪽(노랑) · 사이는 빈 칸 · text 길이(코드 포인트)는 정확히 cols · whiteUntil = 이름 글자 수 · 이름이 너무 길면 이름을 줄임(…) — 값은 줄이지 않음
//   flightsBoard(a: { airCheap: number | null; tourCheap: number | null; air: IndexPoint[] | null; tour: IndexPoint[] | null }): { rows: { text: string; whiteUntil: number }[]; cols: number; label: string } | null
//     줄(있는 것만, 이 순서): "가장 싼 달" + (달이 같으면 "11월" · 다르면 "11월 · 3월" 항공료 달 먼저) / "국제항공료" + 최신 항공료 지수 소수 첫째 자리 / "단체여행비" + 최신 단체여행비 지수
//     cols = 12 이상 · 가장 긴 줄이 12 를 넘으면 그 길이 · 줄이 하나도 없으면 null (판을 그리지 않음 · 숫자를 지어내지 않음)
//     label = 한 문장 — "가장 싼 달은 11월입니다. 국제항공료 지수 146.8 · 해외단체여행비 지수 139.2" (없는 항목은 뺌)
//   stripStats(air: IndexPoint[] | null, fx: IndexPoint[]): { max: IndexPoint; min: IndexPoint; fx: IndexPoint | null } | null
//     최근 36개월 안(마지막 달에서 35달 전부터)의 항공료 최고 · 최저(같은 값이면 앞선 달 · flights-graph-view 의 seriesStats 와 같은 규칙) · fx = 가장 최근 달의 원/달러 월평균 · 항공료가 없으면 null
import { describe, expect, it } from "vitest";
import { flapLine, flightsBoard, latestNumbers, stripStats } from "./flights-view";

const pts = (rows: [string, number][]) => rows.map(([period, value]) => ({ period, value }));
const AIR = pts([["2025-10", 121.7], ["2025-11", 118.8], ["2026-09", 150], ["2026-10", 146.8]]);
const TOUR = pts([["2025-10", 124.8], ["2026-10", 139.2]]);

describe("latestNumbers", () => {
  it("최신 달 · 값 · 작년 대비 %", () => {
    const n = latestNumbers(AIR);
    expect(n).toMatchObject({ period: "2026-10", month: 10, value: 146.8 });
    expect(n?.yoy).toBeCloseTo((146.8 / 121.7 - 1) * 100, 6);
  });
  it("작년 값이 없으면 yoy null · 자료가 없으면 null", () => {
    expect(latestNumbers(pts([["2026-10", 100]]))?.yoy).toBeNull();
    expect(latestNumbers(pts([["2025-10", 0], ["2026-10", 100]]))?.yoy).toBeNull();
    expect(latestNumbers([])).toBeNull();
    expect(latestNumbers(null)).toBeNull();
  });
  it("순서가 섞여 있어도 가장 최근 달", () => {
    expect(latestNumbers(pts([["2026-10", 1], ["2025-10", 2]]))?.period).toBe("2026-10");
  });
});

describe("flapLine", () => {
  it("이름 왼쪽 · 값 오른쪽 · 길이 정확히 cols", () => {
    const l = flapLine("국제항공료", "146.8", 12);
    expect(Array.from(l.text)).toHaveLength(12);
    expect(l.text.startsWith("국제항공료")).toBe(true);
    expect(l.text.endsWith("146.8")).toBe(true);
    expect(l.whiteUntil).toBe(5);
    expect(l.text.slice(5, 7).trim()).toBe("");
  });
  it("이름이 너무 길면 이름을 줄임 — 값은 그대로", () => {
    const l = flapLine("아주아주긴이름입니다", "146.8", 12);
    expect(Array.from(l.text)).toHaveLength(12);
    expect(l.text.endsWith("146.8")).toBe(true);
    expect(l.text).toContain("…");
    expect(l.whiteUntil).toBeLessThanOrEqual(6);
  });
});

describe("flightsBoard", () => {
  it("세 줄 — 가장 저렴한 달 · 국제항공료 · 단체여행비 (실제 최신 값)", () => {
    const b = flightsBoard({ airCheap: 11, tourCheap: 11, air: AIR, tour: TOUR });
    expect(b?.rows).toHaveLength(3);
    expect(b?.rows[0].text.startsWith("가장 저렴한 달")).toBe(true);
    expect(b?.rows[0].text.trimEnd().endsWith("11월")).toBe(true);
    expect(b?.rows[1].text.trimEnd().endsWith("146.8")).toBe(true);
    expect(b?.rows[2].text.trimEnd().endsWith("139.2")).toBe(true);
    expect(b?.rows[2].text.startsWith("단체여행비")).toBe(true);
    expect(b?.cols).toBe(12);
    expect(b?.label).toBe("가장 저렴한 달은 11월입니다. 국제항공료 지수 146.8 · 해외단체여행비 지수 139.2");
  });
  it("달이 다르면 '11월 · 3월' (항공료 달 먼저) · 칸 수가 늘어남", () => {
    const b = flightsBoard({ airCheap: 11, tourCheap: 3, air: AIR, tour: TOUR });
    expect(b?.rows[0].text.trimEnd().endsWith("11월 · 3월")).toBe(true);
    expect(b?.cols).toBeGreaterThanOrEqual(12);
    for (const r of b?.rows ?? []) expect(Array.from(r.text)).toHaveLength(b?.cols ?? 0);
    expect(b?.label.startsWith("가장 저렴한 달은 11월 · 3월입니다.")).toBe(true);
  });
  it("없는 항목은 줄 · 문장에서 뺌 (지어내지 않음)", () => {
    const b = flightsBoard({ airCheap: 11, tourCheap: null, air: AIR, tour: null });
    expect(b?.rows).toHaveLength(2);
    expect(b?.label).toBe("가장 저렴한 달은 11월입니다. 국제항공료 지수 146.8");
  });
  it("아무 값도 없으면 null", () => {
    expect(flightsBoard({ airCheap: null, tourCheap: null, air: null, tour: null })).toBeNull();
    expect(flightsBoard({ airCheap: null, tourCheap: null, air: [], tour: [] })).toBeNull();
  });
  it("모든 줄 길이 = cols · 이름 칸 수 = whiteUntil", () => {
    const b = flightsBoard({ airCheap: 11, tourCheap: 11, air: AIR, tour: TOUR });
    for (const r of b?.rows ?? []) {
      expect(Array.from(r.text)).toHaveLength(b?.cols ?? 0);
      expect(r.whiteUntil).toBeGreaterThan(0);
    }
  });
});

describe("stripStats", () => {
  const air = pts([["2024-12", 100], ["2025-05", 90], ["2026-05", 158.6], ["2026-10", 146.8]]);
  const fx = pts([["2026-09", 1340], ["2026-10", 1341]]);
  it("최고 · 최저 · 환율 최신", () => {
    const s = stripStats(air, fx);
    expect(s?.max).toEqual({ period: "2026-05", value: 158.6 });
    expect(s?.min).toEqual({ period: "2025-05", value: 90 });
    expect(s?.fx).toEqual({ period: "2026-10", value: 1341 });
  });
  it("36개월보다 오래된 값은 세지 않음", () => {
    const old = pts([["2020-01", 999], ["2024-12", 100], ["2026-10", 120]]);
    expect(stripStats(old, [])?.max.value).toBe(120);
  });
  it("환율이 없으면 fx null · 항공료가 없으면 null", () => {
    expect(stripStats(air, [])?.fx).toBeNull();
    expect(stripStats(null, fx)).toBeNull();
    expect(stripStats([], fx)).toBeNull();
  });
});

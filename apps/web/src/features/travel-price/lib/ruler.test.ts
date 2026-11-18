// 작업 0220 — 새 /prices 의 한국 = 100 물가 자 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/web/src/features/travel-price/lib/ruler.ts
//   rulerScale(values: number[]): { lo: number; hi: number }
//     값은 물가(한국 = 100 · relative × 100 반올림) · 기본 30 ~ 120 · 값이 그 밖이면 10 단위로 넓힘 (lo = min(30, floor(최저/10)×10) · hi = max(120, ceil(최고/10)×10))
//   rulerX(value: number, s: { lo: number; hi: number }): number      // 자 위 위치 0 ~ 100 (%) = (값 − lo) / (hi − lo) × 100 · 범위 밖은 자름
//   rulerSegments(s): { cheapEnd: number; priceyStart: number }       // 싼 칸이 끝나는 · 비싼 칸이 시작하는 위치(%) = rulerX(90) · rulerX(110) (BAND_EDGE × 100)
//   rulerPins(bands: { rows: { country: string; name: string; relative: number }[] }[], perBand = 2): { country: string; name: string; value: number; x: number; side: "up" | "down" }[]
//     표의 구간마다 맨 위 perBand 나라(지금 세 칸 표의 맨 위 줄들 · 실제 자료) · value = Math.round(relative × 100) (표의 "물가 N" 과 같음) · 값 오름차순 · 옆 나라는 위 · 아래 번갈아(첫 핀은 위)
//     x 는 모든 핀의 값으로 만든 자(rulerScale)에서의 위치 · 나라가 하나도 없으면 []
import { describe, expect, it } from "vitest";
import { rulerPins, rulerScale, rulerSegments, rulerX } from "./ruler";

describe("rulerScale · rulerX", () => {
  it("기본 30 ~ 120", () => {
    expect(rulerScale([37, 46, 94, 111])).toEqual({ lo: 30, hi: 120 });
    expect(rulerScale([])).toEqual({ lo: 30, hi: 120 });
  });
  it("밖의 값이 있으면 10 단위로 넓힘", () => {
    expect(rulerScale([22, 100])).toEqual({ lo: 20, hi: 120 });
    expect(rulerScale([40, 131])).toEqual({ lo: 30, hi: 140 });
  });
  it("위치 = (값 − lo) / (hi − lo) × 100 · 범위 밖은 자름", () => {
    const s = { lo: 30, hi: 120 };
    expect(rulerX(37, s)).toBeCloseTo((7 / 90) * 100, 8);
    expect(rulerX(100, s)).toBeCloseTo((70 / 90) * 100, 8);
    expect(rulerX(10, s)).toBe(0);
    expect(rulerX(500, s)).toBe(100);
  });
  it("싼 칸 끝 = 90 · 비싼 칸 시작 = 110 (BAND_EDGE)", () => {
    const g = rulerSegments({ lo: 30, hi: 120 });
    expect(g.cheapEnd).toBeCloseTo((60 / 90) * 100, 8);
    expect(g.priceyStart).toBeCloseTo((80 / 90) * 100, 8);
  });
});

describe("rulerPins — 표의 맨 위 나라들", () => {
  const row = (country: string, name: string, relative: number) => ({ country, name, relative });
  const BANDS = [
    { rows: [row("IND", "인도", 0.37), row("VNM", "베트남", 0.46), row("XXX", "셋째", 0.5)] },
    { rows: [row("HUN", "헝가리", 0.94), row("MEX", "멕시코", 0.95)] },
    { rows: [row("ESP", "스페인", 1.11), row("ARE", "아랍에미리트", 1.11)] },
  ];
  const pins = rulerPins(BANDS);
  it("구간마다 맨 위 2나라 · 값 오름차순 · 값 = round(relative × 100)", () => {
    expect(pins.map((p) => p.name)).toEqual(["인도", "베트남", "헝가리", "멕시코", "스페인", "아랍에미리트"]);
    expect(pins.map((p) => p.value)).toEqual([37, 46, 94, 95, 111, 111]);
  });
  it("위 · 아래 번갈아 (첫 핀은 위) — 옆 핀은 같은 쪽이 아님", () => {
    expect(pins.map((p) => p.side)).toEqual(["up", "down", "up", "down", "up", "down"]);
  });
  it("x 는 자 위치", () => {
    expect(pins[0].x).toBeCloseTo(rulerX(37, { lo: 30, hi: 120 }), 8);
    expect(pins[4].x).toBeCloseTo(rulerX(111, { lo: 30, hi: 120 }), 8);
  });
  it("perBand 로 개수를 바꿈 · 값 같으면 입력 순서", () => {
    expect(rulerPins(BANDS, 1).map((p) => p.name)).toEqual(["인도", "헝가리", "스페인"]);
    expect(pins[4].name).toBe("스페인");
  });
  it("나라가 없으면 []", () => {
    expect(rulerPins([])).toEqual([]);
    expect(rulerPins([{ rows: [] }])).toEqual([]);
  });
  it("값이 밖이면 자가 넓어져 x 가 0 ~ 100 안", () => {
    const p = rulerPins([{ rows: [row("A", "가", 0.2)] }, { rows: [row("B", "나", 1.4)] }]);
    for (const x of p.map((q) => q.x)) expect(x).toBeGreaterThanOrEqual(0), expect(x).toBeLessThanOrEqual(100);
  });
});

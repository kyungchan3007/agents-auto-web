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

// 작업 0220 lead 지시(휴대폰 '한국 = 100' 자 라벨 겹침) — 라벨이 겹치면 한 줄(tier) 더 떨어뜨림 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//   rulerTiers(pins: { country: string; name: string; x: number; side: "up" | "down" }[], widthPx = 296): Record<string, number>
//     같은 쪽(side)에서 x 순서대로 — 앞 라벨들과 겹치지 않는 가장 가까운 tier(0 = 자에 가장 가까움)에 놓음 · 라벨 폭 추정 = max(이름 글자 수 × 14.5, 36) + 8 · 겹침 = |Δx(px)| < (폭1 + 폭2) / 2
//   rulerMaxTier(tiers): number   // 가장 큰 tier (자 높이를 정함)
import { rulerMaxTier, rulerTiers } from "./ruler";

describe("rulerTiers — 겹치는 라벨은 한 줄 더 떨어뜨림", () => {
  const pin = (country: string, name: string, x: number, side: "up" | "down") => ({ country, name, x, side });
  it("멀리 떨어진 라벨은 모두 tier 0", () => {
    const t = rulerTiers([pin("A", "인도", 5, "up"), pin("B", "베트남", 40, "down"), pin("C", "스페인", 90, "up")]);
    expect(t).toEqual({ A: 0, B: 0, C: 0 });
    expect(rulerMaxTier(t)).toBe(0);
  });
  it("같은 쪽에서 가까운 라벨은 다른 tier", () => {
    const t = rulerTiers([pin("A", "헝가리", 71, "down"), pin("B", "아랍에미리트", 90, "down")], 296);
    expect(t.A).toBe(0);
    expect(t.B).toBe(1); // 296px 에서 19% = 56px < (46 + 95) / 2
  });
  it("다른 쪽(위 · 아래)끼리는 겹침으로 안 봄", () => {
    const t = rulerTiers([pin("A", "헝가리", 71, "up"), pin("B", "아랍에미리트", 72, "down")]);
    expect(t).toEqual({ A: 0, B: 0 });
  });
  it("같은 자리에 셋이면 tier 0 · 1 · 2", () => {
    const t = rulerTiers([pin("A", "일본", 50, "up"), pin("B", "대만", 50, "up"), pin("C", "태국", 50, "up")]);
    expect(Object.values(t).sort()).toEqual([0, 1, 2]);
    expect(rulerMaxTier(t)).toBe(2);
  });
  it("같은 tier 안의 라벨끼리는 추정 폭으로 겹치지 않음 (실제 자료 모양의 여섯 점)", () => {
    const pins = [pin("IND", "인도", 7.8, "up"), pin("VNM", "베트남", 17.8, "down"), pin("PRT", "포르투갈", 70, "up"), pin("HUN", "헝가리", 71.1, "down"), pin("ESP", "스페인", 90, "up"), pin("ARE", "아랍에미리트", 90, "down")];
    const t = rulerTiers(pins, 296);
    const w = (n: string) => Math.max(n.length * 14.5, 36) + 8;
    for (const a of pins) for (const b of pins) {
      if (a.country >= b.country || a.side !== b.side || t[a.country] !== t[b.country]) continue;
      expect(Math.abs(a.x - b.x) * 2.96, `${a.name} ~ ${b.name}`).toBeGreaterThanOrEqual((w(a.name) + w(b.name)) / 2);
    }
  });
  it("값이 같아도 항상 같은 결과", () => {
    const pins = [pin("A", "헝가리", 71, "down"), pin("B", "아랍에미리트", 90, "down")];
    expect(rulerTiers(pins)).toEqual(rulerTiers(pins));
  });
});

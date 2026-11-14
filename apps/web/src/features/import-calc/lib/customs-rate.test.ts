// 작업 0163 — 계산기가 쓸 환율 고르기 · 과세환율 vs 수출입은행 차이 · "준비 중" (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/web/src/features/import-calc/lib/customs-rate.ts (순수 함수 · 화면 상태 없음)
//   import type { Rate } from "./calc"                                  // { baseRate: number; unit: number } — 수출입은행 값 (unit 당 원)
//   export type CustomsRate = { perUnit: number /* 외화 1단위당 원 */; weekStart: string /* YYYY-MM-DD 적용 시작일(일요일) */ }
//   export type RateSource = { kind: "customs"; weekStart: string; label: string } | { kind: "bank"; label: string }
//
//   pickRate(currency, bank: Record<string, Rate>, customs: Record<string, CustomsRate> | null | undefined, today: string /* 한국 날짜 */)
//       : { rate: Rate; source: RateSource } | null
//     - 그 통화의 과세환율이 있고 "이번 주"(today 가 속한 일요일 시작 주)면 → rate = { baseRate: perUnit, unit: 1 } · source.kind "customs" ·
//       label 에 "관세청 과세환율" 과 고시 주(weekStart) 가 들어감 (IMP-02: 출처 · 고시 주 표시)
//     - 없거나 지난 주 값이면 → 수출입은행 값 그대로 · source.kind "bank" · label 에 "수출입은행" 과 "예상" 이 들어감 (IMP-04)
//     - 둘 다 없으면 null (지어내지 않음)
//   customsGap(customs: CustomsRate, bank: Rate)
//       : { unit: number; customs: number; bank: number; gapKrw: number; gapPct: number }
//     - 수출입은행 고시 단위(bank.unit)에 맞춰 비교 — customs = perUnit × unit · bank = baseRate · gapKrw = customs − bank · gapPct = gapKrw / bank × 100
//   customsView(points: { period: string; value: number }[] | null | undefined, bank: Rate | null | undefined)
//       : { kind: "preparing" } | { kind: "ready"; latest: { period: string; value: number }; trend: { period: string; value: number }[]; gap: ReturnType<typeof customsGap> | null }
//     - points 가 없거나 비었으면 { kind: "preparing" } ("준비 중" · 숫자 없음)
//     - 있으면 trend = period 오름차순 · latest = 가장 최근 · bank 가 있으면 gap(latest 기준) 아니면 null
import { describe, expect, it } from "vitest";
import { calc } from "./calc";
import { type CustomsRate, customsGap, customsView, pickRate } from "./customs-rate";

const TODAY = "2026-11-18"; // 수요일 · 이 주 일요일 시작 = 2026-11-15
const BANK = { USD: { baseRate: 1400, unit: 1 }, JPY: { baseRate: 900, unit: 100 }, EUR: { baseRate: 1500, unit: 1 } };
const CUSTOMS: Record<string, CustomsRate> = {
  USD: { perUnit: 1410.5, weekStart: "2026-11-15" },
  JPY: { perUnit: 9.27, weekStart: "2026-11-15" },
};

describe("pickRate — 과세환율 우선, 없으면 수출입은행", () => {
  it("이번 주 과세환율이 있으면 그것 · 출처에 '관세청 과세환율' 과 고시 주", () => {
    const r = pickRate("USD", BANK, CUSTOMS, TODAY);
    expect(r?.rate).toEqual({ baseRate: 1410.5, unit: 1 });
    expect(r?.source.kind).toBe("customs");
    expect(r?.source.label).toContain("관세청 과세환율");
    expect(r?.source.label).toContain("2026-11-15");
  });

  it("그 통화의 과세환율이 없으면 수출입은행 값 · 출처에 '수출입은행' 과 '예상' 안내", () => {
    const r = pickRate("EUR", BANK, CUSTOMS, TODAY);
    expect(r?.rate).toEqual({ baseRate: 1500, unit: 1 });
    expect(r?.source.kind).toBe("bank");
    expect(r?.source.label).toContain("수출입은행");
    expect(r?.source.label).toContain("예상");
  });

  it("과세환율 자료 자체가 없으면(null · undefined · 빈 객체) 지금처럼 수출입은행", () => {
    for (const c of [null, undefined, {}]) expect(pickRate("USD", BANK, c, TODAY)?.source.kind, String(c)).toBe("bank");
  });

  it("지난 주 과세환율은 쓰지 않음 (이번 주 고시가 아직 없는 때 · 낡은 값으로 세금을 어림하지 않음)", () => {
    const old = { USD: { perUnit: 1390, weekStart: "2026-11-08" } };
    const r = pickRate("USD", BANK, old, TODAY);
    expect(r?.source.kind).toBe("bank");
    expect(r?.rate).toEqual(BANK.USD);
  });

  it("일요일(그 주 시작)과 토요일(그 주 끝)도 이번 주", () => {
    for (const today of ["2026-11-15", "2026-11-21"]) expect(pickRate("USD", BANK, CUSTOMS, today)?.source.kind, today).toBe("customs");
    expect(pickRate("USD", BANK, CUSTOMS, "2026-11-22")?.source.kind).toBe("bank"); // 다음 주 일요일부터는 지난 주
  });

  it("둘 다 없는 통화 → null (환율을 지어내지 않음)", () => {
    expect(pickRate("XYZ", BANK, CUSTOMS, TODAY)).toBeNull();
  });

  it("고른 환율을 calc 에 그대로 넣어 계산 — 과세환율 1410.5 로 250달러 = 352,625원", () => {
    const picked = pickRate("USD", BANK, CUSTOMS, TODAY);
    const rates = { USD: picked!.rate };
    const r = calc({ currency: "USD", price: "250", shipping: "", dutyRate: "", route: "us-list" }, rates);
    expect(r).toMatchObject({ ok: true, priceKrw: 352_625, over: true });
  });

  it("JPY 과세환율(1엔당 9.27원)도 calc 에서 같은 값 — 20,000엔 = 185,400원", () => {
    const picked = pickRate("JPY", BANK, CUSTOMS, TODAY);
    const rates = { USD: BANK.USD, JPY: picked!.rate };
    expect(calc({ currency: "JPY", price: "20000", shipping: "", dutyRate: "", route: "other" }, rates)).toMatchObject({ ok: true, priceKrw: 185_400 });
  });
});

describe("customsGap — 단위를 맞춰 비교", () => {
  it("USD(단위 1): 과세 1410.5 vs 은행 1400 → +10.5원 · +0.75%", () => {
    const g = customsGap(CUSTOMS.USD, BANK.USD);
    expect(g.unit).toBe(1);
    expect(g.customs).toBeCloseTo(1410.5);
    expect(g.bank).toBe(1400);
    expect(g.gapKrw).toBeCloseTo(10.5);
    expect(g.gapPct).toBeCloseTo(0.75, 5);
  });

  it("JPY(단위 100): 과세 1엔당 9.27 → 100엔당 927 · 은행 900 → +27원 · +3% (단위를 안 맞추면 9.27 vs 900 이 됨)", () => {
    const g = customsGap(CUSTOMS.JPY, BANK.JPY);
    expect(g.unit).toBe(100);
    expect(g.customs).toBeCloseTo(927);
    expect(g.bank).toBe(900);
    expect(g.gapKrw).toBeCloseTo(27);
    expect(g.gapPct).toBeCloseTo(3, 5);
  });

  it("과세환율이 더 낮으면 음수", () => {
    const g = customsGap({ perUnit: 1330, weekStart: "2026-11-15" }, BANK.USD);
    expect(g.gapKrw).toBeCloseTo(-70);
    expect(g.gapPct).toBeCloseTo(-5, 5);
  });

  it("같으면 0", () => {
    expect(customsGap({ perUnit: 9, weekStart: "2026-11-15" }, BANK.JPY)).toMatchObject({ gapKrw: 0, gapPct: 0 });
  });
});

describe("customsView — 자료가 없으면 '준비 중' (숫자 없음)", () => {
  it("null · undefined · 빈 배열 → preparing (다른 값 없음)", () => {
    for (const p of [null, undefined, []]) expect(customsView(p, BANK.USD), String(p)).toEqual({ kind: "preparing" });
  });

  it("자료가 있으면 ready · 흐름은 오래된 것부터 · latest 는 가장 최근 · 은행 값과 차이", () => {
    const v = customsView(
      [
        { period: "2026-11-15", value: 1410.5 },
        { period: "2026-11-01", value: 1380 },
        { period: "2026-11-08", value: 1395 },
      ],
      BANK.USD,
    );
    expect(v).toMatchObject({ kind: "ready", latest: { period: "2026-11-15", value: 1410.5 } });
    if (v.kind !== "ready") throw new Error("ready 여야 함");
    expect(v.trend.map((p) => p.period)).toEqual(["2026-11-01", "2026-11-08", "2026-11-15"]);
    expect(v.gap?.gapKrw).toBeCloseTo(10.5);
  });

  it("은행 환율이 없으면 차이는 null (지어내지 않음) · 흐름은 그대로", () => {
    const v = customsView([{ period: "2026-11-15", value: 1410.5 }], null);
    expect(v).toMatchObject({ kind: "ready", gap: null });
  });
});

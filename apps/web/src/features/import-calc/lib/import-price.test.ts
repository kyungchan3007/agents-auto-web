// 작업 0165 — 환율 월평균과 수입물가지수를 같은 달끼리 맞추기 · "준비 중" (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/web/src/features/import-calc/lib/import-price.ts (순수 함수 · 화면 상태 없음)
//   export type MonthPoint = { period: string /* YYYY-MM */; value: number }
//   export type FxDay = { date: string /* YYYY-MM-DD */; baseRate: number; unit: number }
//   monthlyFx(rows: FxDay[]): MonthPoint[]
//     - 일별 환율 → 달별 평균(1단위당 원 = baseRate / unit) · period 오름차순 · 줄이 없는 달은 만들지 않음
//   alignMonthly(fx: MonthPoint[], price: MonthPoint[]): { period: string; fx: number | null; price: number | null }[]
//     - 두 자료의 달을 합쳐 오름차순 · 같은 달끼리 한 줄 · 한쪽만 있는 달은 없는 쪽이 null (지어내지 않음 · 가운데를 채우지 않음)
//   importPriceView(fxRows: FxDay[] | null | undefined, price: MonthPoint[] | null | undefined)
//     : { kind: "preparing" } | { kind: "ready"; rows: { period: string; fx: number | null; price: number | null }[]; both: number /* 둘 다 있는 달 수 */ }
//     - 수입물가가 없거나 비었거나, 환율이 없거나, 둘 다 있는 달이 하나도 없으면 { kind: "preparing" } ("준비 중" · 숫자 없음)
//   (0164 travel-price 의 fxMonthlyAverage 와 같은 계산 — 두 기능이 따로 머지돼도 되게 각자 둠 · 합칠지는 lead 판단)
import { describe, expect, it } from "vitest";
import { alignMonthly, importPriceView, monthlyFx } from "./import-price";

describe("환율 월평균", () => {
  it("일별 → 달별 평균 · 오래된 달부터", () => {
    expect(
      monthlyFx([
        { date: "2026-10-02", baseRate: 1400, unit: 1 },
        { date: "2026-10-30", baseRate: 1420, unit: 1 },
        { date: "2026-09-15", baseRate: 1380, unit: 1 },
      ]),
    ).toEqual([{ period: "2026-09", value: 1380 }, { period: "2026-10", value: 1410 }]);
  });
  it("100 단위 통화는 1단위당 원으로 맞춤 · 줄이 없으면 빈 배열", () => {
    expect(monthlyFx([{ date: "2026-10-02", baseRate: 900, unit: 100 }])).toEqual([{ period: "2026-10", value: 9 }]);
    expect(monthlyFx([])).toEqual([]);
  });
});

describe("같은 달끼리 맞추기", () => {
  const fx = [{ period: "2026-07", value: 1380 }, { period: "2026-08", value: 1390 }, { period: "2026-10", value: 1410 }];
  const price = [{ period: "2026-08", value: 135 }, { period: "2026-09", value: 136 }, { period: "2026-10", value: 137 }];

  it("같은 달은 한 줄 · 한쪽만 있는 달은 없는 쪽이 null", () => {
    expect(alignMonthly(fx, price)).toEqual([
      { period: "2026-07", fx: 1380, price: null },
      { period: "2026-08", fx: 1390, price: 135 },
      { period: "2026-09", fx: null, price: 136 },
      { period: "2026-10", fx: 1410, price: 137 },
    ]);
  });

  it("순서가 섞여 들어와도 오래된 달부터", () => {
    expect(alignMonthly([...fx].reverse(), [...price].reverse()).map((r) => r.period)).toEqual(["2026-07", "2026-08", "2026-09", "2026-10"]);
  });

  it("한쪽이 비어도 다른 쪽 달은 남고 빈 쪽은 모두 null · 둘 다 비면 빈 배열", () => {
    expect(alignMonthly([], price).every((r) => r.fx === null)).toBe(true);
    expect(alignMonthly(fx, []).every((r) => r.price === null)).toBe(true);
    expect(alignMonthly([], [])).toEqual([]);
  });
});

describe("importPriceView — 자료가 없으면 '준비 중'", () => {
  const days = [{ date: "2026-08-03", baseRate: 1390, unit: 1 }, { date: "2026-10-05", baseRate: 1410, unit: 1 }];
  const price = [{ period: "2026-08", value: 135 }, { period: "2026-09", value: 136 }];

  it("수입물가가 null · undefined · 빈 배열 → preparing (환율만 있어도 숫자를 보이지 않음)", () => {
    for (const p of [null, undefined, []]) expect(importPriceView(days, p), String(p)).toEqual({ kind: "preparing" });
  });

  it("환율이 없어도 preparing", () => {
    for (const f of [null, undefined, []]) expect(importPriceView(f, price), String(f)).toEqual({ kind: "preparing" });
  });

  it("둘 다 있지만 겹치는 달이 하나도 없으면 preparing", () => {
    expect(importPriceView([{ date: "2026-01-05", baseRate: 1300, unit: 1 }], price)).toEqual({ kind: "preparing" });
  });

  it("겹치는 달이 있으면 ready · rows 는 맞춘 결과 · both 는 둘 다 있는 달 수 (한쪽만 있는 달은 null 로 남김)", () => {
    const v = importPriceView(days, price);
    expect(v).toEqual({
      kind: "ready",
      both: 1,
      rows: [
        { period: "2026-08", fx: 1390, price: 135 },
        { period: "2026-09", fx: null, price: 136 },
        { period: "2026-10", fx: 1410, price: null },
      ],
    });
  });
});

// 작업 0164 — 여행 품목(국제항공료 · 해외단체여행비) 지수 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/web/src/features/travel-price/lib/travel-index.ts (순수 함수 · 화면 상태 없음)
//   export type IndexPoint = { period: string /* YYYY-MM */; value: number }
//   yoyChange(points: IndexPoint[], period: string): number | null
//     - 같은 달의 1년 전(period 의 연도 − 1) 값 대비 % = (이번 / 작년 − 1) × 100 · 이번 달 또는 작년 값이 없거나 작년 값이 0 이하면 null (지어내지 않음)
//   monthlyAverages(points: IndexPoint[]): Record<number, { avg: number; n: number }>
//     - 가장 최근 달로부터 36개월(최근 달 포함)만 보고 달(1~12)마다 평균 · n 은 쓴 값의 수 · 값이 없는 달은 키가 없음
//   cheapMonth(points: IndexPoint[]): number | null
//     - 1~12월 모두 값이 2개 이상일 때만 평균이 가장 낮은 달(1~12)을 고름 · 같으면 앞선 달 · 모자라면 null (고르지 않음)
//   fxMonthlyAverage(rows: { date: string /* YYYY-MM-DD */; baseRate: number; unit: number }[]): IndexPoint[]
//     - 원/달러 등 환율 일별 줄 → 달별 평균(1단위당 원 = baseRate / unit) · period 오름차순 · 줄이 없는 달은 만들지 않음
//   travelView(points: IndexPoint[] | null | undefined)
//     : { kind: "preparing" } | { kind: "ready"; trend: IndexPoint[] /* 오래된 것부터 */; latest: IndexPoint; yoy: number | null; cheapMonth: number | null }
//     - 없거나 빈 배열이면 { kind: "preparing" } ("준비 중" · 숫자 없음)
import { describe, expect, it } from "vitest";
import { type IndexPoint, cheapMonth, fxMonthlyAverage, monthlyAverages, travelView, yoyChange } from "./travel-index";

/** from ~ to (YYYY-MM · 양끝 포함) 달마다 f(월) 값 */
function series(from: string, to: string, f: (month: number, year: number) => number): IndexPoint[] {
  const out: IndexPoint[] = [];
  let [y, m] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  while (y < ty || (y === ty && m <= tm)) {
    out.push({ period: `${y}-${String(m).padStart(2, "0")}`, value: f(m, y) });
    if (++m > 12) (m = 1), y++;
  }
  return out;
}
// 4월이 가장 싼 3년치 (2023-11 ~ 2026-10 = 36개월 · 달마다 3개)
const SHAPE = (m: number) => (m === 4 ? 90 : 100 + m);
const THREE_YEARS = series("2023-11", "2026-10", SHAPE);

describe("작년 같은 달 대비 %", () => {
  const pts: IndexPoint[] = [{ period: "2025-09", value: 100 }, { period: "2026-09", value: 112.5 }, { period: "2026-10", value: 90 }];
  it("112.5 vs 100 → +12.5%", () => {
    expect(yoyChange(pts, "2026-09")).toBeCloseTo(12.5, 6);
  });
  it("내려도 계산 (음수)", () => {
    expect(yoyChange([{ period: "2025-10", value: 120 }, { period: "2026-10", value: 90 }], "2026-10")).toBeCloseTo(-25, 6);
  });
  it("작년 값이 없으면 null · 그 달 값이 없어도 null (빈 값 — 지어내지 않음)", () => {
    expect(yoyChange(pts, "2026-10")).toBeNull();
    expect(yoyChange(pts, "2026-12")).toBeNull();
    expect(yoyChange([], "2026-10")).toBeNull();
  });
  it("작년 값이 0 이하면 null (0 으로 나누지 않음)", () => {
    expect(yoyChange([{ period: "2025-10", value: 0 }, { period: "2026-10", value: 90 }], "2026-10")).toBeNull();
  });
});

describe("달별 평균 · 싼 달", () => {
  it("최근 36개월만 · 달마다 평균과 개수", () => {
    const old = [{ period: "2020-04", value: 1 }, ...THREE_YEARS]; // 36개월보다 오래된 값은 평균에 넣지 않음
    const avg = monthlyAverages(old);
    expect(avg[4]).toEqual({ avg: 90, n: 3 });
    expect(avg[1]).toEqual({ avg: 101, n: 3 });
  });

  it("평균이 가장 낮은 달 = 4월", () => {
    expect(cheapMonth(THREE_YEARS)).toBe(4);
  });

  it("같은 달이라도 해마다 값이 다르면 평균으로 (한 해만 싼 달에 속지 않음)", () => {
    // 4월은 2024 에만 아주 싸고 나머지 해는 비쌈 · 평균은 7월이 가장 낮음
    const pts = series("2023-11", "2026-10", (m, y) => (m === 7 ? 95 : m === 4 ? (y === 2024 ? 60 : 130) : 100 + m));
    expect(cheapMonth(pts)).toBe(7);
  });

  it("자료가 모자라면 고르지 않음 — 1년치뿐 · 12달이 안 채워짐 · 달마다 1개뿐", () => {
    expect(cheapMonth(series("2025-11", "2026-10", SHAPE))).toBeNull(); // 달마다 1개
    expect(cheapMonth(series("2023-11", "2026-10", SHAPE).filter((p) => !p.period.endsWith("-03")))).toBeNull(); // 3월이 하나도 없음
    expect(cheapMonth([])).toBeNull();
  });

  it("값이 같으면 앞선 달", () => {
    expect(cheapMonth(series("2023-11", "2026-10", () => 100))).toBe(1);
  });
});

describe("환율 월평균", () => {
  it("일별 → 달별 평균 · 오래된 달부터", () => {
    const r = fxMonthlyAverage([
      { date: "2026-10-02", baseRate: 1400, unit: 1 },
      { date: "2026-10-30", baseRate: 1420, unit: 1 },
      { date: "2026-09-15", baseRate: 1380, unit: 1 },
    ]);
    expect(r).toEqual([{ period: "2026-09", value: 1380 }, { period: "2026-10", value: 1410 }]);
  });

  it("100 단위 통화(엔)는 1단위당 원으로 맞춤 — 900 / 100 = 9", () => {
    expect(fxMonthlyAverage([{ date: "2026-10-02", baseRate: 900, unit: 100 }])).toEqual([{ period: "2026-10", value: 9 }]);
  });

  it("줄이 없으면 빈 배열", () => {
    expect(fxMonthlyAverage([])).toEqual([]);
  });
});

describe("travelView — 자료가 없으면 '준비 중'", () => {
  it("null · undefined · 빈 배열 → preparing (숫자 없음)", () => {
    for (const p of [null, undefined, []]) expect(travelView(p), String(p)).toEqual({ kind: "preparing" });
  });

  it("자료가 있으면 ready · 흐름은 오래된 것부터 · latest 는 가장 최근 · 작년 대비 · 싼 달", () => {
    const v = travelView([...THREE_YEARS].reverse());
    expect(v.kind).toBe("ready");
    if (v.kind !== "ready") return;
    expect(v.trend[0].period).toBe("2023-11");
    expect(v.latest).toEqual({ period: "2026-10", value: SHAPE(10) });
    expect(v.yoy).toBeCloseTo(0, 6); // 2025-10 과 같은 값
    expect(v.cheapMonth).toBe(4);
  });

  it("작년 값이 없고 자료가 모자라면 yoy · cheapMonth 는 null (ready 는 유지)", () => {
    const v = travelView([{ period: "2026-10", value: 123 }]);
    expect(v).toMatchObject({ kind: "ready", yoy: null, cheapMonth: null, latest: { period: "2026-10", value: 123 } });
  });
});

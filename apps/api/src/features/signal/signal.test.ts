import { describe, expect, it } from "vitest";
import { type Point, computeSignal, weekdaysBetween, signalsByCurrency } from "./signal";

/** 끝날짜에서 거꾸로 평일마다 값을 붙인다 (values[마지막] = 끝날짜 값) */
function weekdaySeries(end: string, values: number[]): Point[] {
  const out: Point[] = [];
  let t = Date.parse(`${end}T00:00:00Z`);
  for (let i = values.length - 1; i >= 0; ) {
    const d = new Date(t).getUTCDay();
    if (d !== 0 && d !== 6) out.unshift({ date: new Date(t).toISOString().slice(0, 10), value: values[i--] });
    t -= 86400_000;
  }
  return out;
}

const END = "2026-10-28"; // 수요일
const N = weekdaysBetween("2026-07-31", END); // 90일 창의 평일 수

describe("weekdaysBetween", () => {
  it("한 주 = 평일 5일", () => {
    expect(weekdaysBetween("2026-10-26", "2026-11-01")).toBe(5);
  });
});

describe("computeSignal", () => {
  const ramp = (last: number) => [...Array.from({ length: N - 1 }, (_, i) => 1300 + i), last];

  it("90일 중 가장 낮은 값 → 싼 편 (백분위 0)", () => {
    const r = computeSignal(weekdaySeries(END, ramp(1200)));
    expect(r).toMatchObject({ signal: "cheap", percentile: 0, reason: "ok" });
    expect(r.window).toMatchObject({ from: "2026-07-31", to: END, count: N, expected: N });
  });

  it("가장 높은 값 → 비싼 편 (백분위 1)", () => {
    expect(computeSignal(weekdaySeries(END, ramp(2000)))).toMatchObject({ signal: "expensive", percentile: 1 });
  });

  it("가운데 → 보통", () => {
    expect(computeSignal(weekdaySeries(END, ramp(1300 + N / 2))).signal).toBe("normal");
  });

  it("경계: 30% 는 싼 편 · 70% 는 비싼 편 (이하 · 이상)", () => {
    const flat = (lowerShare: number) => {
      const others = 10;
      const lower = Math.round(others * lowerShare);
      return computeSignal(
        weekdaySeries("2026-10-28", [...Array(lower).fill(1), ...Array(others - lower).fill(3), 2]),
        { windowDays: 15, cheapAt: 0.3, expensiveAt: 0.7, minCoverage: 0.8 },
      );
    };
    expect(flat(0.3)).toMatchObject({ percentile: 0.3, signal: "cheap" });
    expect(flat(0.7)).toMatchObject({ percentile: 0.7, signal: "expensive" });
  });

  it("90일 창보다 오래된 값은 계산에 안 넣음", () => {
    const old: Point = { date: "2026-01-02", value: 1 }; // 아주 싼 옛날 값
    const r = computeSignal([old, ...weekdaySeries(END, ramp(1200))]);
    expect(r.window?.count).toBe(N);
    expect(r.percentile).toBe(0);
  });

  it("영업일 80% 미만이면 신호 없음 (SIG-03)", () => {
    const short = weekdaySeries(END, ramp(1200)).filter((_, i) => i % 2 === 0);
    expect(computeSignal(short)).toMatchObject({ signal: null, reason: "data-short", percentile: null });
  });

  it("데이터 없음 · 계산 방법은 항상 같이 (SIG-02)", () => {
    const r = computeSignal([]);
    expect(r).toMatchObject({ signal: null, reason: "no-data" });
    expect(r.method).toMatch(/예측 아님/);
  });
});

describe("신호 목록은 공식 값이 있는 통화만 (작업 0128)", () => {
  it("예비 출처에만 있는 통화는 뺌 · 공식 통화의 예비 값은 계산에 씀", () => {
    const row = (currency: string, date: string, source: string) => ({ currency, date, baseRate: 1000, unit: 1, source });
    const r = signalsByCurrency([row("AFN", "2026-09-15", "frankfurter"), row("USD", "2026-11-03", "frankfurter"), row("USD", "2026-11-04", "koreaexim")]);
    expect(r.map((s) => s.currency)).toEqual(["USD"]);
    expect(r[0].latest?.date).toBe("2026-11-04");
  });
});

// 작업 0228 — 90일 중간값 median (홈 도착지 카드의 카운트업 시작 값) · 테스트 먼저 (구현 전에는 FAIL 이 정상)
//   computeSignal 결과 · 목록 줄(signalsByCurrency)에 median: number | null — 단위는 latest.value 와 같은 1 외화당 원(perUnit)
//   창 안 값(inWindow) 중간값 · 값 2개 이상일 때 · 짝수면 가운데 두 값의 평균 · 값이 없거나 1개면 null · 추가 D1 읽기 없음(이미 읽은 값으로 계산)
describe("median — 90일 중간값 (작업 0228)", () => {
  const med = (values: number[]) => {
    const a = [...values].sort((x, y) => x - y);
    return (a[Math.floor((a.length - 1) / 2)] + a[Math.floor(a.length / 2)]) / 2;
  };
  const asc = (k: number) => Array.from({ length: k }, (_, i) => 1000 + i * 7);
  const medianOf = (r: unknown) => (r as { median?: number | null }).median;

  it("홀수 개 → 가운데 값 · 짝수 개 → 가운데 두 값의 평균 (둘 다)", () => {
    for (const k of [N, N - 1]) {
      const values = asc(k);
      expect(medianOf(computeSignal(weekdaySeries(END, values))), `${k}개`).toBeCloseTo(med(values), 6);
    }
    // 개수가 홀수인 쪽 · 짝수인 쪽이 실제로 하나씩 있음
    expect([N, N - 1].some((k) => k % 2 === 1) && [N, N - 1].some((k) => k % 2 === 0)).toBe(true);
  });

  it("평균이 아니라 중간값 — 가장 큰 값 하나가 아주 커도 중간값은 그대로", () => {
    const base = asc(N);
    const spiked = [...base.slice(0, -1), 9_999_999];
    expect(medianOf(computeSignal(weekdaySeries(END, spiked)))).toBeCloseTo(med(spiked), 6);
    expect(medianOf(computeSignal(weekdaySeries(END, spiked)))).toBeLessThan(2000);
  });

  it("90일 창보다 오래된 값은 중간값에도 안 넣음", () => {
    const values = asc(N);
    const old: Point = { date: "2026-01-02", value: 1 };
    expect(medianOf(computeSignal([old, ...weekdaySeries(END, values)]))).toBeCloseTo(med(values), 6);
  });

  it("값이 모두 같으면 그 값 · 중간값은 최소 ~ 최대 사이 (range)", () => {
    const flat = computeSignal(weekdaySeries(END, Array.from({ length: N }, () => 1300)));
    expect(medianOf(flat)).toBe(1300);
    const r = computeSignal(weekdaySeries(END, asc(N)));
    expect(medianOf(r)!).toBeGreaterThanOrEqual(r.range!.min);
    expect(medianOf(r)!).toBeLessThanOrEqual(r.range!.max);
  });

  it("데이터 없음 · 값 1개 → null (숫자를 지어내지 않음)", () => {
    expect(medianOf(computeSignal([]))).toBeNull();
    expect(medianOf(computeSignal([{ date: END, value: 1300 }]))).toBeNull();
  });

  it("목록 줄(signalsByCurrency)에 median — 1 외화당 원 단위로(엔 100 단위 고시도 같은 기준) · 통화마다", () => {
    const dates = weekdaySeries(END, asc(N)).map((p) => p.date);
    const rows = [
      ...dates.map((date, i) => ({ currency: "JPY", date, baseRate: 800 + i * 0.7, unit: 100, source: "koreaexim" })),
      ...dates.map((date, i) => ({ currency: "USD", date, baseRate: 1300 + i, unit: 1, source: "koreaexim" })),
    ];
    const r = signalsByCurrency(rows) as { currency: string; median?: number | null }[];
    const jpy = r.find((x) => x.currency === "JPY")!;
    const usd = r.find((x) => x.currency === "USD")!;
    expect(jpy.median).toBeCloseTo(med(dates.map((_, i) => (800 + i * 0.7) / 100)), 6);
    expect(usd.median).toBeCloseTo(med(dates.map((_, i) => 1300 + i)), 6);
    expect(jpy.median!, "엔은 1엔당 원(약 8)").toBeLessThan(20);
  });

  it("기존 줄 값은 그대로 — signal · reason · percentile · latest", () => {
    const dates = weekdaySeries(END, asc(N)).map((p) => p.date);
    const rows = dates.map((date, i) => ({ currency: "USD", date, baseRate: 1300 + i, unit: 1, source: "koreaexim" }));
    const [u] = signalsByCurrency(rows);
    expect(u).toMatchObject({ currency: "USD", signal: "expensive", reason: "ok", percentile: 1 });
    expect(u.latest?.value).toBe(1300 + N - 1);
  });
});

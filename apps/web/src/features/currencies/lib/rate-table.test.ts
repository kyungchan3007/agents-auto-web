// 작업 0260 — 통화 둘러보기 표의 순수 함수 (테스트 먼저 · 구현 전에는 FAIL 이 정상) · 파일: features/currencies/lib/rate-table.ts
//   export function dropFromHigh(latest: number | null | undefined, max: number | null | undefined): number | "top" | null
//     (오늘 − 90일 최고) ÷ 90일 최고 → 0 이하의 분수(−0.118 = −11.8%) · 오늘이 최고(오늘 ≥ 최고)면 "top" · 둘 중 하나가 없거나 0 이하 · 숫자가 아니면 null (지어내지 않음)
//   export function dropText(d: number | "top" | null): string
//     숫자 → "−11.8%"(음수 부호는 U+2212 − · 소수 한 자리 · 반올림) · "top" → "최고" · null → "—" · 반올림해 0.0 이 되는 작은 내림은 "−0.0%" 대신 "0.0%"
//   export type RateRow = { currency: string; drop: number | "top" | null; text: string; bar: number }
//   export function rateRows(entries: { currency: string; latest: number | null | undefined; max: number | null | undefined; signal: "cheap" | "normal" | "expensive" | null }[]): RateRow[]
//     많이 내린 순서(drop 이 더 작은 = 더 음수인 것이 위) · "top" 은 숫자 줄 뒤 · null("—")은 맨 끝 · 같은 폭이면 받은 순서(지역 순서) 그대로
//     signal 이 null(신호 없음 = 기록이 부족하거나 없음)이면 latest · max 가 있어도 drop = null (신호 계산의 기존 기준을 따름)
//     bar = 막대 길이 비율 0~1 — 가장 많이 내린 통화가 1(꽉 참) · 나머지는 내린 폭 ÷ 가장 큰 내린 폭 · "top" · null 은 0
//   export function splitColumns<T>(rows: T[]): [T[], T[]]
//     앞 절반(홀수면 앞이 하나 더) · 뒤 절반 · 순서 유지 · 빈 배열은 [[], []]
import { describe, expect, it } from "vitest";
import { dropFromHigh, dropText, rateRows, splitColumns } from "./rate-table";

describe("dropFromHigh — 90일 최고보다 얼마나 낮은지 (작업 0260)", () => {
  it("(오늘 − 최고) ÷ 최고 · 0 이하의 분수", () => {
    expect(dropFromHigh(1324.3, 1501.6)).toBeCloseTo((1324.3 - 1501.6) / 1501.6, 10);
    expect(dropFromHigh(88, 100)).toBeCloseTo(-0.12, 10);
    expect(dropFromHigh(50, 100) as number).toBeLessThan(0);
  });
  it("단위와 무관 — 1 외화당 원이든 100 단위든 같은 값", () => {
    expect(dropFromHigh(8.8, 10)).toBeCloseTo(dropFromHigh(880, 1000) as number, 10);
  });
  it("오늘이 최고면 \"top\" (오늘 ≥ 최고)", () => {
    expect(dropFromHigh(1500, 1500)).toBe("top");
    expect(dropFromHigh(1500.0001, 1500)).toBe("top"); // 최고보다 큰 값이 와도 음수 · 양수로 내놓지 않음
  });
  it("기록이 없거나 값이 이상하면 null — 숫자를 지어내지 않음", () => {
    for (const [l, m] of [[null, 100], [100, null], [undefined, 100], [100, undefined], [null, null], [100, 0], [100, -5], [0, 100], [Number.NaN, 100], [100, Number.NaN], [Number.POSITIVE_INFINITY, 100]] as const) expect(dropFromHigh(l, m), `${l} · ${m}`).toBeNull();
  });
});

describe("dropText — 글 (작업 0260)", () => {
  it("소수 한 자리 · 음수 부호 U+2212(−) · 퍼센트", () => {
    expect(dropText(-0.118)).toBe("−11.8%");
    expect(dropText(-0.5)).toBe("−50.0%");
    expect(dropText(-0.0123)).toBe("−1.2%");
    expect(dropText(-0.1)).toBe("−10.0%");
  });
  it("반올림은 소수 한 자리에서", () => {
    expect(dropText(-0.11849)).toBe("−11.8%");
    expect(dropText(-0.11851)).toBe("−11.9%");
  });
  it("\"top\" → 최고 · null → —", () => {
    expect(dropText("top")).toBe("최고");
    expect(dropText(null)).toBe("—");
  });
  it("반올림해 0.0 이 되는 아주 작은 내림은 \"−0.0%\" 가 아니라 \"0.0%\" (−0.0% 는 쓰지 않음)", () => {
    expect(dropText(-0.0004)).toBe("0.0%");
    expect(dropText(-0.0004)).not.toContain("−0.0");
  });
});

describe("rateRows — 줄 만들기 · 많이 내린 순 · 막대 비율 (작업 0260)", () => {
  const e = (currency: string, latest: number | null, max: number | null, signal: "cheap" | "normal" | "expensive" | null = "normal") => ({ currency, latest, max, signal });
  const entries = [e("USD", 95, 100), e("JPY", 80, 100), e("EUR", 100, 100), e("GBP", null, null, null), e("CNY", 90, 100), e("AUD", 80, 100)];

  it("많이 내린 순서 — 더 많이 내린 것이 위 · 같은 폭은 받은 순서(JPY 가 AUD 앞) · 최고는 숫자 줄 뒤 · \"—\" 는 맨 끝", () => {
    expect(rateRows(entries).map((r) => r.currency)).toEqual(["JPY", "AUD", "CNY", "USD", "EUR", "GBP"]);
  });
  it("줄마다 drop · text 가 dropFromHigh · dropText 와 같음", () => {
    const rows = rateRows(entries);
    const jpy = rows.find((r) => r.currency === "JPY")!;
    expect(jpy.drop).toBeCloseTo(-0.2, 10);
    expect(jpy.text).toBe("−20.0%");
    expect(rows.find((r) => r.currency === "EUR")).toMatchObject({ drop: "top", text: "최고" });
    expect(rows.find((r) => r.currency === "GBP")).toMatchObject({ drop: null, text: "—" });
  });
  it("막대 비율 — 가장 많이 내린 통화가 1(꽉 참) · 나머지는 폭에 비례 · 최고 · \"—\" 는 0", () => {
    const rows = rateRows(entries);
    const bar = (c: string) => rows.find((r) => r.currency === c)!.bar;
    expect(bar("JPY")).toBe(1);
    expect(bar("AUD")).toBe(1);
    expect(bar("CNY")).toBeCloseTo(0.5, 10); // 10% ÷ 20%
    expect(bar("USD")).toBeCloseTo(0.25, 10); // 5% ÷ 20%
    expect(bar("EUR")).toBe(0);
    expect(bar("GBP")).toBe(0);
    for (const r of rows) expect(r.bar).toBeGreaterThanOrEqual(0), expect(r.bar).toBeLessThanOrEqual(1);
  });
  it("신호가 없는 통화(기록 부족)는 값이 있어도 \"—\" — 신호 계산의 기존 기준을 따름", () => {
    const rows = rateRows([e("USD", 80, 100, null), e("JPY", 90, 100)]);
    expect(rows.find((r) => r.currency === "USD")).toMatchObject({ drop: null, text: "—", bar: 0 });
    expect(rows.map((r) => r.currency)).toEqual(["JPY", "USD"]);
  });
  it("모두 최고 · 모두 없음이어도 터지지 않음(막대 0) · 빈 목록은 빈 배열", () => {
    expect(rateRows([e("USD", 100, 100), e("JPY", 9, 9)]).map((r) => r.bar)).toEqual([0, 0]);
    expect(rateRows([e("USD", null, null, null)]).map((r) => r.bar)).toEqual([0]);
    expect(rateRows([])).toEqual([]);
  });
  it("받은 목록을 바꾸지 않음", () => {
    const copy = entries.map((x) => ({ ...x }));
    rateRows(entries);
    expect(entries).toEqual(copy);
  });
});

describe("splitColumns — 넓은 화면 두 단 (작업 0260)", () => {
  it("앞 절반 · 뒤 절반 · 홀수면 앞이 하나 더 · 순서 유지", () => {
    expect(splitColumns([1, 2, 3, 4])).toEqual([[1, 2], [3, 4]]);
    expect(splitColumns([1, 2, 3, 4, 5])).toEqual([[1, 2, 3], [4, 5]]);
    expect(splitColumns([1])).toEqual([[1], []]);
    expect(splitColumns([])).toEqual([[], []]);
  });
  it("22개 → 11 + 11 · 합치면 원래 그대로", () => {
    const rows = Array.from({ length: 22 }, (_, i) => i);
    const [a, b] = splitColumns(rows);
    expect([a.length, b.length]).toEqual([11, 11]);
    expect([...a, ...b]).toEqual(rows);
  });
});

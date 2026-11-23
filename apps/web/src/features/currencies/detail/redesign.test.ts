// 작업 0219 — 새 통화 상세 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/web/src/features/currencies/detail/range/redesign.ts
//   routePosition(today: number, min: number, max: number): number | null
//     비행 경로 위 오늘 점 위치 0(최저) ~ 1(최고) = (오늘 − 최저) / (최고 − 최저) · 범위 밖은 0~1 로 자름 · 최고 ≤ 최저 이거나 숫자가 유한하지 않으면 null (점을 그리지 않음)
//   chipCodes(current: string, available: string[]): string[]
//     국기 칩 줄 — 홈 도착지 네 통화(JPY · USD · EUR · THB) 중 available 에 있는 것 + 지금 통화(available 에 있고 위 넷에 없으면 맨 앞) · 중복 없음 · 순서는 JPY · USD · EUR · THB
//   bigRate(rate: { baseRate: number; unit: number }): { value: number; digits: number; unit: string }
//     머리 큰 숫자(카운트업) — value = baseRate 그대로 · digits = rateText 가 보이는 소수 자리(100 이상 1 · 미만 2, 끝 0 은 numberText 규칙을 따름) · unit = rateText 의 단위("원" · "원 / 100")
//     formatCount(value, digits) 가 rateText(rate).value 와 같음 (카운트업 끝 글 = 지금 글)
//   cardDigits({ baseRate: 카드 값 }): number — 그 값에 대한 rateDigits 규칙(작업 0287 정정: 1,000원 이상 첫째 · 미만 둘째 · 끝자리 0 생략) · formatCount(v, cardDigits) + unit 이 cardRateText 와 같음
import { rateText } from "@hav/shared/currency";
import { formatCount } from "@hav/ui/hooks/count/use-count-up";
import { describe, expect, it } from "vitest";
import { cardRateText } from "./detail-view";
import { bigRate, cardDigits, chipCodes, routePosition } from "./range/redesign";

describe("routePosition — 오늘 점 위치", () => {
  it("(오늘 − 최저) / (최고 − 최저)", () => {
    expect(routePosition(1338.8, 1322.6, 1554.4)).toBeCloseTo((1338.8 - 1322.6) / (1554.4 - 1322.6), 10);
    expect(routePosition(1322.6, 1322.6, 1554.4)).toBe(0);
    expect(routePosition(1554.4, 1322.6, 1554.4)).toBe(1);
    expect(routePosition(1438.5, 1322.6, 1554.4)).toBeCloseTo(0.5, 2);
  });
  it("범위 밖은 자름", () => {
    expect(routePosition(1000, 1322.6, 1554.4)).toBe(0);
    expect(routePosition(2000, 1322.6, 1554.4)).toBe(1);
  });
  it("범위가 없거나 숫자가 아니면 null (점을 그리지 않음)", () => {
    expect(routePosition(100, 100, 100)).toBeNull();
    expect(routePosition(100, 200, 100)).toBeNull();
    expect(routePosition(Number.NaN, 1, 2)).toBeNull();
    expect(routePosition(1.5, Number.POSITIVE_INFINITY, 2)).toBeNull();
  });
});

describe("chipCodes — 국기 칩 줄", () => {
  const ALL = ["USD", "JPY", "EUR", "THB", "GBP", "CNH"];
  it("홈 도착지 네 통화 · 순서 JPY USD EUR THB", () => {
    expect(chipCodes("USD", ALL)).toEqual(["JPY", "USD", "EUR", "THB"]);
  });
  it("지금 통화가 넷에 없으면 맨 앞에 더함", () => {
    expect(chipCodes("GBP", ALL)).toEqual(["GBP", "JPY", "USD", "EUR", "THB"]);
  });
  it("받은 통화에 없는 것은 뺌 (지어내지 않음)", () => {
    expect(chipCodes("USD", ["USD", "JPY"])).toEqual(["JPY", "USD"]);
    expect(chipCodes("XXX", ["USD", "JPY"])).toEqual(["JPY", "USD"]); // 모르는 지금 통화는 더하지 않음
  });
  it("통화가 하나도 없으면 빈 줄", () => {
    expect(chipCodes("USD", [])).toEqual([]);
  });
});

describe("bigRate · cardDigits — 카운트업 끝 글 = 지금 글", () => {
  const RATES = [
    { baseRate: 1338.8, unit: 1 },
    { baseRate: 912.34, unit: 100 },
    { baseRate: 39.84, unit: 1 },
    { baseRate: 1486.2, unit: 1 },
    { baseRate: 7.45, unit: 1 },
  ];
  it("formatCount(value, digits) = rateText 의 값 글 · 단위 같음", () => {
    for (const r of RATES) {
      const b = bigRate(r);
      expect(b.value).toBe(r.baseRate);
      expect(formatCount(b.value, b.digits)).toBe(rateText(r).value);
      expect(b.unit).toBe(rateText(r).unit);
    }
  });
  it("카드(최저 · 최고 · 평균) 글 = formatCount(v, cardDigits(그 값)) + 단위 — 작업 0287 정정: 자릿수는 카드 값 자신에 대한 규칙(1,000원 이상 첫째 · 미만 둘째 · 끝자리 0 생략)", () => {
    for (const r of RATES) for (const v of [1322.6, 1554.4, 1447.1234, 39.1, 912.5, 1331.0, 833.73, 7.3]) expect(`${formatCount(v, cardDigits({ baseRate: v }))}${rateText(r).unit}`).toBe(cardRateText(v, r));
    expect(formatCount(1459.62, cardDigits({ baseRate: 1459.62 }))).toBe("1,459.6");
    expect(formatCount(1331.0, cardDigits({ baseRate: 1331.0 }))).toBe("1,331");
  });
});

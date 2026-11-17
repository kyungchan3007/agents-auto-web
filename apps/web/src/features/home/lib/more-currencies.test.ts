// 작업 0191 — 홈 "도착지별 환전 타이밍" 아래 통화 전체 링크 문구 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 개수는 /currencies 목록에 보이는 통화(빌드 때 받은 환율) 수에서 위 목록에 이미 나온 통화 수를 뺀 값 · 자료가 없으면 개수 없이 · 지어내지 않음
import { describe, expect, it } from "vitest";
import { MORE_CURRENCIES_HREF, moreCurrenciesCount, moreCurrenciesText } from "./more-currencies";

const rate = (currency: string) => ({ currency });
const SHOWN = [{ currency: "JPY" }, { currency: "THB" }, { currency: "EUR" }, { currency: "USD" }];

describe("moreCurrenciesCount", () => {
  it("받은 통화 수에서 위 목록에 나온 통화 수를 뺀다", () => {
    const rates = ["JPY", "THB", "EUR", "USD", "CNY", "GBP", "AUD"].map(rate);
    expect(moreCurrenciesCount(rates, SHOWN)).toBe(3);
  });
  it("환율이 없는 도착지는 목록에도 없으므로 빼지 않는다", () => {
    const rates = ["JPY", "USD", "CNY"].map(rate);
    expect(moreCurrenciesCount(rates, SHOWN)).toBe(1);
  });
  it("같은 통화가 두 번 나와도 한 번만 센다", () => {
    const rates = ["JPY", "JPY", "CNY"].map(rate);
    expect(moreCurrenciesCount(rates, [{ currency: "JPY" }, { currency: "JPY" }])).toBe(1);
  });
  it("통화 자료가 없으면 null (0 으로 지어내지 않음)", () => {
    expect(moreCurrenciesCount([], SHOWN)).toBeNull();
  });
  it("남는 통화가 없으면 null (링크에 0개라고 쓰지 않음)", () => {
    expect(moreCurrenciesCount(["JPY", "THB"].map(rate), SHOWN)).toBeNull();
  });
  it("통화 없는 도착지(currency 없음)는 무시한다", () => {
    expect(moreCurrenciesCount(["JPY", "CNY"].map(rate), [{ currency: "JPY" }, {}])).toBe(1);
  });
});

describe("moreCurrenciesText", () => {
  it("개수가 있으면 '다른 통화 N개 모두 보기 ›'", () => {
    expect(moreCurrenciesText(18)).toBe("다른 통화 18개 모두 보기 ›");
  });
  it("개수가 없으면 '통화 모두 보기 ›'", () => {
    expect(moreCurrenciesText(null)).toBe("통화 모두 보기 ›");
  });
  it("링크는 /currencies", () => {
    expect(MORE_CURRENCIES_HREF).toBe("/currencies");
  });
});

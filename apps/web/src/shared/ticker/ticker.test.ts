// 작업 0399 — 흐르는 환율 띠의 항목 계산 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것: apps/web/src/shared/ticker/ticker.ts (순수 함수 · React 없음 · 홈 hero 아래 띠와 홈 밖 바닥 띠가 같은 계산을 씀)
//   export type TickerItem = { currency: string; href: string; flag: string | null; name: string; amountText: string; signal: Signal | null; signalText: "낮음" | "보통" | "높음" | null }
//   export function tickerItems(rates: { currency: string; unit: number; baseRate: number }[], signals: { currency: string; signal: Signal | null; percentile: number | null }[]): TickerItem[]
//     - 항목은 받은 환율이 있는 통화만(환율 없는 통화는 뺌 · 환율이 하나도 없으면 빈 목록 → 띠를 그리지 않음) · baseRate 가 숫자가 아니거나 0 이하 · unit 0 이하면 뺌
//     - 순서: 엔(JPY) · 달러(USD) · 유로(EUR) · 바트(THB) · 싱가포르 달러(SGD) · 파운드(GBP) · 홍콩 달러(HKD) · 호주 달러(AUD) · 위안(CNH) · 캐나다 달러(CAD) 먼저(없는 통화는 건너뜀) · 나머지는 통화 코드 순
//     - href = "/currencies/{코드}" · flag = currencyFlag(코드) · name = currencyListName(코드) + (unit 이 1 보다 크면 " {unit}") 예 "일본 엔 100" · "미국 달러" · "유로" · "태국 바트"
//     - amountText = wonText(baseRate) (홈 도착지 목록의 금액 글과 같은 함수 · 100원 이상 정수 · 미만 소수 한 자리)
//     - 신호: signal 이 null 이 아니고 percentile 도 null 이 아닐 때만(도착지 목록과 같은 규칙) signal · signalText(cheap "낮음" · normal "보통" · expensive "높음") · 아니면 둘 다 null (금액만)
//   export function tickerLabel(date: string | null, short = false): string
//     - "오늘 환율 · 11.27 기준" (날짜 "2026-11-27" → 월.일 · 월은 0 없이 · 일은 두 자리) · short 이거나 날짜가 없거나 날짜 모양이 아니면 "오늘 환율"
//   그리는 곳(testid · e2e): shared/ticker/rate-ticker.tsx — 아래 e2e/rate-ticker.spec.ts 머리말 참고
import { describe, expect, it } from "vitest";
import { wonText } from "@hav/shared/format";
import { tickerItems, tickerLabel } from "./ticker";

const R = (currency: string, baseRate: number, unit = 1) => ({ currency, unit, baseRate });
const ALL = [
  R("CAD", 985.5),
  R("CHF", 1650.2),
  R("CNH", 187.3),
  R("AUD", 893.1),
  R("DKK", 197.8),
  R("HKD", 171.9),
  R("GBP", 1761.5),
  R("SGD", 1041.2),
  R("THB", 39.43),
  R("EUR", 1473.4),
  R("USD", 1343.2),
  R("JPY", 842.95, 100),
  R("KWD", 4380.1),
  R("NOK", 126.5),
];
const SIG = (currency: string, signal: "cheap" | "normal" | "expensive" | null, percentile: number | null = 0.3) => ({ currency, signal, percentile });

describe("tickerItems — 순서", () => {
  it("엔 · 달러 · 유로 · 바트 · 싱가포르 달러 · 파운드 · 홍콩 달러 · 호주 달러 · 위안 · 캐나다 달러 먼저 · 나머지는 코드 순", () => {
    expect(tickerItems(ALL, []).map((i) => i.currency)).toEqual(["JPY", "USD", "EUR", "THB", "SGD", "GBP", "HKD", "AUD", "CNH", "CAD", "CHF", "DKK", "KWD", "NOK"]);
  });

  it("앞 열 통화가 일부 없으면 건너뛰고 순서는 그대로 · 먼저 나올 통화 밖은 코드 순", () => {
    const some = [R("NOK", 126.5), R("USD", 1343.2), R("JPY", 842.95, 100), R("BND", 1000), R("CAD", 985.5)];
    expect(tickerItems(some, []).map((i) => i.currency)).toEqual(["JPY", "USD", "CAD", "BND", "NOK"]);
  });

  it("들어온 배열을 바꾸지 않음", () => {
    const copy = ALL.map((r) => ({ ...r }));
    tickerItems(ALL, []);
    expect(ALL).toEqual(copy);
  });
});

describe("tickerItems — 항목 글", () => {
  const items = tickerItems(ALL, []);
  const by = (c: string) => items.find((i) => i.currency === c)!;

  it("이름 — 홈 도착지 목록과 같은 이름 · 단위가 1보다 크면 단위를 붙임", () => {
    expect(by("JPY").name).toBe("일본 엔 100");
    expect(by("USD").name).toBe("미국 달러");
    expect(by("EUR").name).toBe("유로");
    expect(by("THB").name).toBe("태국 바트");
    expect(by("SGD").name).toBe("싱가포르 달러");
    expect(by("GBP").name).toContain("파운드");
  });

  it("금액 — 홈 도착지 목록과 같은 함수(wonText): 100원 이상 정수 · 미만 소수 한 자리", () => {
    for (const i of items) expect(i.amountText, i.currency).toBe(wonText(ALL.find((r) => r.currency === i.currency)!.baseRate));
    expect(by("JPY").amountText).toBe("843원");
    expect(by("THB").amountText).toBe("39.4원");
    expect(by("USD").amountText).toBe("1,343원");
  });

  it("국기 · 주소(/currencies/{코드})", () => {
    expect(by("JPY").flag).toBe("JP");
    expect(by("EUR").flag).toBe("EU");
    expect(by("USD").href).toBe("/currencies/USD");
    expect(by("CNH").href).toBe("/currencies/CNH");
  });
});

describe("tickerItems — 신호", () => {
  it("신호가 있으면 점 · 글(낮음 · 보통 · 높음)", () => {
    const items = tickerItems([R("JPY", 842.95, 100), R("USD", 1343.2), R("EUR", 1473.4)], [SIG("JPY", "cheap"), SIG("USD", "normal", 0.5), SIG("EUR", "expensive", 0.9)]);
    expect(items.map((i) => [i.signal, i.signalText])).toEqual([["cheap", "낮음"], ["normal", "보통"], ["expensive", "높음"]]);
  });

  it("신호가 없으면(신호 없음 · signal null · percentile null) 점 · 글 없이 금액만 — 항목은 남음", () => {
    const items = tickerItems([R("JPY", 842.95, 100), R("USD", 1343.2), R("EUR", 1473.4)], [SIG("USD", null), SIG("EUR", "cheap", null)]);
    expect(items).toHaveLength(3);
    for (const i of items) {
      expect(i.signal).toBeNull();
      expect(i.signalText).toBeNull();
      expect(i.amountText).not.toBe("");
    }
  });

  it("환율 없는 통화는 신호가 있어도 뺌(지어내지 않음)", () => {
    const items = tickerItems([R("JPY", 842.95, 100)], [SIG("JPY", "cheap"), SIG("VND", "cheap"), SIG("USD", "cheap")]);
    expect(items.map((i) => i.currency)).toEqual(["JPY"]);
  });
});

describe("tickerItems — 없는 값", () => {
  it("환율이 하나도 없으면 빈 목록(띠를 그리지 않음)", () => {
    expect(tickerItems([], [SIG("JPY", "cheap")])).toEqual([]);
  });

  it("숫자가 아니거나 0 이하인 값 · 단위 0 이하는 뺌", () => {
    const bad = [R("JPY", Number.NaN, 100), R("USD", 0), R("EUR", -1), R("THB", Number.POSITIVE_INFINITY), R("GBP", 1761.5, 0), R("CAD", 985.5)];
    expect(tickerItems(bad, []).map((i) => i.currency)).toEqual(["CAD"]);
  });
});

describe("tickerLabel", () => {
  it("'오늘 환율 · M.DD 기준' — 월은 0 없이 · 일은 두 자리", () => {
    expect(tickerLabel("2026-11-27")).toBe("오늘 환율 · 11.27 기준");
    expect(tickerLabel("2026-01-05")).toBe("오늘 환율 · 1.05 기준");
  });

  it("짧은 형태(휴대폰) · 날짜가 없거나 모양이 아니면 '오늘 환율' (날짜를 지어내지 않음)", () => {
    expect(tickerLabel("2026-11-27", true)).toBe("오늘 환율");
    expect(tickerLabel(null)).toBe("오늘 환율");
    expect(tickerLabel("")).toBe("오늘 환율");
    expect(tickerLabel("어제")).toBe("오늘 환율");
  });
});

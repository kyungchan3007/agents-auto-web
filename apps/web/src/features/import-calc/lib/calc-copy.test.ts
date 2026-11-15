// 작업 0170 — /calc(직구 계산) 결과 큰 문장 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// Figma 05 · SR-CALC-01 — "세금 없이 받습니다" / "관세 · 부가세 약 ○원이 붙습니다" · 환율을 못 받으면 "환율을 받지 못했습니다" · 기존 IMP-01 ~ 06 규칙 그대로
//
// builder 가 만들 것 — apps/web/src/features/import-calc/lib/calc-copy.ts
//   calcHeadline(result: CalcResult | null, input: Pick<CalcInput, "currency" | "price">): string
//     - result 가 null(입력 전) → "물건 값을 넣어 보세요"
//     - result.ok 가 아니고 field 가 "rate" → "환율을 받지 못했습니다" · 다른 field 는 result.reason 그대로 (IMP-05 이유를 보여 줌)
//     - ok · 한도 안(over false) → `${금액} 물건, 세금 없이 받습니다` — 금액 = currencySymbol(통화) + 입력한 물건 값(쉼표) → "$180" · "¥20,000" · 기호가 없는 통화는 코드 + 공백 ("THB 5,000")
//     - ok · 한도 넘음 · 관세율을 넣음(tax.duty · tax.vat 가 숫자) → `관세 · 부가세 약 ${duty + vat 쉼표}원이 붙습니다`
//     - ok · 한도 넘음 · 관세율 비움(duty · vat null) → "면세 한도를 넘었습니다 · 관세율을 넣으면 세금을 계산합니다" (금액을 지어내지 않음)
import { describe, expect, it } from "vitest";
import { calc } from "./calc";
import { calcHeadline } from "./calc-copy";

const RATES = { USD: { baseRate: 1400, unit: 1 }, JPY: { baseRate: 900, unit: 100 }, THB: { baseRate: 40, unit: 1 }, EUR: { baseRate: 1500, unit: 1 } };
const base = { currency: "USD", price: "", shipping: "", dutyRate: "", route: "us-list" as const };

describe("calcHeadline", () => {
  it("입력 전", () => {
    expect(calcHeadline(null, { currency: "USD", price: "" })).toBe("물건 값을 넣어 보세요");
  });

  it("한도 안 → '$180 물건, 세금 없이 받습니다'", () => {
    const r = calc({ ...base, price: "180" }, RATES);
    expect(calcHeadline(r, { currency: "USD", price: "180" })).toBe("$180 물건, 세금 없이 받습니다");
  });

  it("엔 · 쉼표 · 기호 없는 통화(코드 + 공백)", () => {
    const jpy = calc({ ...base, currency: "JPY", price: "20,000", route: "other" }, RATES);
    expect(calcHeadline(jpy, { currency: "JPY", price: "20,000" })).toBe("¥20,000 물건, 세금 없이 받습니다");
    const thb = calc({ ...base, currency: "THB", price: "3000", route: "other" }, RATES);
    expect(calcHeadline(thb, { currency: "THB", price: "3000" })).toBe("฿3,000 물건, 세금 없이 받습니다");
    const unknown = calc({ ...base, currency: "USD", price: "100" }, RATES);
    expect(calcHeadline(unknown, { currency: "XAF", price: "5000" })).toBe("XAF 5,000 물건, 세금 없이 받습니다");
  });

  it("한도 넘음 + 관세율 → '관세 · 부가세 약 50,760원이 붙습니다' (유로 160 + 배송 20 · 8%: 관세 21,600 + 부가세 29,160)", () => {
    const r = calc({ ...base, currency: "EUR", price: "160", shipping: "20", dutyRate: "8", route: "other" }, RATES);
    expect(calcHeadline(r, { currency: "EUR", price: "160" })).toBe("관세 · 부가세 약 50,760원이 붙습니다");
  });

  it("관세율 0% 도 계산 (부가세만) — 250달러: 부가세 35,000", () => {
    const r = calc({ ...base, price: "250", dutyRate: "0" }, RATES);
    expect(calcHeadline(r, { currency: "USD", price: "250" })).toBe("관세 · 부가세 약 35,000원이 붙습니다");
  });

  it("한도 넘음 + 관세율 비움 → 금액을 지어내지 않음", () => {
    const r = calc({ ...base, price: "250" }, RATES);
    expect(calcHeadline(r, { currency: "USD", price: "250" })).toBe("면세 한도를 넘었습니다 · 관세율을 넣으면 세금을 계산합니다");
  });

  it("환율을 받지 못함 → '환율을 받지 못했습니다' · 다른 입력 오류는 이유 그대로", () => {
    const noRate = calc({ ...base, currency: "AED", price: "100" }, RATES);
    expect(calcHeadline(noRate, { currency: "AED", price: "100" })).toBe("환율을 받지 못했습니다");
    const bad = calc({ ...base, price: "-3" }, RATES);
    expect(bad.ok).toBe(false);
    expect(calcHeadline(bad, { currency: "USD", price: "-3" })).toBe(bad.ok ? "" : bad.reason);
  });
});

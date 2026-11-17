// 작업 0200 — 처음 들어오면 넣어 주는 예시 값 (테스트 먼저 · 구현 전에는 FAIL 이 정상)
//
// builder 가 만들 것 — apps/web/src/features/import-calc/lib/example.ts (순수 함수)
//   EXAMPLE = { currency: "USD", price: "180", route: "us-list" }
//   exampleFor(currency: string, hasRate: boolean): typeof EXAMPLE | null
//     - 통화가 USD 이고 그 환율이 있을 때만 예시를 돌려줌 · 다른 통화(?currency=JPY) · 환율 없음은 null (지금처럼 빈 칸)
import { describe, expect, it } from "vitest";
import { calc } from "./calc";
import { EXAMPLE, exampleFor } from "./example";

describe("exampleFor", () => {
  it("달러 + 환율 있음 → 180달러 · 미국 목록통관", () => {
    expect(exampleFor("USD", true)).toEqual({ currency: "USD", price: "180", route: "us-list" });
    expect(EXAMPLE).toEqual({ currency: "USD", price: "180", route: "us-list" });
  });
  it("다른 통화 · 환율 없음 → 예시 없음", () => {
    expect(exampleFor("JPY", true)).toBeNull();
    expect(exampleFor("USD", false)).toBeNull();
  });
  it("예시 값은 면세 한도 안으로 결과가 바로 나옴", () => {
    const r = calc({ ...EXAMPLE, shipping: "", dutyRate: "" }, { USD: { baseRate: 1345.2, unit: 1 } });
    expect(r.ok && !r.over).toBe(true);
  });
});

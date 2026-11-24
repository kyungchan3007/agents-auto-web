// 작업 0350 — 직구 합산과세: 같은 판매자에게 같은 날 산 물건 합계로 면세 한도 판단 (시안 7 · 테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 규칙 출처: 「수입통관 사무처리에 관한 고시」 제68조(합산과세 기준) · 관세청고시 제2025-66호 · 확인한 날 2026-11-25 (request.md · 삭제된 2호 "입항일 기준" 문구는 쓰지 않음)
// 새 계산 규칙은 만들지 않음 — 지금 계산기(calc.ts)의 한도 판단 · 세금 계산을 합계에 그대로 (물품가격만 한도에 · 배송비는 한도에 안 넣음)
//
// builder 가 만들 것 — apps/web/src/features/import-calc/calculator/combined.ts (순수 함수 · tsx 는 그리기만 · 상태는 커스텀 훅)
//   export const MAX_ITEMS = 5                                    // 물건 전체 개수 상한 = 첫 물건 + 더한 물건 4개 ("물건 두 개 합계" 가 첫 물건을 센 것 · 가정)
//   export const COMBINED_LABEL: string                           // "같은 판매자에게 같은 날 산 물건"
//   export const COMBINED_NOTE: string                            // 칸 아래 안내 문장(원문 그대로)
//   export const ADD_ITEM_LABEL: string                           // "+ 물건 더하기"
//   export const canAddExtra = (extras: string[]) => boolean       // 더한 물건이 MAX_ITEMS - 1 개 미만일 때만 true
//   export const addExtra = (extras: string[]) => string[]         // 빈 칸 하나를 더함 · 가득 차면 그대로
//   export const removeExtra = (extras: string[], index: number) => string[]   // 그 칸을 지움 · 없는 자리면 그대로
//   export type Combined = { count: number; items: number[]; total: number; eachWithin: boolean; sentence: string | null }
//   export function calcCombined(input: CalcInput, extras: string[], rates: Record<string, Rate>): { result: CalcResult; combined: Combined | null; extraError: { index: number; reason: string } | null }
//       extras 는 "더한 물건" 값 글자들(첫 물건은 input.price) · 빈 칸(공백 포함)은 무시
//       더한 물건이 하나도 없으면 result = calc(input, rates) 와 같고 combined · extraError 는 null
// apps/web/src/features/import-calc/calculator/rules.ts — export const COMBINED_SOURCE = { name · url · notice · checked } (RULES_SOURCE 와 같은 모양 + 고시 번호)
import { describe, expect, it } from "vitest";
import { type CalcInput, calc } from "./calc";
import { ADD_ITEM_LABEL, COMBINED_LABEL, COMBINED_NOTE, MAX_ITEMS, addExtra, calcCombined, canAddExtra, removeExtra } from "./combined";
import { COMBINED_SOURCE } from "./rules";

const RATES = { USD: { baseRate: 1400, unit: 1 }, JPY: { baseRate: 900, unit: 100 }, THB: { baseRate: 40, unit: 1 } };
const base: CalcInput = { currency: "USD", price: "180", shipping: "", dutyRate: "", route: "us-list" };
const run = (input: Partial<CalcInput>, extras: string[]) => calcCombined({ ...base, ...input }, extras, RATES);

describe("규칙 · 문구 (원문 그대로)", () => {
  it("칸 이름 · 안내 문장 · 더하기 단추", () => {
    expect(COMBINED_LABEL).toBe("같은 판매자에게 같은 날 산 물건");
    expect(COMBINED_NOTE).toBe("같은 해외 판매자에게 같은 날 산 물건을 나눠 받거나, 한 운송장으로 함께 오는 물건은 합쳐서 면세 한도를 봅니다(합산과세). 판매자가 다르거나 산 날이 다르면 따로 봅니다.");
    expect(ADD_ITEM_LABEL).toBe("+ 물건 더하기");
  });

  it("삭제된 입항일 기준 문구('같은 날 함께 들어오는')는 쓰지 않음", () => {
    expect(COMBINED_LABEL + COMBINED_NOTE).not.toContain("함께 들어오는");
  });

  it("긴 줄표(—)를 쓰지 않음", () => {
    expect(COMBINED_LABEL + COMBINED_NOTE + ADD_ITEM_LABEL).not.toMatch(/[—–]/);
  });

  it("출처 — 고시 제68조 · 국가법령정보센터 주소 · 확인한 날 2026-11-25", () => {
    expect(COMBINED_SOURCE.name).toContain("수입통관 사무처리에 관한 고시");
    expect(COMBINED_SOURCE.name).toContain("제68조");
    expect(COMBINED_SOURCE.notice).toContain("2025-66");
    expect(COMBINED_SOURCE.url).toMatch(/^https:\/\/www\.law\.go\.kr\//);
    expect(COMBINED_SOURCE.checked).toBe("2026-11-25");
  });
});

describe("더한 물건이 없으면 지금 계산기와 같음", () => {
  it("[] · 빈 칸 · 공백만 → calc 결과 그대로 · combined null", () => {
    for (const extras of [[], [""], ["  ", ""]]) {
      const r = run({}, extras);
      expect(r.result).toEqual(calc(base, RATES));
      expect(r.combined).toBeNull();
      expect(r.extraError).toBeNull();
    }
  });
});

describe("합계로 한도 판단 (시안 7-new)", () => {
  it("미국 $180 + $60 = $240 → 한도 $200 넘음 · 하나씩은 한도 안 · 문장 시안 그대로", () => {
    const { result, combined } = run({}, ["60"]);
    expect(result).toMatchObject({ ok: true, priceUsd: 240, priceKrw: 336_000, limitUsd: 200, over: true, leftUsd: 0 });
    expect(combined).toEqual({ count: 2, items: [180, 60], total: 240, eachWithin: true, sentence: "물건 두 개 합계 $180 + $60 = $240 · 하나씩은 한도 안이지만 합치면 넘습니다" });
  });

  it("넘으면 지금 규칙 그대로 합계에 과세 — 합계 $240 + 배송 $20 · 관세 8% → 과세 364,000 · 관세 29,120 · 부가세 39,312 · 합계 432,432", () => {
    const { result } = run({ shipping: "20", dutyRate: "8" }, ["60"]);
    expect(result).toMatchObject({ ok: true, over: true, tax: { taxableKrw: 364_000, duty: 29_120, vat: 39_312, total: 432_432 } });
  });

  it("배송비는 한도 판단에 넣지 않음 — $100 + $90 + 배송 $50 은 합계 $190 이라 한도 안", () => {
    const { result, combined } = run({ price: "100", shipping: "50" }, ["90"]);
    expect(result).toMatchObject({ ok: true, over: false, priceUsd: 190, leftUsd: 10, tax: null });
    expect(combined?.sentence).toBeNull();
  });

  it("관세율을 비우면 관세 · 부가세 · 합계는 null (지어내지 않음)", () => {
    const { result } = run({}, ["60"]);
    expect(result).toMatchObject({ ok: true, over: true, tax: { taxableKrw: 336_000, duty: null, vat: null, total: null } });
  });
});

describe("한도 경계 — 미국 200달러 · 그 밖 150달러 (이하 면세)", () => {
  it("미국: 합계 $200 정확히는 한도 안(이하) · 문장 없음 / $200.01 은 넘음", () => {
    const at = run({ price: "100" }, ["100"]);
    expect(at.result).toMatchObject({ ok: true, over: false, leftUsd: 0 });
    expect(at.combined).toMatchObject({ total: 200, eachWithin: true, sentence: null });
    const above = run({ price: "100.01" }, ["100"]);
    expect(above.result).toMatchObject({ ok: true, over: true });
    expect(above.combined).toMatchObject({ total: 200.01, sentence: "물건 두 개 합계 $100.01 + $100 = $200.01 · 하나씩은 한도 안이지만 합치면 넘습니다" });
  });

  it("그 밖 나라: 합계 $150 정확히는 한도 안 / $150.01 은 넘음", () => {
    expect(run({ price: "75", route: "other" }, ["75"]).result).toMatchObject({ ok: true, over: false, limitUsd: 150 });
    const above = run({ price: "75.01", route: "other" }, ["75"]);
    expect(above.result).toMatchObject({ ok: true, over: true, limitUsd: 150 });
    expect(above.combined?.sentence).toBe("물건 두 개 합계 $75.01 + $75 = $150.01 · 하나씩은 한도 안이지만 합치면 넘습니다");
  });

  it("합계가 한도 아래면 문장 없음 (새 안내를 만들지 않음) · 개수 · 합계는 계산", () => {
    const r = run({ price: "50" }, ["60"]);
    expect(r.result).toMatchObject({ ok: true, over: false, priceUsd: 110, leftUsd: 90 });
    expect(r.combined).toEqual({ count: 2, items: [50, 60], total: 110, eachWithin: true, sentence: null });
  });

  it("물건 하나가 혼자서도 한도를 넘으면 '하나씩은 안' 문장을 쓰지 않음", () => {
    const r = run({ price: "250" }, ["10"]);
    expect(r.result).toMatchObject({ ok: true, over: true });
    expect(r.combined).toMatchObject({ eachWithin: false, sentence: null });
    const second = run({ price: "10" }, ["250"]);
    expect(second.combined).toMatchObject({ eachWithin: false, sentence: null });
  });
});

describe("물건 여러 개 · 문장의 개수 말", () => {
  it("세 개 · 네 개 · 다섯 개", () => {
    expect(run({ price: "100" }, ["60", "60"]).combined?.sentence).toBe("물건 세 개 합계 $100 + $60 + $60 = $220 · 하나씩은 한도 안이지만 합치면 넘습니다");
    expect(run({ price: "60" }, ["60", "60", "60"]).combined?.sentence).toBe("물건 네 개 합계 $60 + $60 + $60 + $60 = $240 · 하나씩은 한도 안이지만 합치면 넘습니다");
    expect(run({ price: "50" }, ["50", "50", "50", "50"]).combined?.sentence).toBe("물건 다섯 개 합계 $50 + $50 + $50 + $50 + $50 = $250 · 하나씩은 한도 안이지만 합치면 넘습니다");
  });

  it("더한 물건 사이의 빈 칸은 무시 — 개수 · 합계에 안 들어감", () => {
    const r = run({}, ["60", "", "  "]);
    expect(r.combined).toMatchObject({ count: 2, items: [180, 60], total: 240 });
  });

  it("쉼표가 든 값도 숫자로 (1,000)", () => {
    const r = run({ currency: "JPY", price: "10,000", route: "other" }, ["5,000"]);
    expect(r.combined).toMatchObject({ count: 2, items: [10_000, 5_000], total: 15_000 });
    expect(r.result).toMatchObject({ ok: true, over: false, priceKrw: 135_000 }); // 15,000엔 = 135,000원 = 96.43달러
  });

  it("다른 통화 — 바트: 기호 ฿ 를 붙여 쓴 문장 · 환율로 달러 환산해 한도 판단 (฿3,000 + ฿3,000 = ฿6,000 → 171.43달러 > 150)", () => {
    const r = run({ currency: "THB", price: "3,000", route: "other" }, ["3000"]);
    expect(r.result).toMatchObject({ ok: true, over: true, priceUsd: 171.43, limitUsd: 150 });
    expect(r.combined?.sentence).toBe("물건 두 개 합계 ฿3,000 + ฿3,000 = ฿6,000 · 하나씩은 한도 안이지만 합치면 넘습니다");
  });
});

describe("틀린 입력은 계산하지 않고 이유 (IMP-05)", () => {
  it("더한 물건이 글자 · 음수 · 0 이면 어느 칸인지와 이유 — 결과는 가격 오류로 계산하지 않음", () => {
    const text = run({}, ["60", "abc"]);
    expect(text.extraError).toEqual({ index: 1, reason: "물건 값은 0 이상의 숫자만 됩니다" });
    expect(text.result).toMatchObject({ ok: false, field: "price", reason: "물건 값은 0 이상의 숫자만 됩니다" });
    expect(text.combined).toBeNull();
    expect(run({}, ["-5"]).extraError).toEqual({ index: 0, reason: "물건 값은 0보다 커야 합니다" });
    expect(run({}, ["0"]).extraError).toEqual({ index: 0, reason: "물건 값은 0보다 커야 합니다" });
  });

  it("첫 물건이 비어 있으면 더한 물건이 있어도 첫 물건 값을 넣어 달라는 이유(기존 문장)", () => {
    const r = run({ price: "" }, ["60"]);
    expect(r.result).toMatchObject({ ok: false, field: "price", reason: "물건 값을 넣어 주세요" });
    expect(r.combined).toBeNull();
  });

  it("환율을 받지 못한 통화는 지금과 같은 이유 (지어내지 않음)", () => {
    const r = run({ currency: "GBP" }, ["60"]);
    expect(r.result).toMatchObject({ ok: false, field: "rate" });
  });

  it("물건은 전체 최대 5개 — 더한 물건 4개까지 · 5개부터는 계산하지 않고 이유", () => {
    expect(run({ price: "10" }, ["10", "10", "10", "10"]).result).toMatchObject({ ok: true });
    const over = run({ price: "10" }, ["10", "10", "10", "10", "10"]);
    expect(over.result).toMatchObject({ ok: false, field: "price", reason: "물건은 최대 5개까지 더할 수 있습니다" });
    expect(over.combined).toBeNull();
  });
});

describe("물건 칸 늘리고 줄이기 (+ 물건 더하기 · 지우기)", () => {
  it("상한은 5 · 더한 물건은 4개까지", () => {
    expect(MAX_ITEMS).toBe(5);
    expect(canAddExtra([])).toBe(true);
    expect(canAddExtra(["", "", ""])).toBe(true);
    expect(canAddExtra(["", "", "", ""])).toBe(false);
  });

  it("더하기 — 빈 칸 하나 · 가득 차면 그대로", () => {
    expect(addExtra([])).toEqual([""]);
    expect(addExtra(["60"])).toEqual(["60", ""]);
    expect(addExtra(["1", "2", "3", "4"])).toEqual(["1", "2", "3", "4"]);
  });

  it("지우기 — 그 칸만 · 없는 자리면 그대로", () => {
    expect(removeExtra(["1", "2", "3"], 1)).toEqual(["1", "3"]);
    expect(removeExtra(["1"], 0)).toEqual([]);
    expect(removeExtra(["1", "2"], 5)).toEqual(["1", "2"]);
    expect(removeExtra(["1", "2"], -1)).toEqual(["1", "2"]);
  });
});

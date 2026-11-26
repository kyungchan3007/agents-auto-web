// 작업 0381 — 블프 hero 계산기 lib (테스트 먼저 · 구현 전에는 FAIL 이 정상)
// 요구(prd 4 · 5 · 6 · 7): "$" + 금액 + 선택칸(미국 목록통관 $200 / 그 밖 $150) · 한도는 import-calc rules(IMP-03) 재사용 · 새 세금 규칙 없음
//   입력 즉시 "약 N원" · 한도 안 "면세 · 한도까지 $X 남음" / 밖 "한도 초과 $X · 관부가세 대상" · 입력 전 안내 · 틀린 입력은 결과 대신 안내
//   환율: 이번 주 과세환율이 있으면 그것 · 없으면 수출입은행 + "예상 금액"(IMP-06) · 받지 못한 환율은 지어내지 않음
//
// builder 가 만들 것 — apps/web/src/features/home/blackfriday/bf-calc.ts
//   import type { Route } from "../../import-calc/calculator/rules"; · pickRate 의 결과를 그대로 받음(features 끼리 직접 가져오기가 막히면 shared 로 · builder 판단 · 함수 모양만 유지)
//   export type BfPicked = { rate: { baseRate: number; unit: number }; source: { kind: "customs"; weekStart: string; label: string } | { kind: "bank"; label: string } }
//   export const BF_IDLE_HINT = "원화로 얼마인지 바로 봅니다"
//   export type BfResult =
//     | { kind: "idle"; hint: string }                          // 금액이 비어 있음
//     | { kind: "error"; reason: string }                       // 틀린 입력 · 환율 없음 (결과 숫자 없음)
//     | { kind: "ok"; krw: number; krwText: string /* "약 252,000원" */; over: boolean; leftUsd: number; overUsd: number; ratio: number /* 한도 대비 · 막대 */; judge: string; estimated: boolean; sourceLabel: string }
//   export function bfCalc(input: { amount: string; route: Route }, picked: BfPicked | null): BfResult
//     - 금액 문자열은 "1,234.5" · 공백 허용 (parseAmount 와 같은 규칙) · 비면 idle · 숫자가 아니면 error "물건 값은 0 이상의 숫자만 됩니다" · 0 이하 error "물건 값은 0보다 커야 합니다"
//     - picked 가 null 이면 error "달러 환율을 받지 못해 계산할 수 없습니다" (원화를 지어내지 않음)
//     - krw = Math.round(금액 × 1달러 원화) · 한도 = DUTY_FREE_USD[route] · over = 금액 > 한도 (같으면 면세)
//     - judge: 안 = `면세 · 한도까지 $${leftUsd} 남음` / 밖 = `한도 초과 $${overUsd} · 관부가세 대상` ($ 금액은 소수 둘째 자리까지 · 끝자리 0 생략 · 천 단위 쉼표)
//     - estimated = source.kind === "bank" (과세환율이면 false) · sourceLabel = source.label
//
//   export const BF_ITEMS = [{ name: "에스프레소 머신", usd: 149 }, { name: "원두", usd: 38 }, { name: "머그", usd: 24 }]
//   export function receiptSteps(items: { name: string; usd: number }[], limitUsd: number, perUsdKrw: number | null): { name: string; usd: number; subtotalUsd: number; krw: number | null; stamp: "면세" | "과세" }[]
//     - 줄마다 누적 소계 · 소계 ≤ 한도면 "면세" 아니면 "과세" · krw = Math.round(소계 × 환율) · 환율이 없으면 null (빈 칸)
import { describe, expect, it } from "vitest";
import { DUTY_FREE_USD } from "../../import-calc/calculator/rules";
import { BF_IDLE_HINT, BF_ITEMS, type BfPicked, bfCalc, receiptSteps } from "./bf-calc";

const BANK: BfPicked = { rate: { baseRate: 1400, unit: 1 }, source: { kind: "bank", label: "수출입은행 환율로 계산한 예상 금액 (이번 주 과세환율 없음)" } };
const CUSTOMS: BfPicked = { rate: { baseRate: 1450, unit: 1 }, source: { kind: "customs", weekStart: "2026-11-22", label: "관세청 과세환율 · 2026-11-22 주 고시" } };
const us = (amount: string, picked: BfPicked | null = BANK) => bfCalc({ amount, route: "us-list" }, picked);
const other = (amount: string, picked: BfPicked | null = BANK) => bfCalc({ amount, route: "other" }, picked);

describe("한도는 import-calc rules 한 곳 (IMP-03)", () => {
  it("미국 목록통관 200 · 그 밖 150 — 새 값을 만들지 않음", () => {
    expect(DUTY_FREE_USD).toEqual({ "us-list": 200, other: 150 });
    expect(us("200")).toMatchObject({ kind: "ok", over: false });
    expect(us("201")).toMatchObject({ kind: "ok", over: true });
    expect(other("150")).toMatchObject({ kind: "ok", over: false });
    expect(other("151")).toMatchObject({ kind: "ok", over: true });
  });
});

describe("입력 전 · 틀린 입력 — 결과 숫자를 내지 않음", () => {
  it("비었거나 공백뿐이면 안내만", () => {
    for (const s of ["", "   "]) expect(us(s), JSON.stringify(s)).toEqual({ kind: "idle", hint: BF_IDLE_HINT });
    expect(BF_IDLE_HINT).toBe("원화로 얼마인지 바로 봅니다");
  });

  it("숫자가 아니면 error · 원화 없음", () => {
    for (const s of ["abc", "12a", "1e3", "--5", "$100", "1.2.3"]) {
      const r = us(s);
      expect(r.kind, s).toBe("error");
      expect(r, s).not.toHaveProperty("krw");
    }
    expect(us("abc")).toEqual({ kind: "error", reason: "물건 값은 0 이상의 숫자만 됩니다" });
  });

  it("0 · 음수 → error (0보다 커야)", () => {
    expect(us("0")).toEqual({ kind: "error", reason: "물건 값은 0보다 커야 합니다" });
    expect(us("-5")).toMatchObject({ kind: "error" });
  });

  it("받지 못한 환율은 지어내지 않고 error", () => {
    expect(us("100", null)).toEqual({ kind: "error", reason: "달러 환율을 받지 못해 계산할 수 없습니다" });
  });
});

describe("한도 안 — 면세", () => {
  it("미국 180달러 → 약 252,000원 · 한도까지 $20 남음", () => {
    expect(us("180")).toMatchObject({ kind: "ok", krw: 252_000, krwText: "약 252,000원", over: false, leftUsd: 20, overUsd: 0, judge: "면세 · 한도까지 $20 남음" });
  });

  it("한도와 같으면 면세 · 남음 $0", () => {
    expect(us("200")).toMatchObject({ over: false, leftUsd: 0, judge: "면세 · 한도까지 $0 남음" });
  });

  it("천 단위 쉼표 · 공백 · 소수 입력도 계산 (1,00 이 아니라 쉼표는 자리 구분)", () => {
    expect(us(" 1,000 ")).toMatchObject({ over: true });
    expect(us("149.5")).toMatchObject({ kind: "ok", krw: 209_300, over: false, leftUsd: 50.5, judge: "면세 · 한도까지 $50.5 남음" });
  });

  it("그 밖 나라 120달러 → 한도 150 · $30 남음", () => {
    expect(other("120")).toMatchObject({ over: false, leftUsd: 30, judge: "면세 · 한도까지 $30 남음" });
  });

  it("한도 대비 비율(막대) — 100달러는 미국 한도의 절반", () => {
    expect((us("100") as { ratio: number }).ratio).toBeCloseTo(0.5, 5);
  });
});

describe("한도 밖 — 관부가세 대상", () => {
  it("미국 250달러 → 한도 초과 $50 · 관부가세 대상 · 약 350,000원", () => {
    expect(us("250")).toMatchObject({ kind: "ok", krw: 350_000, krwText: "약 350,000원", over: true, leftUsd: 0, overUsd: 50, judge: "한도 초과 $50 · 관부가세 대상" });
  });

  it("그 밖 나라 160달러 → 한도 초과 $10", () => {
    expect(other("160")).toMatchObject({ over: true, overUsd: 10, judge: "한도 초과 $10 · 관부가세 대상" });
  });

  it("비율이 1 을 넘어도 값은 그대로 (막대 자르기는 화면 몫)", () => {
    expect((us("300") as { ratio: number }).ratio).toBeCloseTo(1.5, 5);
  });

  it("큰 금액은 쉼표 · 소수 둘째 자리 — 1,200.25달러 → 한도 초과 $1,000.25", () => {
    expect(us("1200.25")).toMatchObject({ over: true, overUsd: 1000.25, judge: "한도 초과 $1,000.25 · 관부가세 대상" });
  });
});

describe("환율 — 과세환율이 있으면 그것 · 없으면 은행 + 예상 금액 (IMP-06)", () => {
  it("은행 환율 → estimated true · 출처 글 그대로", () => {
    expect(us("100", BANK)).toMatchObject({ estimated: true, sourceLabel: BANK.source.label });
  });

  it("과세환율 → estimated false · 원화는 과세환율로 (100달러 × 1,450)", () => {
    expect(us("100", CUSTOMS)).toMatchObject({ estimated: false, krw: 145_000, krwText: "약 145,000원", sourceLabel: CUSTOMS.source.label });
  });

  it("고시 단위가 1 이 아니어도(예: 100 단위) 1달러 원화로 맞춤", () => {
    const per100: BfPicked = { rate: { baseRate: 140_000, unit: 100 }, source: BANK.source };
    expect(us("100", per100)).toMatchObject({ krw: 140_000 });
  });
});

describe("영수증 줄 (prd 8 · 9) — 면세 · 면세 · 과세", () => {
  it("품목은 에스프레소 머신 $149 · 원두 $38 · 머그 $24", () => {
    expect(BF_ITEMS).toEqual([
      { name: "에스프레소 머신", usd: 149 },
      { name: "원두", usd: 38 },
      { name: "머그", usd: 24 },
    ]);
  });

  it("누적 소계 149 · 187 · 211 · 한도 200 이면 도장 면세 · 면세 · 과세", () => {
    const s = receiptSteps(BF_ITEMS, DUTY_FREE_USD["us-list"], 1400);
    expect(s.map((x) => x.subtotalUsd)).toEqual([149, 187, 211]);
    expect(s.map((x) => x.stamp)).toEqual(["면세", "면세", "과세"]);
  });

  it("원화는 실제 환율로 — 소계 × 1,400", () => {
    expect(receiptSteps(BF_ITEMS, 200, 1400).map((x) => x.krw)).toEqual([208_600, 261_800, 295_400]);
  });

  it("환율이 없으면 원화는 null(빈 칸 · 지어내지 않음) · 도장은 달러로 정해짐", () => {
    const s = receiptSteps(BF_ITEMS, 200, null);
    expect(s.map((x) => x.krw)).toEqual([null, null, null]);
    expect(s.map((x) => x.stamp)).toEqual(["면세", "면세", "과세"]);
  });

  it("소계가 한도와 같으면 면세 (이하)", () => {
    expect(receiptSteps([{ name: "a", usd: 200 }], 200, 1400)[0].stamp).toBe("면세");
    expect(receiptSteps([{ name: "a", usd: 200.01 }], 200, 1400)[0].stamp).toBe("과세");
  });
});

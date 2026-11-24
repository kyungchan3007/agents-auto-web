// 직구 합산과세 (작업 0350 · 시안 7) — 같은 판매자에게 같은 날 산 물건 · 한 운송장으로 함께 오는 물건은 물품가격을 합쳐 면세 한도를 봄
// 출처: 「수입통관 사무처리에 관한 고시」 제68조(합산과세 기준) · 관세청고시 제2025-66호 · 확인한 날 2026-11-25 (rules.ts COMBINED_SOURCE · docs/domain/import-calc.md)
// 새 계산 규칙은 만들지 않음 — 지금 계산기(calc.ts)의 한도 판단 · 세금 계산을 합계에 그대로 씀 (물품가격만 한도에 · 국제 배송비는 한도에 안 넣음) · 순수 함수 (상태는 use-calc-form)
import { currencySymbol } from "@hav/shared/currency";
import { numberText } from "@hav/shared/format";
import { type CalcInput, type CalcResult, type Rate, calc, parseAmount } from "./calc";

/** 물건 전체 개수 상한 — 첫 물건 + 더한 물건 4개 (가정) */
export const MAX_ITEMS = 5;

export const COMBINED_LABEL = "같은 판매자에게 같은 날 산 물건";
export const COMBINED_NOTE = "같은 해외 판매자에게 같은 날 산 물건을 나눠 받거나, 한 운송장으로 함께 오는 물건은 합쳐서 면세 한도를 봅니다(합산과세). 판매자가 다르거나 산 날이 다르면 따로 봅니다.";
export const ADD_ITEM_LABEL = "+ 물건 더하기";

export const canAddExtra = (extras: string[]): boolean => extras.length < MAX_ITEMS - 1;
export const addExtra = (extras: string[]): string[] => (canAddExtra(extras) ? [...extras, ""] : extras);
export const removeExtra = (extras: string[], index: number): string[] => (index >= 0 && index < extras.length ? extras.filter((_, i) => i !== index) : extras);

export type Combined = { count: number; items: number[]; total: number; eachWithin: boolean; sentence: string | null };

const COUNT_WORD: Record<number, string> = { 2: "두", 3: "세", 4: "네", 5: "다섯" };

/** 기호가 있는 통화는 붙여서($180 · ฿3,000) · 없는 통화는 코드 + 공백 */
function money(currency: string, n: number): string {
  const symbol = currencySymbol(currency);
  const text = numberText(n, { maximumFractionDigits: 2 });
  return symbol === currency ? `${currency} ${text}` : `${symbol}${text}`;
}

/** 더한 물건 값 글 → 숫자 · 빈 칸은 empty · 글자는 "숫자만" · 0 이하는 "0보다 커야" (첫 물건의 기존 이유와 같은 말) */
function parseExtra(s: string): number | "empty" | { reason: string } {
  const t = s.replace(/[,\s]/g, "");
  if (t === "") return "empty";
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return { reason: "물건 값은 0 이상의 숫자만 됩니다" };
  const n = Number(t);
  return n > 0 ? n : { reason: "물건 값은 0보다 커야 합니다" };
}

/** 소수 여섯 자리까지 맞춰 부동소수 찌꺼기(0.1 + 0.2)를 없앰 */
const sum = (items: number[]) => Math.round(items.reduce((a, b) => a + b, 0) * 1e6) / 1e6;

/** 계산기에 넘길 글 — 지수 표기가 되지 않게 */
const asText = (n: number) => n.toFixed(6).replace(/\.?0+$/, "");

export function calcCombined(input: CalcInput, extras: string[], rates: Record<string, Rate>): { result: CalcResult; combined: Combined | null; extraError: { index: number; reason: string } | null } {
  const single = calc(input, rates);
  const given = extras.flatMap((s, index) => (s.trim() === "" ? [] : [{ index, value: parseExtra(s) }]));
  // 더한 물건이 없거나 첫 물건 · 배송비 · 관세율 · 환율이 이미 틀렸으면 지금 계산기 그대로
  if (given.length === 0 || !single.ok) return { result: single, combined: null, extraError: null };
  const bad = given.find((g) => typeof g.value === "object");
  if (bad && typeof bad.value === "object") {
    const reason = bad.value.reason;
    return { result: { ok: false, field: "price", reason }, combined: null, extraError: { index: bad.index, reason } };
  }
  if (given.length + 1 > MAX_ITEMS) return { result: { ok: false, field: "price", reason: `물건은 최대 ${MAX_ITEMS}개까지 더할 수 있습니다` }, combined: null, extraError: null };

  const first = parseAmount(input.price) as number; // single 이 ok 라 숫자
  const items = [first, ...given.map((g) => g.value as number)];
  const total = sum(items);
  const result = calc({ ...input, price: asText(total) }, rates);
  // 하나씩은 한도 안인지 — 물건마다 지금 계산기로 한도 판단
  const eachWithin = items.every((n) => {
    const one = calc({ ...input, price: asText(n) }, rates);
    return one.ok && !one.over;
  });
  const sentence = result.ok && result.over && eachWithin ? `물건 ${COUNT_WORD[items.length]} 개 합계 ${items.map((n) => money(input.currency, n)).join(" + ")} = ${money(input.currency, total)} · 하나씩은 한도 안이지만 합치면 넘습니다` : null;
  return { result, combined: { count: items.length, items, total, eachWithin, sentence }, extraError: null };
}

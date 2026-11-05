"use client";

// 직구 계산기 상태 — 입력은 이 화면 상태에만 (보내지 않음 · 저장하지 않음 IMP-01) · 계산은 calc.ts
import { groupByRegion } from "@hav/shared/currency";
import type { FxRate } from "@hav/shared/fx";
import { type ChangeEvent, useState } from "react";
import { useQueryParam } from "../../shared/use-query-param";
import { type CalcInput, calc, catMood } from "./calc";

export function useCalcForm(rates: FxRate[]) {
  const table = Object.fromEntries(rates.map((r) => [r.currency, r]));
  // /calc?currency=JPY (통화 둘러보기에서 옴) · 서버 그림은 달러
  const fromUrl = useQueryParam("currency");
  const [picked, setInput] = useState<Partial<CalcInput>>({});
  const currency = picked.currency ?? (table[fromUrl] ? fromUrl : "USD");
  const input: CalcInput = { price: "", shipping: "", dutyRate: "", ...picked, currency, route: picked.route ?? (currency === "USD" ? "us-list" : "other") };
  const result = input.price.trim() !== "" ? calc(input, table) : null;
  return {
    codes: groupByRegion(rates).flatMap((g) => g.items.map((r) => r.currency)),
    input,
    result,
    mood: catMood(result),
    rate: table[input.currency],
    set: (k: keyof CalcInput) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setInput((i) => ({ ...i, [k]: e.target.value })),
    err: (f: string) => (result && !result.ok && result.field === f ? result.reason : null),
  };
}

"use client";

// 직구 계산기 상태 — 입력은 이 화면 상태에만 (보내지 않음 · 저장하지 않음 IMP-01) · 계산은 calc.ts
import { groupByRegion } from "@hav/shared/currency";
import type { FxRate } from "@hav/shared/fx";
import { type ChangeEvent, useState } from "react";
import { useQueryParam } from "@hav/ui/hooks/use-query-param";
import { kstDate } from "@hav/shared/date";
import { type CalcInput, type Rate, calc, catMood } from "../lib/calc";
import { type CustomsRate, pickRate } from "../lib/customs-rate";

export function useCalcForm(rates: FxRate[], customs: Record<string, CustomsRate> = {}) {
  const table = Object.fromEntries(rates.map((r) => [r.currency, r]));
  // 이번 주 과세환율이 있는 통화는 그 값으로 (없으면 수출입은행 값) — 면세 한도 비교용 달러도 같은 규칙 (작업 0163)
  const today = kstDate();
  const picks = Object.fromEntries(rates.map((r) => [r.currency, pickRate(r.currency, table, customs, today)]));
  const used: Record<string, Rate> = Object.fromEntries(Object.entries(picks).flatMap(([c, p]) => (p ? [[c, p.rate]] : [])));
  // /calc?currency=JPY (통화 둘러보기에서 옴) · 서버 그림은 달러
  const fromUrl = useQueryParam("currency");
  const [picked, setInput] = useState<Partial<CalcInput>>({});
  const currency = picked.currency ?? (table[fromUrl] ? fromUrl : "USD");
  const input: CalcInput = { price: "", shipping: "", dutyRate: "", ...picked, currency, route: picked.route ?? (currency === "USD" ? "us-list" : "other") };
  const result = input.price.trim() !== "" ? calc(input, used) : null;
  return {
    codes: groupByRegion(rates).flatMap((g) => g.items.map((r) => r.currency)),
    input,
    result,
    mood: catMood(result),
    rate: table[input.currency],
    source: picks[input.currency]?.source,
    set: (k: keyof CalcInput) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setInput((i) => ({ ...i, [k]: e.target.value })),
    err: (f: string) => (result && !result.ok && result.field === f ? result.reason : null),
  };
}

"use client";

// 블프 hero 계산기 상태 (작업 0381) — 입력은 이 화면 상태에만(보내지 않음 · 저장하지 않음 IMP-01) · 계산은 bf-calc · 환율 고르기는 직구 계산기와 같은 pickRate
import type { FxRate } from "@hav/shared/fx";
import { kstDate } from "@hav/shared/date";
import { type ChangeEvent, useState } from "react";
import type { Route } from "@/shared/customs/rules";
import { type CustomsRate, pickRate } from "@/shared/customs/customs-rate";
import { type BfPicked, bfCalc } from "./bf-calc";

export function useBfCalc(rates: FxRate[], customs: Record<string, CustomsRate> | null) {
  const [amount, setAmount] = useState("");
  const [route, setRoute] = useState<Route>("us-list");
  const table = Object.fromEntries(rates.map((r) => [r.currency, r]));
  const picked: BfPicked | null = pickRate("USD", table, customs, kstDate());
  return {
    amount,
    route,
    result: bfCalc({ amount, route }, picked),
    /** 1달러당 원 · 환율이 없으면 null (영수증 원화는 빈 칸) */
    perUsd: picked ? picked.rate.baseRate / picked.rate.unit : null,
    onAmount: (e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value),
    onRoute: (e: ChangeEvent<HTMLSelectElement>) => setRoute(e.target.value === "other" ? "other" : "us-list"),
  };
}

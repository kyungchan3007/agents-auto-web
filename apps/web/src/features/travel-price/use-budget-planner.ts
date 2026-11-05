"use client";

// 여행 예산 계산 상태 (작업 0088) — 입력은 이 화면 상태에만 (보내지 않음) · 계산은 budget.ts
import type { SignalList } from "@hav/shared/signal";
import type { TravelRow } from "@hav/shared/travel";
import { useState } from "react";
import { useQueryParam } from "../../shared/use-query-param";
import { budgetOf, parseDaily, parseDays } from "./budget";

export type Latest = SignalList["signals"][number]["latest"];

export function useBudgetPlanner(rows: TravelRow[], latestOf: Record<string, Latest>) {
  const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  // /prices?country=THA#budget (홈 여행지 · 통화 상세에서 옴 · 작업 0100)
  const fromUrl = useQueryParam("country");
  const [picked, setCountry] = useState<string | null>(null);
  const fallback = rows.some((r) => r.country === "JPN") ? "JPN" : (sorted[0]?.country ?? "");
  const country = picked ?? (rows.some((r) => r.country === fromUrl) ? fromUrl : fallback);
  const [daily, setDaily] = useState("100,000");
  const [days, setDays] = useState("4");
  const row = rows.find((r) => r.country === country);
  const d = parseDaily(daily);
  const n = parseDays(days);
  const latest = row?.currency ? (latestOf[row.currency] ?? null) : null;
  return {
    sorted,
    country,
    setCountry,
    daily,
    setDaily,
    days,
    setDays,
    row,
    d,
    n,
    latest,
    budget: row && d != null && n != null ? budgetOf(d, n, row.relative, latest?.value ?? null) : null,
  };
}

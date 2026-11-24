"use client";

// 여행 예산 계산 상태 (작업 0088) — 입력은 이 화면 상태에만 (보내지 않음) · 계산은 budget.ts
import type { SignalList } from "@hav/shared/signal";
import type { TravelRow } from "@hav/shared/travel";
import { useState } from "react";
import { usePickedTrip } from "@/shared/trip/use-picked-trip";
import { useQueryParam } from "@hav/ui/hooks/browser/use-query-param";
import { budgetCountry, budgetOf, parseDaily, parseDays } from "./budget";

export type Latest = SignalList["signals"][number]["latest"];

export function useBudgetPlanner(rows: TravelRow[], latestOf: Record<string, Latest>, initial: string | null = null) {
  const sorted = [...rows].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  // /prices?country=THA#budget (홈 여행지 · 통화 상세에서 옴 · 작업 0100)
  const fromUrl = useQueryParam("country");
  const [picked, setCountry] = useState<string | null>(null);
  // 여행지(홈 · 시트 · 인트로)로 고른 나라가 있으면 그 나라로 시작 — 마운트 뒤에 읽어 서버 HTML 은 지금 그대로 (작업 0212)
  const pickedTrip = usePickedTrip();
  const country = budgetCountry({ rows: sorted, chosen: picked, fromUrl, pickedTrip: pickedTrip?.country ?? null, initial });
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

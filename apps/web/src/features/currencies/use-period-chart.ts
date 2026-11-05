"use client";

// 환율 흐름 기간 상태 (작업 0087) — 빌드 때 받은 1년치를 화면에서 자르기만 함 · 계산은 periods.ts
import { useState } from "react";
import { PERIODS, type PeriodId, changeOf, changeText, sliceDays } from "./periods";

export function usePeriodChart(rates: { date: string; baseRate: number }[]) {
  const [id, setId] = useState<PeriodId>("1y");
  const period = PERIODS.find((p) => p.id === id) ?? PERIODS[3];
  const shown = sliceDays(rates, period.days);
  const change = changeOf(shown);
  return { id, setId, period, shown, change, changeLabel: change ? changeText(change.pct) : null };
}

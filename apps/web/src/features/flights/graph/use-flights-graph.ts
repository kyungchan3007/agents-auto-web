"use client";

// /flights 그래프 상태 — 범례로 강조한 선 (작업 0181 → 0218: 그래프 폭 재기는 공통 선 그래프(LineChart)가 맡음)
import { useState } from "react";
import { type SeriesId, nextFocus } from "./flights-graph-view";

export function useFlightsGraph() {
  const [focus, setFocus] = useState<SeriesId | null>(null);
  return { focus, toggle: (id: SeriesId) => setFocus((f) => nextFocus(f, id)) };
}

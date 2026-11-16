"use client";

// /flights 그래프 상태 — 그래프 화면 폭(px · 라벨을 화면 픽셀 기준으로 놓음) · 범례로 강조한 선 (작업 0181)
import { useElementWidth } from "@hav/ui/hooks/use-element-width";
import { useRef, useState } from "react";
import { type SeriesId, nextFocus } from "../lib/flights-graph-view";

export function useFlightsGraph(initialWidth: number) {
  const box = useRef<HTMLDivElement>(null);
  const width = useElementWidth(box, initialWidth);
  const [focus, setFocus] = useState<SeriesId | null>(null);
  return { box, width, focus, toggle: (id: SeriesId) => setFocus((f) => nextFocus(f, id)) };
}

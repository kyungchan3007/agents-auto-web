"use client";

// 묶음별 나라 목록 상태 — 고른 지역 (계산은 bands.ts)
import type { Region } from "@hav/shared/currency";
import { useState } from "react";
import { type PriceBand, bandsView } from "./bands";

export function usePriceBands(bands: PriceBand[]) {
  const [region, setRegion] = useState<Region | "all">("all");
  return { region, setRegion, ...bandsView(bands, region) };
}

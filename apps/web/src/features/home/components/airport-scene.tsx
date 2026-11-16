"use client";
// 공항 시험 장면 자리 — 그리는 건 lib/airport-model.ts · 불러오기는 hooks/use-airport-scene.ts (작업 0184)
import type { RefObject } from "react";
import { useAirportScene } from "../hooks/use-airport-scene";

export function AirportScene({ progress }: { progress: RefObject<number> }) {
  const host = useAirportScene(progress);
  return <div ref={host} className="h-full w-full [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full" aria-hidden="true" />;
}

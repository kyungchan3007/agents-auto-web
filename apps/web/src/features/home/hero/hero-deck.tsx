"use client";

// 탑승권 넘김 상태를 hero 전체에 나눠 주는 틀 (작업 0380) — 그리기는 children
import type { ReactNode } from "react";
import { HeroDeckContext } from "./use-hero-deck-context";
import { useHeroDeck } from "./use-hero-deck";

export function HeroDeckProvider({ children }: { children: ReactNode }) {
  const deck = useHeroDeck();
  return <HeroDeckContext.Provider value={deck}>{children}</HeroDeckContext.Provider>;
}

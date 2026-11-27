"use client";

// 탑승권 넘김 · 고른 곳 상태를 hero 전체에 나눠 주는 틀 (작업 0380 · 0393) — 그리기는 children · 값(data)은 홈이 서버에서 넘김
import type { ReactNode } from "react";
import { HeroDeckContext } from "./use-hero-deck-context";
import { type HeroData, useHeroDeck } from "./use-hero-deck";

export function HeroDeckProvider({ data, children }: { data: HeroData; children: ReactNode }) {
  const deck = useHeroDeck(data);
  return <HeroDeckContext.Provider value={deck}>{children}</HeroDeckContext.Provider>;
}

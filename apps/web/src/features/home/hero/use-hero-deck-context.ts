"use client";

// 탑승권 넘김 · 고른 곳 상태를 hero 안 칩(왼쪽) · 숫자 칸 · 탑승권(오른쪽)이 함께 보게 하는 맥락 (작업 0380 · 0393)
import { createContext, useContext } from "react";
import { EMPTY_DECK, type HeroDeck } from "./use-hero-deck";

export const HeroDeckContext = createContext<HeroDeck | null>(null);

/** 맥락 밖에서 부르면(테스트 · 따로 그릴 때) 넘김 없는 빈 상태 */
export function useHeroDeckValue(): HeroDeck {
  return useContext(HeroDeckContext) ?? EMPTY_DECK;
}

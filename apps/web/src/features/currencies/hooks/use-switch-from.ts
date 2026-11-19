"use client";

// 통화 상세가 새로 그려질 때 직전에 보이던 통화의 값 (전환 기억에서 · 작업 0231) — 처음 들어옴 · 새로 고침은 null(움직임 없이 최종)
//   이동 한 번에 한 번만 꺼내 부품들이 같은 값을 나눠 읽음 · 새 통화가 값을 적기 시작하면(useSwitchRecord) 비움
import { useEffect, useState } from "react";
import { type SwitchSnapshot, rememberSwitch, switchFrom, withSwitch } from "../lib/switch-memory";

export function useSwitchFrom(code: string): SwitchSnapshot | null {
  const [from] = useState(() => switchFrom(code));
  return from;
}

/** 지금 보이는 통화의 값을 기억에 적어 둠 — 다음 통화로 바꿀 때 거기서 이어 가게 */
export function useSwitchRecord(code: string, part: { big?: number | null; min?: number | null; max?: number | null; avg?: number | null; pos?: number | null; amount?: number | null; won?: number | null }): void {
  const { big, min, max, avg, pos, amount, won } = part;
  useEffect(() => {
    const p: Parameters<typeof withSwitch>[1] = {};
    if (big !== undefined) p.big = big;
    if (min !== undefined) p.min = min;
    if (max !== undefined) p.max = max;
    if (avg !== undefined) p.avg = avg;
    if (pos !== undefined) p.pos = pos;
    if (amount !== undefined) p.amount = amount;
    if (won !== undefined) p.won = won;
    rememberSwitch(withSwitch(code, p));
  }, [code, big, min, max, avg, pos, amount, won]);
}

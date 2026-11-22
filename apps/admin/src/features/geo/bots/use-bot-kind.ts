"use client";

// 봇별 읽은 페이지 묶음 (작업 0303) — 전체 · AI 봇 · 검색 엔진 · 바뀌면 카드가 앞 자리 → 새 자리로 움직임
import { reduceMotion } from "@/shared/ui/events/admin-events";
import type { BotKind } from "./bots-view";
import { useLayoutEffect, useRef, useState } from "react";

export function useBotKind() {
  const [kind, setKind] = useState<BotKind>("all");
  const grid = useRef<HTMLDivElement>(null);
  const prev = useRef<Map<string, DOMRect>>(new Map());
  useLayoutEffect(() => {
    const els = [...(grid.current?.querySelectorAll<HTMLElement>("[data-bot]") ?? [])];
    const now = new Map(els.map((e) => [e.dataset.bot ?? "", e.getBoundingClientRect()]));
    if (prev.current.size > 0 && !reduceMotion()) {
      for (const e of els) {
        const a = prev.current.get(e.dataset.bot ?? "");
        const b = now.get(e.dataset.bot ?? "");
        if (!b || !e.animate) continue;
        if (!a) e.animate([{ opacity: 0, transform: "scale(.98)" }, { opacity: 1, transform: "none" }], { duration: 220 });
        else if (a.left !== b.left || a.top !== b.top) e.animate([{ transform: `translate(${a.left - b.left}px,${a.top - b.top}px)` }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.7,.2,1)" });
      }
    }
    prev.current = now;
  }, [kind]);
  return { kind, setKind, grid };
}

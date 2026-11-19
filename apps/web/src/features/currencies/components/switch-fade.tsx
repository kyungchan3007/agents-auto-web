"use client";

// 통화를 바꿀 때 글(제목 · 신호 글)이 아래에서 올라오며 바뀜 (작업 0231) — 처음 들어옴 · 새로 고침은 그대로 · 움직임 줄이기는 바로
import type { ReactNode } from "react";
import { useSwitchFrom } from "../hooks/use-switch-from";

export function SwitchFade({ code, delay = 0, className = "", children }: { code: string; delay?: number; className?: string; children: ReactNode }) {
  const from = useSwitchFrom(code);
  return (
    <span className={`${className} ${from ? "[@media(prefers-reduced-motion:no-preference)]:animate-[sw-in_.26s_cubic-bezier(.2,.8,.3,1)_both]" : ""}`} style={from ? { animationDelay: `${delay}ms` } : undefined}>
      {children}
    </span>
  );
}

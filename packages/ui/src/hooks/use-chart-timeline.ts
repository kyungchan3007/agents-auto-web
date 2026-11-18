"use client";

// 그래프 움직임 시간표 — 화면에 들어오면 한 번 0 → endMs 까지 흐르는 시계(ms) (작업 0216 · 시안 F)
//   서버 첫 그림 · 움직임 줄이기 · 자바스크립트가 못 도는 곳 = ms Infinity(최종 모양) — 내용이 먼저
//   움직일 수 있는 브라우저에서만 마운트 직후 0(처음 모양)으로 돌아가 있다가, 화면에 들어오면 재생 · 다시 돌지 않음
import { useReducedMotion } from "motion/react";
import { type RefObject, useEffect, useState, useSyncExternalStore } from "react";
import { useInViewOnce } from "./use-in-view-once";

export type TimelineState = "idle" | "playing" | "done";

export function useChartTimeline<T extends Element>(endMs: number): { ref: RefObject<T | null>; ms: number; state: TimelineState } {
  const reduce = useReducedMotion();
  const { ref, seen } = useInViewOnce<T>("-8% 0px");
  const armed = useSyncExternalStore(
    () => () => {},
    () => !reduce,
    () => false,
  );
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!armed || !seen) return;
    const t0 = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const t = now - t0;
      setMs(Math.min(t, endMs + 40));
      if (t < endMs + 40) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [armed, seen, endMs]);
  const done = !armed || (seen && ms >= endMs);
  return { ref, ms: done ? Number.POSITIVE_INFINITY : seen ? ms : 0, state: done ? "done" : seen ? "playing" : "idle" };
}

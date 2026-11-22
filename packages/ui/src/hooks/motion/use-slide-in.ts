"use client";

// 밀려 들어오기 (작업 0312 에 slide-in.tsx 에서 옮김) — 화면에 들어올 때 한 번 · 움직임 줄이기면 없음 · 끝나면 효과가 사라져 제자리 그대로
import { useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { useInViewOnce } from "../view/use-in-view-once";

export function useSlideIn(offset: string, ms: number) {
  const { ref, seen } = useInViewOnce<HTMLDivElement>();
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!seen || reduce || !el || typeof el.animate !== "function") return;
    el.animate([{ transform: offset, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: ms, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
  }, [seen, reduce, offset, ms, ref]);
  return ref;
}

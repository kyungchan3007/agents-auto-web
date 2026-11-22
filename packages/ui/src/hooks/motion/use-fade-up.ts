"use client";

// 페이드 업 (작업 0254 · 0312 에 fade-up.tsx 에서 옮김) — 구간이 화면에 들어올 때 한 번 · data-fu="순서" 조각마다 늦게 · 움직임 줄이기면 없음 · 끝나면 transform 이 남지 않음
import { useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { useInViewOnce } from "../view/use-in-view-once";

export function useFadeUp(o: { ms: number; stepMs: number; distance: string }) {
  const { ref, seen } = useInViewOnce<HTMLDivElement>();
  const reduce = useReducedMotion();
  const { ms, stepMs, distance } = o;
  useEffect(() => {
    const root = ref.current;
    if (!seen || reduce || !root || typeof root.animate !== "function") return;
    const marked = Array.from(root.querySelectorAll<HTMLElement>("[data-fu]"));
    const targets = marked.length > 0 ? marked.map((el) => ({ el, step: Number(el.dataset.fu) || 0 })) : [{ el: root, step: 0 }];
    for (const { el, step } of targets) {
      // cubic-bezier(.22,1,.36,1) — 늦춤 동안은 숨고(fill backwards) 끝나면 효과가 사라져 제자리 그대로
      el.animate([{ transform: distance, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: ms, delay: step * stepMs, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
    }
  }, [seen, reduce, ref, ms, stepMs, distance]);
  return ref;
}

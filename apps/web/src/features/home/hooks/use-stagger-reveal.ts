"use client";

// 목록 줄이 화면에 들어오면 위에서부터 차례로 나타나게 (작업 0217 · 미리보기 뒤 고칠 것 3)
//   서버 첫 그림 · 자바스크립트가 못 도는 곳 · 움직임 줄이기 = 모두 보임(최종 모양) — 내용이 먼저
//   움직일 수 있는 브라우저에서만 마운트 직후 숨김 준비(armed) → 목록이 화면에 들어오면 줄마다 stepMs 간격으로 "shown" · 한 번만
//   phase(i): "final"(그대로 보임) · "hidden"(투명 + 살짝 아래) · "shown"(나타남 — 이때 카운트업 · 동그라미도 시작)
import { useInViewOnce } from "@hav/ui/hooks/use-in-view-once";
import { useReducedMotion } from "motion/react";
import { type RefObject, useEffect, useState, useSyncExternalStore } from "react";

export type RevealPhase = "final" | "hidden" | "shown";

export const REVEAL_STEP_MS = 100;

export function useStaggerReveal<T extends Element>(count: number, stepMs = REVEAL_STEP_MS): { ref: RefObject<T | null>; phase: (index: number) => RevealPhase } {
  const reduce = useReducedMotion();
  const { ref, seen } = useInViewOnce<T>();
  // 숨김 준비 — 서버 첫 그림 · 하이드레이션 = false(보임), 움직일 수 있는 브라우저에서만 true (effect 안 setState 없이 구함)
  const armed = useSyncExternalStore(
    () => () => {},
    () => !reduce,
    () => false,
  );
  const [open, setOpen] = useState(0); // 나타난 줄 수 (위에서부터)
  useEffect(() => {
    if (!armed || !seen) return;
    const timers = Array.from({ length: count }, (_, i) => setTimeout(() => setOpen((n) => Math.max(n, i + 1)), i * stepMs));
    return () => timers.forEach(clearTimeout);
  }, [armed, seen, count, stepMs]);
  return { ref, phase: (i) => (!armed ? "final" : i < open ? "shown" : "hidden") };
}

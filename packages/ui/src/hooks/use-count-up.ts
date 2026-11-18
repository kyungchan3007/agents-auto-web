"use client";

// 숫자가 화면에 들어올 때 한 번, 최종 값 근처에서 시작해 약 1초 동안 최종 값으로 (작업 0216)
//   서버 첫 그림 · 움직임 줄이기 · 아직 화면에 안 들어옴 = progress 1 · value = 최종 값 (내용이 먼저 · 자바스크립트가 못 돌아도 최종 값이 보임)
//   progress(0→1)도 돌려줌 — 숫자와 같이 움직이는 도형(홈 도착지 막대 위 동그라미 등)이 같은 속도로 따라가게
//   쓰는 쪽: const { ref, value, progress } = useCountUp(1338.8, { digits: 1 }) → 값을 보일 요소에 ref
import { useReducedMotion } from "motion/react";
import { type RefObject, useEffect, useState } from "react";
import { COUNT_UP_MS, countUpValue, easeOut } from "../lib/count-up";
import { useInViewOnce } from "./use-in-view-once";

export function useCountUp<T extends Element = HTMLElement>(final: number, opts: { digits?: number; durationMs?: number } = {}): { ref: RefObject<T | null>; value: number; progress: number } {
  const { digits = 0, durationMs = COUNT_UP_MS } = opts;
  const reduce = useReducedMotion();
  const { ref, seen } = useInViewOnce<T>();
  const [t, setT] = useState(1); // 시간 비율 (곡선 적용 전)
  useEffect(() => {
    if (!seen || reduce) return;
    const t0 = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs);
      setT(p);
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [seen, reduce, durationMs]);
  const time = reduce ? 1 : t;
  return { ref, value: countUpValue(final, time, digits), progress: easeOut(time) };
}

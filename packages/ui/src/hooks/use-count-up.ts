"use client";

// 숫자가 화면에 들어올 때 한 번, 최종 값 근처에서 시작해 약 1초 동안 최종 값으로 (작업 0216)
//   서버 첫 그림 · 움직임 줄이기 · 아직 화면에 안 들어옴 = progress 1 · value = 최종 값 (내용이 먼저 · 자바스크립트가 못 돌아도 최종 값이 보임)
//   progress(0→1)도 돌려줌 — 숫자와 같이 움직이는 도형(홈 도착지 막대 위 동그라미 등)이 같은 속도로 따라가게
//   쓰는 쪽: const { ref, value, progress } = useCountUp(1338.8, { digits: 1 }) → 값을 보일 요소에 ref
//   from(작업 0231): 통화를 바꿀 때 직전 값에서 새 값으로 — 최종 값 근처가 아니라 그 값에서 시작 · delayMs 만큼 기다렸다가 시작(그동안은 직전 값 그대로)
import { useReducedMotion } from "motion/react";
import { type RefObject, useEffect, useState } from "react";
import { COUNT_UP_MS, countTo, countUpValue, easeOut } from "../lib/count-up";
import { useInViewOnce } from "./use-in-view-once";

/** 쉼표 · 소수 자리 글 — 웹 쪽 화면이 lib 를 직접 가져오지 못해(exports) 훅 파일로 같이 내보냄 */
export { formatCount } from "../lib/count-up";

export function useCountUp<T extends Element = HTMLElement>(final: number, opts: { digits?: number; durationMs?: number; enabled?: boolean; from?: number | null; delayMs?: number } = {}): { ref: RefObject<T | null>; value: number; progress: number } {
  const { digits = 0, durationMs = COUNT_UP_MS, enabled = true, from = null, delayMs = 0 } = opts;
  const hasFrom = from !== null && Number.isFinite(from) && from !== final; // enabled=false 인 동안은 시작하지 않음(최종 값) — 카드가 차례로 나타나는 순간에 맞춰 시작할 때
  const reduce = useReducedMotion();
  const { ref, seen } = useInViewOnce<T>();
  const [t, setT] = useState(hasFrom ? 0 : 1); // 시간 비율 (곡선 적용 전) — from 이 있으면 직전 값에서 시작
  useEffect(() => {
    if (!seen || reduce || !enabled) return;
    const t0 = performance.now() + delayMs;
    let raf = 0;
    const loop = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / durationMs));
      setT(p);
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [seen, reduce, durationMs, enabled, delayMs]);
  const time = reduce ? 1 : t;
  return { ref, value: hasFrom ? countTo(from, final, time, digits) : countUpValue(final, time, digits), progress: easeOut(time) };
}

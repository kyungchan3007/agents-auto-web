"use client";

// 값이 올라가며 맞춰지는 숫자 — 처음 화면에 들어올 때 한 번 최종 값 근처(85%)에서 약 1초 · 그 뒤 값이 바뀌면 이전 값에서 새 값으로 약 0.6초 (작업 0219 · 계산기 결과)
//   서버 첫 그림 · 움직임 줄이기 · 아직 화면에 안 들어옴 = 바로 최종 값 · 쓰는 쪽: const { ref, value } = useCountTween(result, 0) → 값을 보일 요소에 ref
//   useCountUp 은 처음 한 번만 · 이것은 값이 바뀔 때도 움직임 (바뀌는 도중 다시 바뀌면 그때 보이던 값에서 이어서)
import { useReducedMotion } from "motion/react";
import { type RefObject, useEffect, useRef, useState } from "react";
import { COUNT_TO_MS, COUNT_UP_MS, countTo, countUpStart } from "../lib/count-up";
import { useInViewOnce } from "./use-in-view-once";

/** 쉼표 · 소수 자리 글 — 웹 쪽 화면이 lib 를 직접 가져오지 못해 훅 파일로 같이 내보냄 */
export { formatCount } from "../lib/count-up";

export function useCountTween<T extends Element = HTMLElement>(final: number, digits = 0): { ref: RefObject<T | null>; value: number } {
  const reduce = useReducedMotion();
  const { ref, seen } = useInViewOnce<T>();
  const [value, setValue] = useState(final);
  const current = useRef(final); // 지금 보이는 값 (움직이는 도중 바뀌면 여기서 이어감)
  const started = useRef(false);
  useEffect(() => {
    if (!seen || reduce) {
      current.current = final;
      return;
    }
    const first = !started.current;
    started.current = true;
    const from = first ? countUpStart(final, digits) : current.current;
    const ms = first ? COUNT_UP_MS : COUNT_TO_MS;
    const t0 = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const v = countTo(from, final, p, digits);
      current.current = v;
      setValue(v);
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [final, seen, reduce, digits]);
  // 움직임 줄이기 · 아직 안 보임 = 최종 값 그대로
  return { ref, value: !seen || reduce ? final : value };
}

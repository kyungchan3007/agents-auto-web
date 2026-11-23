"use client";

// 값이 바뀔 때 지금 보이는 값에서 새 값으로 세어 감 (작업 0321 · 큰 제목 숫자) — 처음 그림 · 서버 · 자바스크립트 없음 · 움직임 줄이기는 바로 최종 값
//   카운트 도중 또 바뀌면 그 순간 보이던 값에서 새 값으로 이어 감 (튀지 않음) · 시간 · 곡선은 계산기 결과와 같은 COUNT_TO_MS · countTo
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { COUNT_TO_MS, countTo } from "../../lib/motion/count-up";

export function useTrackedCount(value: number, digits = 0): number {
  const reduce = useReducedMotion();
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  const [shown, setShown] = useState(value);
  const shownRef = useRef(value);
  const target = useRef(value);
  useEffect(() => {
    if (value === target.current) return;
    target.current = value;
    if (reduceRef.current) {
      shownRef.current = value;
      setShown(value);
      return;
    }
    const from = shownRef.current;
    const t0 = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const p = Math.min(1, (now - t0) / COUNT_TO_MS);
      const v = countTo(from, value, p, digits);
      shownRef.current = v;
      setShown(v);
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [value, digits]);
  return reduce ? value : shown;
}

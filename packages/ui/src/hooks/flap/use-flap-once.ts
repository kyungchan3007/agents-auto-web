"use client";

// 출발 안내판 — 처음 한 번만 넘어가는 시계 (작업 0177) · 움직임 줄이기면 돌지 않음 · 끝나면 다시 돌지 않음
// elapsed: 넘어가는 중이면 지난 시간(ms) · 아니면 null(최종 글자) · played: 한 번 끝났는지 · 서버 · 첫 그림은 null 이라 글자가 처음부터 보임
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export function useFlapOnce(totalMs: number, skip: boolean): { elapsed: number | null; played: boolean } {
  const [elapsed, setElapsed] = useState<number | null>(null);
  const [played, setPlayed] = useState(false);
  const done = useRef(false);
  useEffect(() => {
    if (skip || done.current || totalMs <= 0) return;
    const t0 = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const e = now - t0;
      if (e >= totalMs) {
        done.current = true;
        setElapsed(null);
        setPlayed(true);
        return;
      }
      setElapsed(e);
      raf = requestAnimationFrame(loop);
    };
    setElapsed(0);
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [skip, totalMs]);
  return { elapsed, played: played || skip };
}

/** 움직임 줄이기를 함께 봄 (작업 0312 에 flap-board.tsx 에서 옮김) */
export function useFlapPlay(totalMs: number) {
  const reduce = useReducedMotion();
  return { reduce, ...useFlapOnce(totalMs, !!reduce) };
}

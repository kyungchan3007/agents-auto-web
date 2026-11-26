"use client";

// 블프 영수증 모션 (작업 0381) — 한 번만(반복 없음) · 0.04초마다 흐른 시간을 올려 receiptAt 이 줄 · 카운트업 · 도장을 정함 · 움직임 줄이기면 다 찍힌 상태 + 마지막 도장
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { END_MS, FINAL_VIEW, type ReceiptView, receiptAt } from "./bf-receipt";

const TICK_MS = 40;

export function useBfReceipt(): ReceiptView {
  const reduce = useReducedMotion();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (reduce) return;
    let t = 0;
    const id = setInterval(() => {
      t += TICK_MS;
      setElapsed(t);
      if (t >= END_MS) clearInterval(id);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [reduce]);
  return reduce ? FINAL_VIEW : receiptAt(elapsed);
}

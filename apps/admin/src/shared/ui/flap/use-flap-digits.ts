"use client";

// 안내판처럼 숫자가 몇 번 넘어간 뒤 제 값에서 멈춤 (작업 0303 · 0312 에 flap.tsx 에서 옮김) — 움직임 줄이기면 그대로 · replay 가 바뀌면 다시
import { useEffect, useRef } from "react";
import { reduceMotion } from "../events/admin-events";
import { isDigit, spinDigit, stopTick } from "./flap-digits";

export function useFlapDigits(text: string, order: number, replay: number) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root || reduceMotion()) return;
    const timers: number[] = [];
    [...root.querySelectorAll<HTMLElement>("i")].forEach((cell, k) => {
      const fin = cell.dataset.f ?? "";
      if (!isDigit(fin)) return;
      const stop = stopTick(k, order);
      let t = 0;
      cell.classList.add("on");
      const id = window.setInterval(() => {
        t += 1;
        if (t >= stop) {
          window.clearInterval(id);
          cell.textContent = fin;
          cell.classList.remove("on");
          return;
        }
        cell.textContent = spinDigit(fin, stop, t);
      }, 55);
      timers.push(id);
    });
    return () => {
      timers.forEach((id) => window.clearInterval(id));
      root.querySelectorAll<HTMLElement>("i").forEach((c) => {
        c.textContent = c.dataset.f ?? "";
        c.classList.remove("on");
      });
    };
  }, [text, order, replay]);
  return ref;
}

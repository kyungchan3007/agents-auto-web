"use client";

// 노선 위를 도는 작은 비행기 (작업 0380) — 9초에 한 바퀴 · 움직임 줄이기면 멈춘 채 노선 한 지점
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

const LOOP_MS = 9000;
const STILL_AT = 0.3;

export function usePlaneLoop() {
  const reduce = useReducedMotion();
  const path = useRef<SVGPathElement>(null);
  const plane = useRef<SVGPathElement>(null);
  useEffect(() => {
    const p = path.current;
    const el = plane.current;
    if (!p || !el || typeof p.getTotalLength !== "function") return;
    const total = p.getTotalLength();
    const put = (t: number) => {
      const a = p.getPointAtLength(total * t);
      const b = p.getPointAtLength(total * Math.min(1, t + 0.004));
      el.setAttribute("transform", `translate(${a.x} ${a.y}) rotate(${(Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI})`);
    };
    if (reduce) {
      put(STILL_AT);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      put(((now - start) % LOOP_MS) / LOOP_MS);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);
  return { path, plane };
}

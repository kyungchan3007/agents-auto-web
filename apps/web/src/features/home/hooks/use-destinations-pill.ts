"use client";

// 홈 도착지 카드 — 요약 알약으로 접어 두었다가 화면에 들어오면 카드로 펼침 (작업 0228 · 모션 13번)
//   state: "final"(지금 운영 카드 · 서버 첫 그림 · 움직임 줄이기 · 자바스크립트 꺼짐) → "pill"(알약으로 접힘) → "expanding"(펼치는 중 · t = 시작 뒤 ms) → "final"(한 번만)
//   움직일 수 있는 브라우저에서만 마운트 직후 한 프레임 뒤 접음(armed) · 카드 윗부분이 화면에 들어오면(아래 12% 안쪽) 0.12초 머문 뒤 펼침 · 처음부터 보이면 바로
//   t 는 requestAnimationFrame 으로 갱신(타이머로 값을 바꾸지 않음) · 시간표는 lib/dest-motion.ts 의 pillFrame
import { useReducedMotion } from "motion/react";
import { type RefObject, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PILL_MOTION, pillTotalMs } from "../lib/dest-motion";

export type PillState = "final" | "pill" | "expanding";

export function useDestinationsPill<T extends HTMLElement>(count: number): { ref: RefObject<T | null>; state: PillState; t: number; full: number } {
  const reduce = useReducedMotion();
  const armed = useSyncExternalStore(
    () => () => {},
    () => !reduce,
    () => false,
  );
  const ref = useRef<T>(null);
  const [state, setState] = useState<PillState>("final");
  const [full, setFull] = useState(0); // 접기 전 카드 높이(px) — 펼칠 때 끝 높이
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!armed) return;
    const el = ref.current;
    if (!el) return;
    let io: IntersectionObserver | null = null;
    let hold = 0;
    const raf = requestAnimationFrame(() => {
      setFull(el.getBoundingClientRect().height);
      setState("pill");
      if (typeof IntersectionObserver === "undefined") {
        hold = window.setTimeout(() => setState("expanding"), PILL_MOTION.hold);
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io?.disconnect();
          hold = window.setTimeout(() => setState("expanding"), PILL_MOTION.hold);
        },
        { rootMargin: "0px 0px -12% 0px" },
      );
      io.observe(el);
    });
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      clearTimeout(hold);
    };
  }, [armed]);
  useEffect(() => {
    if (state !== "expanding") return;
    const t0 = performance.now();
    const total = pillTotalMs(count);
    let raf = 0;
    const loop = (now: number) => {
      const el = Math.max(0, now - t0);
      if (el >= total) {
        setState("final");
        return;
      }
      setT(el);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state, count]);
  return { ref, state, t: state === "expanding" ? t : 0, full };
}

"use client";

// 막대가 화면에 들어올 때 왼쪽에서 채움 (작업 0303 · 0312 에 bars.tsx 에서 옮김) — 처음부터 채운 모습이 기본(자바스크립트 없을 때 · 움직임 줄이기)
import { useEffect, useRef } from "react";
import { reduceMotion } from "../events/admin-events";

export function useFillOnView<E extends HTMLElement>() {
  const ref = useRef<E>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reduceMotion() || !("IntersectionObserver" in window)) return;
    el.classList.add("adm-pre");
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) {
          if (!e.isIntersecting) continue;
          requestAnimationFrame(() => el.classList.remove("adm-pre"));
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.classList.remove("adm-pre");
    };
  }, []);
  return ref;
}

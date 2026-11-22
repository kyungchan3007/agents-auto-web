"use client";

// 궁금한 것 (작업 0303) — 고른 질문 · 화살표로 앞뒤 · 찾기 창에서 고른 질문(adm-pick · data-pick="click")은 누르고 판으로 스크롤
import { reduceMotion } from "@hav/ui/lib/admin-events";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { HOW_FAQ } from "../lib/how";

export function useFaq() {
  const [cur, setCur] = useState(0);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
    e.preventDefault();
    const n = (cur + (e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1) + HOW_FAQ.length) % HOW_FAQ.length;
    setCur(n);
    btns.current[n]?.focus();
  };
  useEffect(() => {
    const on = (e: Event) => {
      const b = e.target as HTMLElement;
      if (b.dataset.pick !== "click") return;
      e.preventDefault();
      b.click();
      b.closest(".adm-panel")?.scrollIntoView({ block: "start", behavior: reduceMotion() ? "auto" : "smooth" });
    };
    document.addEventListener("adm-pick", on, true);
    return () => document.removeEventListener("adm-pick", on, true);
  }, []);
  return { cur, setCur, btns, onKey };
}

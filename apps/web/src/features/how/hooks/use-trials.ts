"use client";

// 시행착오 목록 (작업 0306) — 종류로 골라 보기 · 하나씩 · 모두 펼치기 · 찾기 창에서 고른 항목(adm-pick)은 펼치고 가운데로
import { reduceMotion } from "@hav/ui/lib/admin-events";
import { useEffect, useRef, useState } from "react";
import { HOW_TRIALS, type TrialCat } from "../lib/story";

export function useTrials() {
  const [cat, setCat] = useState<TrialCat | "all">("all");
  const [open, setOpen] = useState<Set<number>>(new Set());
  const list = useRef<HTMLOListElement>(null);
  const shown = HOW_TRIALS.map((t, i) => ({ t, i })).filter(({ t }) => cat === "all" || t.cat === cat);
  const allOpen = shown.length > 0 && shown.every(({ i }) => open.has(i));
  const toggle = (i: number, on?: boolean) =>
    setOpen((s) => {
      const n = new Set(s);
      if (on ?? !n.has(i)) n.add(i);
      else n.delete(i);
      return n;
    });
  const toggleAll = () => shown.forEach(({ i }) => toggle(i, !allOpen));
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const onPick = (e: Event) => {
      const li = (e.target as HTMLElement).closest<HTMLElement>("[data-trial]");
      if (!li) return;
      e.preventDefault();
      setCat("all");
      toggle(Number(li.dataset.trial), true);
      requestAnimationFrame(() => li.scrollIntoView({ block: "center", behavior: reduceMotion() ? "auto" : "smooth" }));
    };
    el.addEventListener("adm-pick", onPick);
    return () => el.removeEventListener("adm-pick", onPick);
  }, []);
  return { cat, setCat, open, toggle, toggleAll, allOpen, shown, list };
}

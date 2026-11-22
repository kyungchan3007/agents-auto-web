"use client";

// 규칙 목록 (작업 0303) — 묶음(전체 · 안전 · 품질 · 협업) · 하나씩 · 모두 펼치기 · 찾기 창에서 고른 규칙(adm-pick)은 펼치고 가운데로
import { reduceMotion } from "@hav/ui/lib/admin-events";
import { useEffect, useRef, useState } from "react";
import { HOW_RULES, type RuleCat } from "../lib/how";

export function useRules() {
  const [cat, setCat] = useState<RuleCat | "all">("all");
  const [open, setOpen] = useState<Set<number>>(new Set());
  const list = useRef<HTMLDivElement>(null);
  const shown = HOW_RULES.map((r, i) => ({ r, i })).filter(({ r }) => cat === "all" || r.cat === cat);
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
      const d = (e.target as HTMLElement).closest<HTMLElement>("[data-rule]");
      if (!d) return;
      e.preventDefault();
      setCat("all");
      toggle(Number(d.dataset.rule), true);
      requestAnimationFrame(() => d.scrollIntoView({ block: "center", behavior: reduceMotion() ? "auto" : "smooth" }));
    };
    el.addEventListener("adm-pick", onPick);
    return () => el.removeEventListener("adm-pick", onPick);
  }, []);
  return { cat, setCat, open, toggle, toggleAll, allOpen, shown, list };
}

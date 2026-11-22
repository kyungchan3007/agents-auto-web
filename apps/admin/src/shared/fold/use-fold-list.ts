"use client";

// 묶음으로 골라 보고 하나씩 · 모두 펼치는 목록 (작업 0303 · 0306 · 0312 에 규칙 · 시행착오 훅의 같은 처리를 모음)
//   찾기 창에서 고른 항목(adm-pick)은 묶음을 "전체"로 · 그 항목을 펼치고 가운데로
import { useEffect, useRef, useState } from "react";
import { reduceMotion } from "../ui/events/admin-events";
import { shownItems } from "./fold";

/** dataKey: 항목 요소에 붙인 data-* 이름(번호) — 예: "rule" → data-rule={i} */
export function useFoldList<T, C extends string, E extends HTMLElement>(items: readonly T[], catOf: (x: T) => C, dataKey: string) {
  const [cat, setCat] = useState<C | "all">("all");
  const [open, setOpen] = useState<Set<number>>(new Set());
  const list = useRef<E>(null);
  const shown = shownItems(items, catOf, cat);
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
      const d = (e.target as HTMLElement).closest<HTMLElement>(`[data-${dataKey}]`);
      if (!d) return;
      e.preventDefault();
      setCat("all");
      toggle(Number(d.dataset[dataKey]), true);
      requestAnimationFrame(() => d.scrollIntoView({ block: "center", behavior: reduceMotion() ? "auto" : "smooth" }));
    };
    el.addEventListener("adm-pick", onPick);
    return () => el.removeEventListener("adm-pick", onPick);
  }, [dataKey]);
  return { cat, setCat, open, toggle, toggleAll, allOpen, shown, list };
}

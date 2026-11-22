"use client";

// 찾기 창 상태 (작업 0303 · 0312 에 admin-shell.tsx 에서 옮김) — 열기 · 닫기(앞의 초점으로) · 찾는 글 · 고른 줄 · 화살표 · Enter · Esc
import { type KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { type AdminNavPage, type PaletteItem, type SiteLink, clampSel, collectItems, rankItems, stepSel } from "./palette-items";

export function usePalette(pages: AdminNavPage[], page: string, site: SiteLink) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [items, setItems] = useState<PaletteItem[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const last = useRef<HTMLElement | null>(null);

  const show = useCallback(() => {
    last.current = document.activeElement as HTMLElement | null;
    setItems(collectItems(pages, page, site));
    setQ("");
    setSel(0);
    setOpen(true);
  }, [pages, page, site]);
  const hide = useCallback(() => {
    setOpen(false);
    last.current?.focus?.();
  }, []);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const found = rankItems(items, q);
  const cur = clampSel(sel, found.length);
  const choose = (i: number) => {
    const f = found[i];
    if (!f) return;
    setOpen(false);
    f.it.run();
  };
  const type = (v: string) => {
    setQ(v);
    setSel(0);
  };
  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!found.length) return;
      const n = stepSel(cur, found.length, e.key === "ArrowDown");
      setSel(n);
      document.getElementById(`adm-po-${n}`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(cur);
    } else if (e.key === "Escape") {
      e.preventDefault();
      hide();
    } else if (e.key === "Tab") e.preventDefault();
  };
  return { open, q, found, cur, input, show, hide, choose, type, onInputKey, setSel };
}

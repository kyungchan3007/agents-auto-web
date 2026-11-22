"use client";

// 틀이 처음 붙을 때 (작업 0303 · 0312 에 admin-shell.tsx 에서 옮김) — 판이 차례로 올라오게 순서(--o) · #판id 로 들어오면 그 판으로 · 찾기 단축키 표시
import { useBrowserValue } from "@hav/ui/hooks/use-browser-value";
import { useEffect, useRef } from "react";
import { flashPanel } from "../events/admin-events";
import { findKeyLabel } from "./palette-items";

export function useShellMount() {
  const mainRef = useRef<HTMLElement>(null);
  const mod = useBrowserValue(() => findKeyLabel(navigator.platform), () => "⌘K");
  useEffect(() => {
    mainRef.current?.querySelectorAll<HTMLElement>(":scope > *").forEach((el, i) => el.style.setProperty("--o", String(i)));
    const toHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (id) flashPanel(document.getElementById(id));
    };
    const t = window.setTimeout(toHash, 60);
    window.addEventListener("hashchange", toHash);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("hashchange", toHash);
    };
  }, []);
  return { mainRef, mod };
}

"use client";

// 모바일 메뉴 열고 닫기 (작업 0168 · 0312 에 nav-bar.tsx 에서 옮김) — 열려 있을 때 Esc 로 닫고 포커스를 버튼으로 돌려줌
import { useEffect, useId, useRef, useState } from "react";

export function useNavMenu() {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  return { open, toggle: () => setOpen((v) => !v), close: () => setOpen(false), menuId, button };
}

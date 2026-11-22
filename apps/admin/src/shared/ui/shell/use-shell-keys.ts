"use client";

// 단축키 (작업 0303 · 0312 에 admin-shell.tsx 에서 옮김) — ⌘K · Ctrl+K 찾기 · 숫자 화면 · / 걸러 보기 칸([data-key-slash]) · R 다시 받기([data-key-r]) · 글을 입력하는 중에는 쓰지 않음
import { useEffect } from "react";
import type { AdminNavPage } from "./palette-items";

export function useShellKeys({ pages, page, open, show, hide }: { pages: AdminNavPage[]; page: string; open: boolean; show: () => void; hide: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) hide();
        else show();
        return;
      }
      const a = document.activeElement as HTMLElement | null;
      const typing = !!a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable);
      if (typing || open || e.metaKey || e.ctrlKey || e.altKey) return;
      const p = pages.find((x) => x.key === e.key);
      if (p) {
        if (p.id !== page) location.href = p.href;
        return;
      }
      if (e.key === "/") {
        const f = document.querySelector<HTMLInputElement>("[data-key-slash]");
        if (f) {
          e.preventDefault();
          f.scrollIntoView({ block: "center" });
          f.focus({ preventScroll: true });
        }
      } else if (e.key.toLowerCase() === "r") document.querySelector<HTMLButtonElement>("[data-key-r]")?.click();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pages, page, show, hide]);
}

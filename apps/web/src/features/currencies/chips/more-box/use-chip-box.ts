"use client";

// 더보기 상자 상태 — 쪽 · 넘기는 방향 · Esc · 바깥 누르기로 닫힘 (작업 0231)
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

export function useBoxPage() {
  const [state, setState] = useState({ page: 0, dir: 0 });
  const go = useCallback((page: number, dir: number) => setState({ page, dir }), []);
  return { page: state.page, dir: state.dir, go };
}

/** 상자 밖을 누르거나 Esc 를 누르면 닫음 — 더보기 단추 자신의 누름은 그 단추가 열고 닫음 */
export function useBoxDismiss(onClose: () => void): RefObject<HTMLDivElement | null> {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const down = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t || box.current?.contains(t) || t.closest('[data-testid="chip-more"]')) return;
      onClose();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", down);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", down);
    };
  }, [onClose]);
  return box;
}

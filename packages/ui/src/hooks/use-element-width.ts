"use client";

// 요소의 화면 가로 폭(px) — 그래프 라벨을 화면 픽셀 기준으로 놓으려고 (작업 0175) · 처음(서버)에는 기본값, 붙은 뒤 실제 폭으로
import { type RefObject, useEffect, useState } from "react";

export function useElementWidth(ref: RefObject<HTMLElement | null>, initial: number): number {
  const [width, setWidth] = useState(initial);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setWidth(el.getBoundingClientRect().width || initial);
    read();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, initial]);
  return width;
}

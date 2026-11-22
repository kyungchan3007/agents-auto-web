"use client";

// 화면에 처음 들어올 때 한 번 true — 한 번 true 가 되면 관찰을 끝내고 다시 false 가 되지 않음 (작업 0216 · 카운트업 · 들어오기가 씀)
// 서버 · 첫 그림은 false · IntersectionObserver 가 없는 브라우저는 바로 true (움직임보다 내용이 먼저)
import { type RefObject, useEffect, useRef, useState } from "react";

export function useInViewOnce<T extends Element>(margin = "0px"): { ref: RefObject<T | null>; seen: boolean } {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setSeen(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        setSeen(true);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, margin]);
  return { ref, seen };
}

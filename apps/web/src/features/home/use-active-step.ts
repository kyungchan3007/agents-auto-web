"use client";

// 스크롤로 지금 칸 찾기 — 화면 세로 가운데 띠에 들어온 칸 = 지금 도시
import { useEffect, useRef, useState } from "react";

export function useActiveStep() {
  const [active, setActive] = useState(0);
  const steps = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    for (const el of steps.current) if (el) io.observe(el);
    return () => io.disconnect();
  }, []);

  return {
    active,
    stepRef: (i: number) => (el: HTMLElement | null) => {
      steps.current[i] = el;
    },
  };
}

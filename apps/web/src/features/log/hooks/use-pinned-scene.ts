"use client";

// 고정 패널 스크롤 — 패널은 화면에 고정 · 스크롤로 장면(0 · 1 · 2)만 바뀜
import { useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useRef, useState } from "react";

export function usePinnedScene() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  // 작게 → 크게 (①) · 끝에서 살짝 물러남 (지난 작업으로 넘어감)
  const scale = useTransform(scrollYProgress, [0, 0.18, 0.88, 1], [0.86, 1, 1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0.88, 1], [1, 0.35]);
  const [scene, setScene] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setScene(v < 0.33 ? 0 : v < 0.66 ? 1 : 2));
  return { ref, scale, opacity, scene };
}

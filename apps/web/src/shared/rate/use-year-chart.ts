"use client";

// 1년 흐름 그래프 상태 (작업 0219 · 0312 에 year-chart.tsx 에서 옮김) — 칸 너비 · 화면에 들어옴 · 처음 한 번 선이 그려지며 나타남(움직임 줄이기면 없음)
import { useElementWidth } from "@hav/ui/hooks/view/use-element-width";
import { useInViewOnce } from "@hav/ui/hooks/view/use-in-view-once";
import { useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

export function useYearChart(viewW: number, draw: boolean) {
  const box = useRef<HTMLDivElement>(null);
  const pw = useElementWidth(box, viewW);
  const { ref: rootRef, seen } = useInViewOnce<HTMLDivElement>();
  const reduce = useReducedMotion();
  const line = useRef<SVGPathElement>(null);
  useEffect(() => {
    const p = line.current;
    const svg = p?.ownerSVGElement;
    if (!draw || !seen || reduce || !p || !svg || typeof p.animate !== "function") return;
    // 선 길이는 화면 픽셀(굵기 고정 vectorEffect 라 점선 단위가 화면 픽셀) — 끝나면 효과가 사라져 다 그려진 그대로
    const len = p.getTotalLength() * (svg.getBoundingClientRect().width / viewW);
    p.animate([{ strokeDasharray: `${len} ${len}`, strokeDashoffset: len }, { strokeDasharray: `${len} ${len}`, strokeDashoffset: 0 }], { duration: 1200, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
  }, [draw, seen, reduce, viewW]);
  return { box, pw, rootRef, line };
}

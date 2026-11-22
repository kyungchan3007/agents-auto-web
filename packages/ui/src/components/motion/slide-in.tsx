"use client";

// 들어오기 — 화면에 들어올 때 한 번, 지정한 방향(기본 왼쪽)에서 제자리로 미끄러져 들어오며 끝에서 느려짐 (ease-out 약 0.7초 · 작업 0216)
//   <SlideIn from="left"> … </SlideIn>
//   서버 첫 그림은 제자리 (자바스크립트가 못 돌아도 내용이 보임) · 움직임 줄이기면 움직이지 않음 · 끝난 뒤 위치는 원래 제자리 (transform 이 남지 않음)
import type { ReactNode } from "react";
import { useSlideIn } from "../../hooks/motion/use-slide-in";

const OFFSET = { left: "translateX(-64px)", right: "translateX(64px)", up: "translateY(-32px)", down: "translateY(32px)" } as const;
export const SLIDE_IN_MS = 700;

export function SlideIn({ from = "left", children, className = "" }: { from?: keyof typeof OFFSET; children: ReactNode; className?: string }) {
  // 0.7s ease-out — 끝나면 효과가 사라져 제자리 그대로 (useSlideIn)
  const ref = useSlideIn(OFFSET[from], SLIDE_IN_MS);
  return (
    <div ref={ref} data-testid="slide-in" className={className}>
      {children}
    </div>
  );
}

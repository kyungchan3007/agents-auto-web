"use client";

// 페이드 업 — 구간이 화면에 들어올 때 한 번, 안에서 data-fu="순서" 를 단 조각들이 0.09초씩 늦게 아래 28px 에서 제자리로 떠오르며 나타남 (작업 0254 · 시안 27번 B안)
//   <FadeUpGroup className="…"> <Eyebrow data-fu={0} /> <h2 data-fu={1} /> <p data-fu={2} /> <div data-fu={3} /> … </FadeUpGroup>
//   순서: 작은 제목(0) → 큰 제목(1) → 설명(2) → 칩 · 단추(3) → 카드 · 표 · 그래프(4)  ·  표시한 조각이 없으면 구간 전체가 한 덩어리로
//   서버 첫 그림은 제자리 (자바스크립트가 못 돌아도 내용이 보임 · 숨겨 두지 않으니 자리 밀림 없음) · 움직임 줄이기면 움직이지 않음 · 끝난 뒤 transform 이 남지 않음 (slide-in.tsx 와 같은 약속)
import { useReducedMotion } from "motion/react";
import { type ReactNode, useEffect } from "react";
import { useInViewOnce } from "../../hooks/use-in-view-once";

export const FADE_UP_MS = 700;
export const FADE_UP_STEP_MS = 90;
const DISTANCE = "translateY(28px)";

export function FadeUpGroup({ children, className = "", id, testId = "fade-up" }: { children: ReactNode; className?: string; id?: string; /** 기존 화면 약속(data-testid)을 이어 쓸 때 */ testId?: string }) {
  const { ref, seen } = useInViewOnce<HTMLDivElement>();
  const reduce = useReducedMotion();
  useEffect(() => {
    const root = ref.current;
    if (!seen || reduce || !root || typeof root.animate !== "function") return;
    const marked = Array.from(root.querySelectorAll<HTMLElement>("[data-fu]"));
    const targets = marked.length > 0 ? marked.map((el) => ({ el, step: Number(el.dataset.fu) || 0 })) : [{ el: root, step: 0 }];
    for (const { el, step } of targets) {
      // 0.7s · cubic-bezier(.22,1,.36,1) — 늦춤 동안은 숨고(fill backwards) 끝나면 효과가 사라져 제자리 그대로
      el.animate([{ transform: DISTANCE, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: FADE_UP_MS, delay: step * FADE_UP_STEP_MS, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" });
    }
  }, [seen, reduce, ref]);
  return (
    <div ref={ref} id={id} data-testid={testId} className={className}>
      {children}
    </div>
  );
}

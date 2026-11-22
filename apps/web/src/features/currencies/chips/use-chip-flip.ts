"use client";

// 칩 줄 밀림 — FLIP (작업 0231): 그리기 전 자리(옛 자리)를 기억해 두었다가 바뀐 뒤 옛 자리에서 새 자리로 미끄러짐
//   새 칩은 작게 커지며 들어오고 · 밀려 나가는 칩(data-leaving)은 오른쪽으로 빠지며 사라짐 · 움직임 줄이기 · 다른 탭이 바꾼 것(enabled 거짓)은 움직임 없이 바로
//   자리는 문서 기준(스크롤이 바뀌어도 같게) · 처음 그림은 움직이지 않음
import { type RefCallback, useCallback, useLayoutEffect, useRef } from "react";

type Pos = { x: number; y: number };

export function useChipFlip(signature: string, enabled: boolean): (code: string) => RefCallback<HTMLElement> {
  const els = useRef(new Map<string, HTMLElement>());
  const prev = useRef(new Map<string, Pos>());
  useLayoutEffect(() => {
    const now = new Map<string, Pos>();
    els.current.forEach((el, code) => {
      const r = el.getBoundingClientRect();
      now.set(code, { x: r.x + window.scrollX, y: r.y + window.scrollY });
    });
    if (enabled && prev.current.size > 0) {
      now.forEach((p, code) => {
        const el = els.current.get(code);
        const b = prev.current.get(code);
        if (!el) return;
        if (el.dataset.leaving === "true") {
          // 밀려 나가는 칩 — 옛 자리에서 오른쪽으로 빠지며 사라짐
          const dx = b ? b.x - p.x : 0;
          const dy = b ? b.y - p.y : 0;
          el.animate([{ transform: `translate(${dx}px,${dy}px)`, opacity: 1 }, { transform: `translate(${dx + 40}px,${dy}px) scale(.85)`, opacity: 0 }], { duration: 400, easing: "ease-in", fill: "forwards" });
        } else if (b) {
          const dx = b.x - p.x;
          const dy = b.y - p.y;
          if (Math.abs(dx) > 1 || Math.abs(dy) > 1) el.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.3,.9,.3,1)" });
        } else el.animate([{ opacity: 0, transform: "scale(.6)" }, { opacity: 1, transform: "scale(1.06)", offset: 0.7 }, { opacity: 1, transform: "none" }], { duration: 420, easing: "cubic-bezier(.3,1.3,.5,1)" });
      });
    }
    prev.current = now;
  }, [signature, enabled]);
  return useCallback(
    (code: string) => (el: HTMLElement | null) => {
      if (el) els.current.set(code, el);
      else els.current.delete(code);
    },
    [],
  );
}

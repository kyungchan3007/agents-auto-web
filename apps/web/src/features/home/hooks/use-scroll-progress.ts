// 긴 구간을 얼마나 스크롤했는지 (0~1) · 지금 보여 줄 설명 카드 (작업 0184)
//   움직임 줄이기면 스크롤과 상관없이 한 장면(활주로 대기)에 고정
import { useEffect, useRef, useState } from "react";
import { stopAt } from "../lib/airport-path";

const STILL_AT = 0.55;

export function useScrollProgress() {
  const wrap = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [stop, setStop] = useState(0);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      const el = wrap.current;
      if (!el) return;
      if (still.matches) {
        progress.current = STILL_AT;
      } else {
        const r = el.getBoundingClientRect();
        const room = r.height - window.innerHeight;
        progress.current = room > 0 ? Math.min(1, Math.max(0, -r.top / room)) : 0;
      }
      setStop(stopAt(progress.current));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    still.addEventListener("change", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      still.removeEventListener("change", update);
    };
  }, []);

  return { wrap, progress, stop };
}

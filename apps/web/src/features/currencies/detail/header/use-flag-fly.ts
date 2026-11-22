"use client";

// 국기 날아감 — 칩 국기 자리에서 제목 옆(머리 맨 위) 국기 자리까지 포물선 (작업 0231 · 모션 7)
//   전환일 때만(직전 값이 있을 때) · 출발은 칩을 누른 순간 적어 둔 자리(없으면 맨 앞 새 칩) · 약 0.72초 · 끝나면 DOM 에서 빠짐 · 그동안 제목 옆 국기는 숨김 · 움직임 줄이기는 날아가지 않음
import { useLayoutEffect, useRef, useState } from "react";
import { type SwitchSnapshot, takeFlyOrigin } from "../../switch/switch-memory";
import { arcPoint } from "../../switch/switch-motion";

const reducedNow = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useFlagFly(code: string, from: SwitchSnapshot | null) {
  const [flying, setFlying] = useState(() => from !== null && !reducedNow());
  const fly = useRef<HTMLDivElement>(null);
  const target = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = fly.current;
    const dest = target.current?.querySelector("svg")?.getBoundingClientRect();
    if (!flying || !el) return;
    const origin = takeFlyOrigin() ?? document.querySelector(`[data-testid="chip"][data-code="${code}"] svg`)?.getBoundingClientRect();
    if (!origin || !dest) {
      // 출발 · 도착 자리를 못 찾으면 날지 않고 바로 (다음 프레임에 정리)
      const t = window.setTimeout(() => setFlying(false), 0);
      return () => clearTimeout(t);
    }
    const a = { x: origin.x, y: origin.y };
    const b = { x: dest.x, y: dest.y };
    const s = dest.width / origin.width;
    Object.assign(el.style, { left: `${a.x}px`, top: `${a.y}px`, width: `${origin.width}px`, height: `${origin.height}px`, opacity: "1" });
    const frames = Array.from({ length: 17 }, (_, i) => {
      const t = i / 16;
      const p = arcPoint(a, b, t);
      return { offset: t, transform: `translate(${p.x - a.x}px, ${p.y - a.y}px) scale(${1 + (s - 1) * t}) rotate(${-6 * 4 * t * (1 - t)}deg)` };
    });
    const anim = el.animate(frames, { duration: 720, easing: "cubic-bezier(.45,0,.25,1)", fill: "forwards" }); // 끝 위치에 붙들어 둠 — 지워지기 전 한 프레임이 칩 자리로 튀지 않게
    anim.onfinish = () => setFlying(false);
    return () => anim.cancel();
  }, [flying, code]);
  return { flying, fly, target };
}

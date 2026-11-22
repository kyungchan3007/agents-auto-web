"use client";

// 창밖 12달 상태 — 보이는 달 · 덮개 상태(closed · opening · open) · 큰 숫자 카운트업 · 글자판 한 칸 넘김 (작업 0229 · 모션 1번)
//   그림 · 흐름은 lib/window-scene.ts 의 장면이 맡고 여기서는 콜백으로 달 · 덮개만 받음 · 창이 화면에 보이면 장면에 알려 덮개가 올라가게(한 번) · 다시 보기만 닫혔다 열림
//   서버 첫 그림 · 움직임 줄이기 = 가장 싼 달 · 열린 모양 · 숫자는 타이머가 아니라 requestAnimationFrame 으로
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import { type ShadeState, type WindowScene, createWindowScene, grainUrl } from "./window-scene";

const reducedNow = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 큰 숫자 — 달이 바뀌면 약 0.42초 동안 이전 값에서 새 값으로 (움직임 줄이기는 바로) */
function useCountTo(target: number): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    const reduce = reducedNow();
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = reduce ? 1 : Math.min(1, (now - t0) / 420);
      const e = 1 - (1 - p) ** 3;
      const val = p >= 1 ? target : start + (target - start) * e;
      from.current = val;
      setShown(val);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return shown;
}

/** 글자판 한 칸 — 글자가 바뀌면 위아래로 넘어가며(0.26초) 가운데에서 글자가 바뀜 (움직임 줄이기는 바로) */
export function useFlapChar(char: string): { ref: RefObject<HTMLSpanElement | null>; shown: string } {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(char);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const reduce = reducedNow();
    if (!reduce) ref.current?.animate([{ transform: "rotateX(0)", filter: "brightness(1)" }, { transform: "rotateX(88deg)", filter: "brightness(.7)", offset: 0.5 }, { transform: "rotateX(0)", filter: "brightness(1)" }], { duration: 260, easing: "ease-in-out" });
    const t = window.setTimeout(() => setShown(char), reduce ? 0 : 120);
    return () => clearTimeout(t);
  }, [char]);
  return { ref, shown };
}

export function useWindowMonths(months: number[], lowest: number, values: Record<number, number>) {
  const [month, setMonth] = useState(lowest); // 1~12
  const [shade, setShade] = useState<ShadeState>("closed");
  const view = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLCanvasElement>(null);
  const near = useRef<HTMLCanvasElement>(null);
  const front = useRef<HTMLCanvasElement>(null);
  const grain = useRef<HTMLDivElement>(null);
  const trip = useRef<HTMLDivElement>(null);
  const scene = useRef<WindowScene | null>(null);
  const monthsKey = months.join(",");
  useEffect(() => {
    const [w, b, n, f, t] = [view.current, back.current, near.current, front.current, trip.current];
    if (!w || !b || !n || !f || !t) return;
    if (grain.current) grain.current.style.backgroundImage = `url(${grainUrl()})`;
    const sc = createWindowScene({ win: w, back: b, near: n, front: f, months: monthsKey.split(",").map((x) => Number(x) - 1), lowest: lowest - 1, reduce: reducedNow(), onMonth: (m) => setMonth(m + 1), onShade: setShade });
    scene.current = sc;
    const io = new IntersectionObserver(
      (es) => {
        for (const e of es) sc.visible(e.isIntersecting, e.intersectionRatio);
      },
      { threshold: [0, 0.35, 0.6] },
    );
    io.observe(t);
    let rt = 0;
    const onResize = () => {
      clearTimeout(rt);
      rt = window.setTimeout(() => sc.size(), 100);
    };
    window.addEventListener("resize", onResize);
    return () => {
      io.disconnect();
      window.removeEventListener("resize", onResize);
      clearTimeout(rt);
      sc.destroy();
      scene.current = null;
    };
  }, [monthsKey, lowest]);
  const value = useCountTo(values[month] ?? 0);
  const pick = useCallback((m: number) => scene.current?.jumpTo(m - 1), []);
  const replay = useCallback(() => scene.current?.replay(), []);
  return { month, shade, value, pick, replay, view, back, near, front, grain, trip };
}

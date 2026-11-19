"use client";

// 여행 물가 스크롤 노선 상태 — 스크롤 진행 → 정거장 사이 위치 · 지금 정거장 · 방향 · 카드 숫자 (작업 0230 · 모션 3번)
//   서버 첫 그림 · 움직임 줄이기 · 자바스크립트 꺼짐 = 정적 노선(armed 거짓) · 움직일 수 있는 브라우저에서만 스크롤을 읽음
//   스크롤은 requestAnimationFrame 으로 모아 한 번에 · 휴대폰은 자가 화면보다 넓어 말(동그라미)을 따라 옆으로 흐름
import { useReducedMotion } from "motion/react";
import { type RefObject, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { isMoving, routeActive, routeFrame } from "../lib/price-route";

export type RouteFrame = { i: number; f: number; m: number };

type Out = {
  armed: boolean;
  fr: RouteFrame;
  active: number;
  dir: "forward" | "back";
  /** 지금 정거장이 바뀐 횟수 — 처음 값은 0(움직임 없이 바로) */
  swap: number;
  moving: boolean;
  sec: RefObject<HTMLElement | null>;
  stage: RefObject<HTMLDivElement | null>;
  ruler: RefObject<HTMLDivElement | null>;
  vp: RefObject<HTMLDivElement | null>;
  goto: (i: number) => void;
};

export function usePriceRoute(n: number): Out {
  const reduce = useReducedMotion();
  const armed = useSyncExternalStore(
    () => () => {},
    () => !reduce,
    () => false,
  );
  const sec = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const ruler = useRef<HTMLDivElement>(null);
  const vp = useRef<HTMLDivElement>(null);
  const [fr, setFr] = useState<RouteFrame>(() => routeFrame(0, n));
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const [swap, setSwap] = useState(0);
  const activeRef = useRef(0);
  const dirRef = useRef<"forward" | "back">("forward");
  const lastY = useRef(0);
  // 진행 p — 판이 메뉴 띠 아래에 붙은 뒤 구역 안에서 얼마나 내려왔는지
  const progress = useCallback(() => {
    const s = sec.current;
    const st = stage.current;
    if (!s || !st) return 0;
    const span = s.getBoundingClientRect().height - st.getBoundingClientRect().height;
    const stick = Number.parseFloat(getComputedStyle(st).top) || 0;
    return span > 0 ? (stick - s.getBoundingClientRect().top) / span : 0;
  }, []);
  useEffect(() => {
    if (!armed || n < 2) return;
    let ticking = false;
    lastY.current = window.scrollY;
    const frame = () => {
      ticking = false;
      const next = routeFrame(progress(), n);
      setFr(next);
      const a = routeActive(activeRef.current, next);
      if (a !== activeRef.current) {
        const first = activeRef.current === 0 && swapZero.current;
        activeRef.current = a;
        setActive(a);
        if (!first) setSwap((x) => x + 1);
        swapZero.current = false;
      }
      if (window.scrollY !== lastY.current) {
        const d = window.scrollY < lastY.current ? "back" : "forward";
        if (d !== dirRef.current) {
          dirRef.current = d;
          setDir(d);
        }
      }
      lastY.current = window.scrollY;
      // 휴대폰: 자가 화면보다 넓으면 말(동그라미)을 따라 옆으로 흐름
      const r = ruler.current;
      const v = vp.current;
      if (r && v) {
        const W = r.offsetWidth;
        const vw = v.clientWidth;
        if (W > vw + 2) {
          const x = (Number.parseFloat(r.dataset.planeX ?? "0") / 100) * W;
          r.style.transform = `translateX(${Math.min(0, Math.max(vw - W, vw * 0.5 - x))}px)`;
        } else r.style.transform = "";
      }
    };
    const req = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(frame);
      }
    };
    const swapZero = { current: true };
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req);
    const first = requestAnimationFrame(frame);
    return () => {
      window.removeEventListener("scroll", req);
      window.removeEventListener("resize", req);
      cancelAnimationFrame(first);
    };
  }, [armed, n, progress]);
  // 정거장 단추 — 그 정거장 위치로 부드럽게 스크롤
  const goto = useCallback(
    (i: number) => {
      const s = sec.current;
      const st = stage.current;
      if (!s || !st || n < 2) return;
      const span = s.getBoundingClientRect().height - st.getBoundingClientRect().height;
      const stick = Number.parseFloat(getComputedStyle(st).top) || 0;
      window.scrollTo({ top: window.scrollY + s.getBoundingClientRect().top - stick + span * (i / (n - 1)) + 1, behavior: "smooth" });
    },
    [n],
  );
  return { armed, fr, active, dir, swap, moving: isMoving(fr.m), sec, stage, ruler, vp, goto };
}

/** 카드 숫자 — 정거장이 바뀌면 이전 값에서 새 값으로 약 0.75초 (ease-out) · 처음은 바로 */
export function useCountTween(target: number, ms = 750): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      const val = k >= 1 ? target : start + (target - start) * (1 - (1 - k) ** 3);
      from.current = val;
      setShown(val);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return shown;
}

/** 세 칸 글자판 — 값이 바뀌면 칸마다 70ms 늦게 접히며(0.14초) 글자가 바뀜 */
export function useRouteTiles(chars: string[]): { ch: string; out: boolean }[] {
  const [tiles, setTiles] = useState(() => chars.map((ch) => ({ ch, out: false })));
  const key = chars.join("");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const want = key.split("");
    const timers: number[] = [];
    want.forEach((ch, j) => {
      timers.push(
        window.setTimeout(() => {
          setTiles((t) => t.map((x, k) => (k === j ? { ...x, out: true } : x)));
          timers.push(window.setTimeout(() => setTiles((t) => t.map((x, k) => (k === j ? { ch, out: false } : x))), 140));
        }, j * 70),
      );
    });
    return () => timers.forEach(clearTimeout);
  }, [key]);
  return tiles;
}

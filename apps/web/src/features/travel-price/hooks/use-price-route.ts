"use client";

// 여행 물가 스크롤 노선 상태 — 스크롤 진행 → 정거장 사이 위치 · 지금 정거장 · 방향 · 카드 숫자 (작업 0230 · 모션 3번)
//   서버 첫 그림 · 움직임 줄이기 · 자바스크립트 꺼짐 = 정적 노선(armed 거짓) · 움직일 수 있는 브라우저에서만 스크롤을 읽음
//   스크롤은 requestAnimationFrame 으로 모아 한 번에 · 휴대폰은 자가 화면보다 넓어 말(동그라미)을 따라 옆으로 흐름
import { useReducedMotion } from "motion/react";
import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";

export type RouteFrame = { i: number; f: number; m: number };

type Out = {
  armed: boolean;
  /** 스크롤 진행 0~1 (판이 메뉴 띠 아래에 붙은 뒤 구역 안에서 얼마나 내려왔는지) */
  progress: number;
  dir: "forward" | "back";
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
  const [progress, setProgress] = useState(0);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const dirRef = useRef<"forward" | "back">("forward");
  const lastY = useRef(0);
  const measure = useCallback(() => {
    const s = sec.current;
    const st = stage.current;
    if (!s || !st) return { span: 0, stick: 0, top: 0 };
    const sr = s.getBoundingClientRect();
    return { span: sr.height - st.getBoundingClientRect().height, stick: Number.parseFloat(getComputedStyle(st).top) || 0, top: sr.top };
  }, []);
  useEffect(() => {
    if (!armed || n < 2) return;
    let ticking = false;
    lastY.current = window.scrollY;
    const frame = () => {
      ticking = false;
      const m = measure();
      setProgress(m.span > 0 ? (m.stick - m.top) / m.span : 0);
      if (window.scrollY !== lastY.current) {
        const d = window.scrollY < lastY.current ? "back" : "forward";
        if (d !== dirRef.current) {
          dirRef.current = d;
          setDir(d);
        }
      }
      lastY.current = window.scrollY;
    };
    const req = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(frame);
      }
    };
    window.addEventListener("scroll", req, { passive: true });
    window.addEventListener("resize", req);
    const first = requestAnimationFrame(frame);
    return () => {
      window.removeEventListener("scroll", req);
      window.removeEventListener("resize", req);
      cancelAnimationFrame(first);
    };
  }, [armed, n, measure]);
  // 휴대폰: 자가 화면보다 넓으면 말(동그라미)을 따라 옆으로 흐름 — 그릴 때마다 말 위치(data-plane-x · %)를 읽어 맞춤
  useLayoutEffect(() => {
    const r = ruler.current;
    const v = vp.current;
    if (!r || !v) return;
    const W = r.offsetWidth;
    const vw = v.clientWidth;
    if (armed && W > vw + 2) {
      const x = (Number.parseFloat(r.dataset.planeX ?? "0") / 100) * W;
      r.style.transform = `translateX(${Math.min(0, Math.max(vw - W, vw * 0.5 - x))}px)`;
    } else r.style.transform = "";
  }, [armed, progress]);
  // 정거장 단추 — 그 정거장 위치로 부드럽게 스크롤
  const goto = useCallback(
    (i: number) => {
      const m = measure();
      if (n < 2) return;
      window.scrollTo({ top: window.scrollY + m.top - m.stick + m.span * (i / (n - 1)) + 1, behavior: "smooth" });
    },
    [n, measure],
  );
  return { armed, progress, dir, sec, stage, ruler, vp, goto };
}

/** 이전 결과를 이어 받아 다음 값을 정함 — 지금 정거장처럼 "움직이는 중에는 이전 값 유지" 가 필요한 값 · 바뀐 횟수(swap)도 돌려줌(처음 값은 0 → 움직임 없이 바로) */
export function useRouteStep<F>(frame: F, step: (prev: number, frame: F) => number): { value: number; swap: number } {
  const [state, setState] = useState({ value: 0, swap: 0 });
  const next = step(state.value, frame);
  if (next !== state.value) setState({ value: next, swap: state.swap + 1 }); // 그리는 중 값 이어 받기 (공식 방식 — 같은 그림 안에서 바로 다시 그림)
  return { value: next, swap: next !== state.value ? state.swap + 1 : state.swap };
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

/** 비행기 좌우 방향 — 값이 같은 구간(sameSeg)에서는 직전 방향을 그대로 둠 (뒤집히지 않음 · 작업 0251 ㄴ) */
export function usePlaneFlip(dir: "forward" | "back", sameSeg: boolean): boolean {
  const kept = useRef(dir);
  if (!sameSeg) kept.current = dir;
  return kept.current === "back";
}

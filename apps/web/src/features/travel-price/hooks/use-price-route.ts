"use client";

// 여행 물가 노선 상태 — 나라 단추로 고른 정거장 · 비행기 이동 · 방향 (작업 0230 · 모션 3번 → 작업 0266: 스크롤 고정을 풀고 나라 단추로 고르기)
//   처음에는 첫 정거장(가장 싼 나라) · 단추를 누르면 비행기가 그 값 위치로 약 0.9초(ease) 옮겨 간 뒤 카드가 그 나라로 바뀜(움직이는 동안은 이전 나라 카드가 옅게)
//   움직임 줄이기 · 자바스크립트 꺼짐: 움직임 없이 바로 바뀜(서버 첫 그림 = 첫 정거장) · 휴대폰은 자가 화면보다 넓어 말(동그라미)을 따라 옆으로 흐름
import { useReducedMotion } from "motion/react";
import { type RefObject, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/** 비행기가 정거장 사이를 옮겨 가는 시간 */
export const ROUTE_MOVE_MS = 900;
const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

type Out = {
  /** 움직임을 쓰는 브라우저인지(움직임 줄이기가 아님) */
  armed: boolean;
  /** 카드에 보이는 정거장 번호 (비행기가 도착한 뒤에 바뀜) */
  active: number;
  /** 단추로 고른 정거장 번호 */
  target: number;
  /** 비행기가 옮겨 가는 중 */
  moving: boolean;
  /** 지금 비행기 위치의 물가 값 (자 위 x 를 정함) */
  planeValue: number;
  dir: "forward" | "back";
  /** 도착해 카드가 바뀐 횟수 (처음은 0 → 움직임 없이 바로) */
  swap: number;
  /** 이번 이동이 같은 값 사이였나(스페인 111 ↔ 아랍에미리트 111 — 비행기 제자리 · 작업 0251) */
  sameValue: boolean;
  ruler: RefObject<HTMLDivElement | null>;
  vp: RefObject<HTMLDivElement | null>;
  goto: (i: number) => void;
};

/** values = 정거장 값(물가 N) 순서대로 */
export function usePriceRoute(values: number[]): Out {
  const reduce = useReducedMotion();
  const armed = !reduce;
  const n = values.length;
  const ruler = useRef<HTMLDivElement>(null);
  const vp = useRef<HTMLDivElement>(null);
  const [st, setSt] = useState({ active: 0, target: 0, from: values[0] ?? 0, t: 1, dir: "forward" as "forward" | "back", swap: 0, same: false });
  const toValue = values[st.target] ?? values[0] ?? 0;
  const planeValue = st.t >= 1 ? toValue : st.from + (toValue - st.from) * ease(st.t);
  const moving = st.t < 1;

  // 옮겨 가는 동안 requestAnimationFrame 으로 진행(t)을 올리고 · 끝나면 카드를 도착한 나라로
  useEffect(() => {
    if (st.t >= 1) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ROUTE_MOVE_MS);
      setSt((s) => (k >= 1 ? { ...s, t: 1, active: s.target, swap: s.swap + 1 } : { ...s, t: k }));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [st.target, st.t >= 1]); // eslint-disable-line react-hooks/exhaustive-deps

  // 단추 — 그 정거장으로 (움직임 줄이기는 움직임 없이 바로)
  const goto = useCallback(
    (i: number) => {
      if (i < 0 || i >= n) return;
      setSt((s) => {
        if (i === s.target) return s;
        const nowValue = s.t >= 1 ? (values[s.target] ?? s.from) : s.from + ((values[s.target] ?? s.from) - s.from) * ease(s.t);
        const dir = i > s.target ? "forward" : "back";
        const same = nowValue === values[i];
        return reduce ? { ...s, target: i, active: i, from: nowValue, t: 1, dir, same } : { ...s, target: i, from: nowValue, t: 0, dir, same };
      });
    },
    [n, reduce, values],
  );

  // 휴대폰: 자가 화면보다 넓으면 말(동그라미)을 따라 옆으로 흐름 — 그릴 때마다 말 위치(data-plane-x · %)를 읽어 맞춤
  useLayoutEffect(() => {
    const r = ruler.current;
    const v = vp.current;
    if (!r || !v) return;
    const W = r.offsetWidth;
    const vw = v.clientWidth;
    if (W > vw + 2) {
      const x = (Number.parseFloat(r.dataset.planeX ?? "0") / 100) * W;
      r.style.transform = `translateX(${Math.min(0, Math.max(vw - W, vw * 0.5 - x))}px)`;
    } else r.style.transform = "";
  }, [planeValue]);

  return { armed, active: st.active, target: st.target, moving, planeValue, dir: st.dir, swap: st.swap, sameValue: st.same, ruler, vp, goto };
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
  const [kept, setKept] = useState(dir);
  // 렌더 중 ref 대신 state 로 직전 방향을 기억 (값이 다른 구간에서만 갱신)
  if (!sameSeg && kept !== dir) setKept(dir);
  return (sameSeg ? kept : dir) === "back";
}

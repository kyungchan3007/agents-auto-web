"use client";

// 굴러가는 숫자 칸 · 판 상태 (작업 0227 · 0231 · 0312 에 rolling-number.tsx 에서 옮김) — 웹 애니메이션으로 띠를 굴림 · 움직임 줄이기면 바로 새 값
import { type MutableRefObject, useCallback, useLayoutEffect, useRef, useState } from "react";
import { ROLL_MID, ROLL_REPS, rollDelayMs, rollDurationMs, rollShift, rollSteps } from "../../lib/motion/rolling-number";

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;


type CellState = { pos: number; prev: number; init: boolean; anim: Animation | null; moving: boolean };

function stopMoving(s: CellState, cell: HTMLElement, onMove: (d: number) => void) {
  if (!s.moving) return;
  s.moving = false;
  cell.removeAttribute("data-moving");
  onMove(-1);
}

/** 지금 보이는 위치에서 to 번째 칸으로 굴림 (끝에서 한 칸의 16% 지나쳤다 돌아옴) */
function go(s: CellState, strip: HTMLElement, cell: HTMLElement, to: number, delay: number, reduce: boolean, onMove: (d: number) => void) {
  const cur = new DOMMatrix(getComputedStyle(strip).transform).m42; // 움직이는 중이면 그 자리
  s.anim?.cancel();
  s.anim = null;
  s.pos = to;
  strip.style.transform = rollShift(to);
  const H = cell.getBoundingClientRect().height || 1;
  const end = -to * H;
  if (reduce || Math.abs(end - cur) < 0.5) {
    stopMoving(s, cell, onMove);
    return;
  }
  const over = end + Math.sign(end - cur) * H * 0.16;
  const dur = rollDurationMs(Math.abs(end - cur) / H);
  if (!s.moving) {
    s.moving = true;
    cell.setAttribute("data-moving", "true");
    onMove(1);
  }
  const anim = strip.animate(
    [
      { transform: `translateY(${cur}px)`, easing: "cubic-bezier(.42,0,.24,1)" },
      { transform: `translateY(${over}px)`, offset: 0.82, easing: "cubic-bezier(.3,0,.4,1)" },
      { transform: `translateY(${end}px)` },
    ],
    { duration: dur, delay, fill: "backwards" },
  );
  s.anim = anim;
  anim.onfinish = () => {
    s.anim = null;
    stopMoving(s, cell, onMove);
    if (Math.abs(s.pos - ROLL_MID - 5) > 5) {
      // 가운데 벌로 몰래 옮겨 다음에도 굴러갈 여유
      s.pos = ROLL_MID + (s.pos % 10);
      strip.style.transform = rollShift(s.pos);
    }
  };
}

export type DigitArgs = { digit: number; place: number; value: number; mounted: MutableRefObject<boolean>; onMove: (d: number) => void; fromDigit: number | null; fromDir: 1 | -1; startDelay: number };

/** 숫자 칸 하나 — 처음 위치 · 값이 바뀌면 굴림 · 사라질 때 멈춤 */
export function useRollingDigit({ digit, place, value, mounted, onMove, fromDigit, fromDir, startDelay }: DigitArgs) {

  const cellRef = useRef<HTMLSpanElement>(null);
  const stripRef = useRef<HTMLSpanElement>(null);
  const st = useRef<CellState>({ pos: ROLL_MID + (fromDigit ?? digit), prev: value, init: false, anim: null, moving: false });
  // 처음 그림의 위치는 한 번만 정함 — 값이 바뀔 때마다 React 가 style 을 목표로 덮으면 굴러가기 전에 끝 위치가 되어 건너뜀 (이후 위치는 효과에서만 바꿈)
  const [startShift] = useState(() => rollShift(ROLL_MID + (fromDigit ?? digit)));
  useLayoutEffect(() => {
    const s = st.current;
    const cell = cellRef.current;
    const strip = stripRef.current;
    if (!cell || !strip) return;
    const reduce = reduced();
    if (!s.init) {
      s.init = true;
      s.prev = value;
      // 이전 값에서 굴러 시작(통화를 바꿀 때) — 움직임 줄이기면 바로 새 값
      if (fromDigit !== null) {
        if (reduce) {
          s.pos = ROLL_MID + digit;
          strip.style.transform = rollShift(s.pos);
        } else if (fromDigit !== digit) go(s, strip, cell, ROLL_MID + fromDigit + rollSteps(fromDigit, digit, fromDir), rollDelayMs(place) + startDelay, reduce, onMove);
        return;
      }
      // 나중에 생긴 자리는 0 에서 굴러 들어옴 (처음 그림의 자리는 그대로)
      if (mounted.current && !reduce && digit !== 0) {
        s.pos = ROLL_MID;
        strip.style.transform = rollShift(ROLL_MID);
        go(s, strip, cell, ROLL_MID + digit, 0, reduce, onMove);
      }
      return;
    }
    const dir = Math.sign(value - s.prev) >= 0 ? 1 : -1;
    s.prev = value;
    const cur = ((s.pos % 10) + 10) % 10;
    if (cur === digit) return; // 같은 숫자 · 이미 그리로 가는 중
    let to = s.pos + rollSteps(cur, digit, dir);
    if (to < 0 || to > ROLL_REPS * 10 - 1) to = ROLL_MID + digit;
    go(s, strip, cell, to, reduce ? 0 : rollDelayMs(place), reduce, onMove);
  }, [digit, place, value, mounted, onMove, fromDigit, fromDir, startDelay]);
  useLayoutEffect(
    () => () => {
      const s = st.current;
      s.anim?.cancel();
      s.anim = null;
      if (s.moving) {
        s.moving = false;
        onMove(-1);
      }
    },
    [onMove],
  );
  return { cellRef, stripRef, startShift };
}

/** 판 — 처음 그림 뒤 붙음 표시 · 움직이는 칸 수로 data-state(rolling · idle) */
export function useRollingRoot() {
  const rootRef = useRef<HTMLSpanElement>(null);
  const mounted = useRef(false);
  const moving = useRef(0);
  useLayoutEffect(() => {
    mounted.current = true;
  }, []);
  const onMove = useCallback((d: number) => {
    moving.current = Math.max(0, moving.current + d);
    rootRef.current?.setAttribute("data-state", moving.current > 0 ? "rolling" : "idle");
  }, []);
  return { rootRef, mounted, onMove };
}

"use client";

// 굴러가는 숫자 — 값이 바뀌면 자리마다 0~9 띠가 위(커짐) · 아래(작아짐)로 굴러 멈춤 (작업 0227 · 모션 4번)
//   <RollingNumber value={242136} suffix="원" slot="big" /> — 쉼표 · 앞 기호 · 단위는 굴러가지 않음 · 오른쪽 자리부터 조금씩 늦게 출발
//   처음 값은 그대로 보임(서버 첫 그림도 최종 값) · 움직이는 중 새 값이 오면 지금 보이는 위치에서 이어 감(되감기 없음)
//   움직임 줄이기면 굴리지 않고 바로 최종 값 · 화면 읽기에는 최종 값 한 번(roll-sr) · 나머지는 aria-hidden
//   띠 움직임은 웹 애니메이션(.animate) — 타이머로 숫자를 바꾸지 않음 · 다른 곳(통화 글자판 등)에서도 쓰도록 className 으로 크기 · 색만 받음
import { type MutableRefObject, useCallback, useLayoutEffect, useRef } from "react";
import { rollCells, rollDelayMs, rollDurationMs, rollSteps, rollText } from "../../lib/rolling-number";

type Props = { value: number; suffix?: string; prefix?: string; slot?: string; className?: string };

const REPS = 5; // 띠 길이 = 0~9 다섯 벌 · 가운데 벌에서 시작해 여유를 둠
const MID = 20;
const LH = 1.18; // 한 칸 높이(em)
const shift = (pos: number) => `translateY(${(-pos * LH).toFixed(4)}em)`;

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
  strip.style.transform = shift(to);
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
    if (Math.abs(s.pos - MID - 5) > 5) {
      // 가운데 벌로 몰래 옮겨 다음에도 굴러갈 여유
      s.pos = MID + (s.pos % 10);
      strip.style.transform = shift(s.pos);
    }
  };
}

const reduced = () => typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

function Digit({ digit, place, value, mounted, onMove }: { digit: number; place: number; value: number; mounted: MutableRefObject<boolean>; onMove: (d: number) => void }) {
  const cellRef = useRef<HTMLSpanElement>(null);
  const stripRef = useRef<HTMLSpanElement>(null);
  const st = useRef<CellState>({ pos: MID + digit, prev: value, init: false, anim: null, moving: false });
  useLayoutEffect(() => {
    const s = st.current;
    const cell = cellRef.current;
    const strip = stripRef.current;
    if (!cell || !strip) return;
    const reduce = reduced();
    if (!s.init) {
      s.init = true;
      s.prev = value;
      // 나중에 생긴 자리는 0 에서 굴러 들어옴 (처음 그림의 자리는 그대로)
      if (mounted.current && !reduce && digit !== 0) {
        s.pos = MID;
        strip.style.transform = shift(MID);
        go(s, strip, cell, MID + digit, 0, reduce, onMove);
      }
      return;
    }
    const dir = Math.sign(value - s.prev) >= 0 ? 1 : -1;
    s.prev = value;
    const cur = ((s.pos % 10) + 10) % 10;
    if (cur === digit) return; // 같은 숫자 · 이미 그리로 가는 중
    let to = s.pos + rollSteps(cur, digit, dir);
    if (to < 0 || to > REPS * 10 - 1) to = MID + digit;
    go(s, strip, cell, to, reduce ? 0 : rollDelayMs(place), reduce, onMove);
  }, [digit, place, value, mounted, onMove]);
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
  return (
    <span ref={cellRef} data-testid="roll-cell" data-kind="digit" data-digit={digit} className="relative inline-block h-[1.18em] w-[1ch] flex-none overflow-hidden">
      <span ref={stripRef} data-testid="roll-strip" className="flex flex-col will-change-transform" style={{ transform: shift(MID + digit) }}>
        {Array.from({ length: REPS * 10 }, (_, k) => (
          <span key={k} className="block h-[1.18em] text-center leading-[1.18em]">
            {k % 10}
          </span>
        ))}
      </span>
    </span>
  );
}

export function RollingNumber({ value, suffix = "", prefix = "", slot, className = "" }: Props) {
  const rounded = Math.max(0, Math.round(value));
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
  const cells = rollCells(rounded);
  const final = rollText(rounded, suffix, prefix);
  return (
    <span ref={rootRef} data-testid="rolling-number" data-slot={slot} data-value={rounded} data-final={final} data-state="idle" className={`inline-flex items-center whitespace-nowrap tabular-nums ${className}`}>
      {prefix && (
        <span data-testid="roll-prefix" aria-hidden="true" className="leading-[1.18em]">
          {prefix}
        </span>
      )}
      <span aria-hidden="true" className="inline-flex items-center">
        {cells.map((c, i) =>
          c.kind === "comma" ? (
            <span key={`c${cells[i + 1]?.place}`} data-testid="roll-cell" data-kind="comma" className="inline-block h-[1.18em] flex-none text-center leading-[1.18em]">
              ,
            </span>
          ) : (
            <Digit key={`d${c.place}`} digit={c.digit ?? 0} place={c.place ?? 0} value={rounded} mounted={mounted} onMove={onMove} />
          ),
        )}
      </span>
      {suffix && (
        <span data-testid="roll-suffix" aria-hidden="true" className="leading-[1.18em]">
          {suffix}
        </span>
      )}
      <span data-testid="roll-sr" className="sr-only">
        {final}
      </span>
    </span>
  );
}

"use client";

// 굴러가는 숫자 — 값이 바뀌면 자리마다 0~9 띠가 위(커짐) · 아래(작아짐)로 굴러 멈춤 (작업 0227 · 모션 4번)
//   <RollingNumber value={242136} suffix="원" slot="big" /> — 쉼표 · 앞 기호 · 단위는 굴러가지 않음 · 오른쪽 자리부터 조금씩 늦게 출발
//   처음 값은 그대로 보임(서버 첫 그림도 최종 값) · 움직이는 중 새 값이 오면 지금 보이는 위치에서 이어 감(되감기 없음)
//   움직임 줄이기면 굴리지 않고 바로 최종 값 · 화면 읽기에는 최종 값 한 번(roll-sr) · 나머지는 aria-hidden
//   굴러가는 칸(data-moving)만 위아래 가장자리가 흐려짐 — 색 그라데이션이 아니라 가리개(mask) · 시안 .rc.moving 과 같음
//   띠 움직임은 웹 애니메이션(.animate) — 타이머로 숫자를 바꾸지 않음 · 다른 곳(통화 글자판 등)에서도 쓰도록 className 으로 크기 · 색만 받음
//   from(작업 0231): 처음 그릴 때 그 값에서 굴러 시작(통화를 바꿀 때 직전 글자판 값에서) · startDelay: 굴러가기 시작을 늦춤(ms)
//   board(작업 0231): 글자판형 — 칸마다 판 칸 모양(칸 · 줄 높이 · 글자 모양은 쓰는 쪽이 class 로 정함) · 앞은 빈 칸으로 cols 칸에 맞춤 · 쉼표 · 단위도 칸 · 칸 안에서 굴러감(이음선 위)
import { type MutableRefObject, useCallback, useLayoutEffect, useRef, useState } from "react";
import { rollCells, rollDelayMs, rollDurationMs, rollSteps, rollText } from "../../lib/rolling-number";

type Board = { cols: number; /** 칸 모양(크기 · 바탕 · 글자 · 글꼴) */ cell: string; /** 띠 한 줄 높이(칸 높이와 같게) */ row: string };
type Props = { value: number; suffix?: string; prefix?: string; slot?: string; className?: string; from?: number | null; startDelay?: number; board?: Board };

const REPS = 5; // 띠 길이 = 0~9 다섯 벌 · 가운데 벌에서 시작해 여유를 둠
const MID = 20;
const shift = (pos: number) => `translateY(${((-pos / (REPS * 10)) * 100).toFixed(4)}%)`; // 띠 자기 높이의 비율 — 칸 높이가 em · rem 어느 쪽이어도 같음

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

type DigitProps = { digit: number; place: number; value: number; mounted: MutableRefObject<boolean>; onMove: (d: number) => void; fromDigit: number | null; fromDir: 1 | -1; startDelay: number; board?: Board };

function Digit({ digit, place, value, mounted, onMove, fromDigit, fromDir, startDelay, board }: DigitProps) {
  const cellRef = useRef<HTMLSpanElement>(null);
  const stripRef = useRef<HTMLSpanElement>(null);
  const st = useRef<CellState>({ pos: MID + (fromDigit ?? digit), prev: value, init: false, anim: null, moving: false });
  // 처음 그림의 위치는 한 번만 정함 — 값이 바뀔 때마다 React 가 style 을 목표로 덮으면 굴러가기 전에 끝 위치가 되어 건너뜀 (이후 위치는 효과에서만 바꿈)
  const [startShift] = useState(() => shift(MID + (fromDigit ?? digit)));
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
          s.pos = MID + digit;
          strip.style.transform = shift(s.pos);
        } else if (fromDigit !== digit) go(s, strip, cell, MID + fromDigit + rollSteps(fromDigit, digit, fromDir), rollDelayMs(place) + startDelay, reduce, onMove);
        return;
      }
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
  const rows = Array.from({ length: REPS * 10 }, (_, k) => k % 10);
  const mask = "data-[moving=true]:[mask-image:linear-gradient(transparent,#000_22%,#000_78%,transparent)]";
  if (board)
    return (
      <span ref={cellRef} data-testid="roll-cell" data-kind="digit" data-digit={digit} className={`relative inline-block flex-none overflow-hidden ${board.cell} ${mask}`}>
        <span ref={stripRef} data-testid="roll-strip" className="absolute inset-x-0 top-0 flex flex-col will-change-transform" style={{ transform: startShift }}>
          {rows.map((d, k) => (
            <span key={k} className={`flex items-center justify-center ${board.row}`}>
              {d}
            </span>
          ))}
        </span>
        <span aria-hidden className="absolute inset-x-0 top-1/2 z-[2] h-px bg-on-band" />
      </span>
    );
  return (
    <span ref={cellRef} data-testid="roll-cell" data-kind="digit" data-digit={digit} className={`relative inline-block h-[1.18em] w-[1ch] flex-none overflow-hidden ${mask}`}>
      <span ref={stripRef} data-testid="roll-strip" className="flex flex-col will-change-transform" style={{ transform: startShift }}>
        {rows.map((d, k) => (
          <span key={k} className="block h-[1.18em] text-center leading-[1.18em]">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

export function RollingNumber({ value, suffix = "", prefix = "", slot, className = "", from = null, startDelay = 0, board }: Props) {
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
  // 이전 값 — 자리마다 이전 숫자(없던 자리는 0) · 같은 값이면 쓰지 않음
  const fromRounded = from !== null && Number.isFinite(from) ? Math.max(0, Math.round(from)) : null;
  const useFrom = fromRounded !== null && fromRounded !== rounded;
  const fromByPlace = new Map(useFrom ? rollCells(fromRounded).flatMap((c) => (c.kind === "digit" ? [[c.place ?? 0, c.digit ?? 0] as const] : [])) : []);
  const fromDir: 1 | -1 = useFrom && fromRounded !== null && rounded < fromRounded ? -1 : 1;
  const digit = (c: (typeof cells)[number]) => (
    <Digit key={`d${c.place}`} digit={c.digit ?? 0} place={c.place ?? 0} value={rounded} mounted={mounted} onMove={onMove} fromDigit={useFrom ? (fromByPlace.get(c.place ?? 0) ?? 0) : null} fromDir={fromDir} startDelay={startDelay} board={board} />
  );
  if (board) {
    const used = cells.length + (suffix ? 1 : 0);
    const tile = "relative flex flex-none items-center justify-center";
    return (
      <span ref={rootRef} data-testid="rolling-number" data-slot={slot} data-value={rounded} data-final={final} data-state="idle" className={className}>
        {Array.from({ length: Math.max(0, board.cols - used) }, (_, i) => (
          <span key={`p${i}`} aria-hidden className={`${tile} ${board.cell}`}>
            <span className="absolute inset-x-0 top-1/2 h-px bg-on-band" />
          </span>
        ))}
        {cells.map((c, i) =>
          c.kind === "comma" ? (
            <span key={`c${cells[i + 1]?.place}`} aria-hidden data-testid="roll-cell" data-kind="comma" className={`${tile} ${board.cell}`}>
              ,
              <span className="absolute inset-x-0 top-1/2 h-px bg-on-band" />
            </span>
          ) : (
            digit(c)
          ),
        )}
        {suffix && (
          <span data-testid="roll-suffix" aria-hidden="true" className={`${tile} ${board.cell}`}>
            {suffix}
            <span className="absolute inset-x-0 top-1/2 h-px bg-on-band" />
          </span>
        )}
        <span data-testid="roll-sr" className="sr-only">
          {final}
        </span>
      </span>
    );
  }
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
            digit(c)
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

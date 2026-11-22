"use client";

// 12달 막대(2D · 풍성한 모양) — 위쪽만 둥근 막대 · 아래로 옅어지는 그라데이션 · 그림자 · 5월(가장 비쌈) 빨강 · 11월(가장 쌈) 노랑 · 나머지 옅은 파랑 · 말풍선 · 지수 눈금 (작업 0217 · 시안 F/home.html)
//   움직임(화면에 들어오면 한 번 · useChartTimeline · 약 2.8초): 눈금 서서히 → 1월부터 차례로 자람 → 가장 비싼 · 싼 달이 튀며 색 → 말풍선 톡 · 움직임 줄이기 · 서버 첫 그림 = 최종 모양
//   높이 · 눈금 숫자는 쓰는 쪽이 받은 실제 지수로 계산해 넘김 · 휴대폰(폭 < 560)은 월 이름이 숫자 · 옆 막대와 겹치는 말풍선은 위로 올려 점선으로 이음
//   DOM 약속: svg[data-testid=year-bars][data-state] 안에 year-bar[data-month · data-tone · data-reveal] · year-tag[data-kind=high|low · data-reveal]
import { type ReactNode, useId, useRef } from "react";
import { useChartTimeline } from "../../hooks/use-chart-timeline";
import { useElementWidth } from "../../hooks/use-element-width";
import { ease, progressAt, textWidth } from "../../lib/line-chart";

export type MonthBar = { month: number; tone: "high" | "low" | "mid" | "none"; /** 0~1 높이 (없으면 막대 없음) */ rel: number | null };

const T0 = 450;
const GROW = 650;
const rv = (n: number) => (n >= 1 ? "1" : n <= 0 ? "0" : n.toFixed(3));
const span = (ms: number, at: number, dur: number, e: keyof typeof ease = "out") => ease[e](progressAt({ at, dur }, ms));

/** 위쪽만 둥근 막대 경로 */
const barPath = (x: number, w: number, top: number, B: number, r0: number) => {
  const h = B - top;
  if (h <= 0.5) return `M${x},${B}h${w}v0h${-w}Z`;
  const r = Math.min(r0, w / 2, h);
  return `M${x},${B}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${B}Z`;
};

export function MonthBars({ bars, ticks, aria, highText, lowText }: { bars: MonthBar[]; /** 가로 눈금선(0~1 높이)과 왼쪽 숫자 */ ticks: { f: number; t: string }[]; aria: string; highText: string; lowText: string }): ReactNode {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const box = useRef<HTMLDivElement>(null);
  const W = Math.max(280, useElementWidth(box, 720));
  const phone = W < 560;
  const H = phone ? 300 : 380;
  const pad = phone ? { l: 34, r: 12, t: 56, b: 34 } : { l: 58, r: 24, t: 66, b: 40 };
  const L = pad.l;
  const R = W - pad.r;
  const T = pad.t;
  const B = H - pad.b;
  const PW = R - L;
  const PH = B - T;
  const slot = PW / 12;
  const bw = slot * (phone ? 0.68 : 0.62);
  const rad = phone ? 6 : 10;
  const STEP = phone ? 80 : 90;
  const hiAt = T0 + 11 * STEP + GROW - 150; // 모든 막대가 다 자란 뒤
  const total = hiAt + 260 + 120 + 480 + 40;
  const { ref, ms, state } = useChartTimeline<HTMLDivElement>(total);
  const X = (i: number) => L + slot * i + (slot - bw) / 2;
  const topOf = (rel: number, k: number) => B - PH * rel * k;
  const grid = span(ms, 0, 600);
  const axis = span(ms, 200, 600);
  const base = span(ms, 100, 700);
  const labelsA = span(ms, 300, 600);

  const high = bars.find((b) => b.tone === "high");
  const low = bars.find((b) => b.tone === "low");
  const tagOf = (kind: "high" | "low", b: MonthBar | undefined, text: string, k: number) => {
    if (!b || b.rel === null) return null;
    const i = b.month - 1;
    const cx = X(i) + bw / 2;
    const top = topOf(b.rel, 1);
    const th = phone ? 24 : 30;
    const tw = textWidth(text, 12, true) + (phone ? 18 : 24);
    const tail = 7;
    const bx = Math.max(4, Math.min(W - 4 - tw, cx - tw / 2));
    let by = top - tail - 6 - th;
    // 옆 막대와 겹치면(좁은 화면의 11월) 말풍선을 그 막대 위로 올리고 점선으로 잇는다
    bars.forEach((o, j) => {
      if (j !== i && o.rel !== null && X(j) < bx + tw && X(j) + bw > bx) by = Math.min(by, topOf(o.rel, 1) - 8 - th);
    });
    const e = span(ms, hiAt + 260 + k * 120, 480, "back");
    const color = kind === "high" ? "var(--hav-pin-expensive)" : "var(--hav-sun)";
    const ink = kind === "high" ? "var(--hav-card)" : "var(--hav-pin-ink)";
    const ox = cx;
    const oy = by + th + tail;
    return (
      <g key={kind} data-testid="year-tag" data-kind={kind} data-reveal={rv(span(ms, hiAt + 260 + k * 120, 480))} opacity={e > 0 ? 1 : 0} transform={`translate(${ox} ${oy}) scale(${Math.max(0.0001, e)}) translate(${-ox} ${-oy})`} filter={`url(#${uid}s${kind})`}>
        {oy < top - 8 && <line x1={cx} x2={cx} y1={oy} y2={top - 4} stroke={kind === "high" ? "var(--hav-pin-expensive)" : "#b8901f"} strokeWidth={1.6} strokeDasharray="3 3" />}
        <rect x={bx} y={by} width={tw} height={th} rx={th / 2} fill={color} />
        <path d={`M${cx - 6},${by + th - 1} L${cx},${by + th + tail} L${cx + 6},${by + th - 1}Z`} fill={color} />
        <text x={bx + tw / 2} y={by + th / 2 + 4.3} textAnchor="middle" fontSize={12} fontWeight={700} fill={ink} className="font-sans">
          {text}
        </text>
      </g>
    );
  };

  return (
    <div
      ref={(el) => {
        (box as { current: HTMLDivElement | null }).current = el;
        (ref as { current: HTMLDivElement | null }).current = el;
      }}
      className="relative overflow-hidden rounded-[0.875rem] bg-gradient-to-b from-card to-surface-2 ring-1 ring-line/60 ring-inset"
    >
      <svg data-testid="year-bars" data-state={state} width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="block overflow-visible">
        <defs>
          <linearGradient id={`${uid}mid`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="color-mix(in srgb, var(--hav-pin-cheap) 26%, var(--hav-card))" />
            <stop offset="1" stopColor="color-mix(in srgb, var(--hav-pin-cheap) 20%, var(--hav-card))" stopOpacity={0.35} />
          </linearGradient>
          <linearGradient id={`${uid}high`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--hav-pin-expensive)" />
            <stop offset="1" stopColor="color-mix(in srgb, var(--hav-pin-expensive) 60%, var(--hav-card))" stopOpacity={0.45} />
          </linearGradient>
          <linearGradient id={`${uid}low`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--hav-sun)" />
            <stop offset="1" stopColor="color-mix(in srgb, var(--hav-sun) 55%, var(--hav-card))" stopOpacity={0.5} />
          </linearGradient>
          <filter id={`${uid}smid`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx={0} dy={4} stdDeviation={4} floodColor="var(--hav-pin-ink)" floodOpacity={0.12} />
          </filter>
          <filter id={`${uid}shigh`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx={0} dy={4} stdDeviation={4} floodColor="var(--hav-pin-expensive)" floodOpacity={0.32} />
          </filter>
          <filter id={`${uid}slow`} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx={0} dy={4} stdDeviation={4} floodColor="#b8901f" floodOpacity={0.32} />
          </filter>
        </defs>

        <g data-testid="chart-grid" data-reveal={rv(grid)} opacity={grid}>
          {ticks.map((tk) => (
            <line key={tk.f} x1={L} x2={R} y1={B - PH * tk.f} y2={B - PH * tk.f} stroke="color-mix(in srgb, var(--hav-pin-line) 16%, transparent)" strokeDasharray={tk.f === 1 ? undefined : "3 5"} />
          ))}
        </g>
        <g data-testid="chart-axis" data-reveal={rv(axis)} opacity={axis}>
          {ticks.map((tk) => (
            <text key={tk.f} x={L - 10} y={B - PH * tk.f + 4} textAnchor="end" fontSize={12} fontWeight={600} fill="var(--hav-fg-2)" opacity={0.75} className="font-sans tabular-nums">
              {tk.t}
            </text>
          ))}
        </g>
        <line x1={L} x2={L + PW * base} y1={B} y2={B} stroke="var(--hav-pin-ink)" strokeWidth={1.8} strokeLinecap="round" />

        {bars.map((b, i) => {
          if (b.rel === null) return null;
          const grow = span(ms, T0 + i * STEP, GROW);
          const hi = b.tone === "high" || b.tone === "low";
          const bounce = hi ? Math.sin(Math.PI * progressAt({ at: hiAt, dur: 520 }, ms)) * (phone ? 10 : 14) : 0;
          const colorIn = hi ? span(ms, hiAt + 40, 420) : 0;
          const d = barPath(X(i), bw, topOf(b.rel, grow) - bounce, B, rad);
          return (
            <g key={b.month} data-testid="year-bar" data-month={b.month} data-tone={b.tone} data-reveal={rv(grow)} filter={`url(#${uid}smid)`}>
              <path d={d} fill={`url(#${uid}mid)`} />
              {hi && <path d={d} fill={`url(#${uid}${b.tone})`} opacity={colorIn} filter={`url(#${uid}s${b.tone})`} />}
            </g>
          );
        })}
        <g opacity={labelsA} transform={`translate(0 ${(1 - labelsA) * 6})`}>
          {bars.map((b, i) => (
            <text key={b.month} data-testid="year-month" x={X(i) + bw / 2} y={B + (phone ? 19 : 23)} textAnchor="middle" fontSize={12} fontWeight={b.tone === "high" || b.tone === "low" ? 700 : 400} fill={b.tone === "high" || b.tone === "low" ? "var(--hav-pin-ink)" : "var(--hav-fg-2)"} className="font-sans">
              {phone ? String(b.month) : `${b.month}월`}
            </text>
          ))}
        </g>
        {tagOf("high", high, highText, 0)}
        {tagOf("low", low, lowText, 1)}
      </svg>
    </div>
  );
}

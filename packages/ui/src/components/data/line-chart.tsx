"use client";

// 2D 선 그래프(풍성한 모양) — 부드러운 선 · 선 아래 그라데이션 면 · 그림자 · 눈금(값 · 날짜) · 최고 · 최저 꼬리표 · 끝 큰 숫자 말풍선 · 기준선 (작업 0216 · 시안 F)
//   움직임(화면에 들어오면 한 번 · useChartTimeline · 시간표 chartSchedule): 눈금 서서히 → 선 왼쪽부터 → 최고 · 최저 점 톡 → 색 면 차오름 → 끝 점 · 말풍선 숫자 카운트업
//   서버 첫 그림 · 움직임 줄이기 = 최종 모양(data-reveal 1) · 숫자는 모두 쓰는 쪽이 넘긴 실제 값 (점 위치도 실제 자료) · 외부 라이브러리 없음
//   DOM 약속(e2e): svg[data-testid=line-chart][data-state=idle|playing|done] 안에 chart-grid · chart-axis · chart-series[data-series] > chart-line · chart-area · chart-mark[data-kind] · chart-end[data-series] > chart-end-dot · chart-end-bubble · chart-end-value[data-final] — 움직이는 부분은 data-reveal(0~1)
//   글자는 SVG 안(px 그대로 · 폭에 맞춰 다시 그림) — 휴대폰(폭 < 560)은 눈금 · 꼬리표 · 말풍선을 줄인 모양
import type { ReactNode } from "react";
import { useChartBox } from "../../hooks/chart/use-chart-box";
import { useChartTimeline } from "../../hooks/chart/use-chart-timeline";
import { useElementWidth } from "../../hooks/view/use-element-width";
import { type EaseName, type Span, ease, fmtNum, monotonePath, progressAt, textWidth } from "../../lib/chart/line-chart";
import { type ChartMark, type ChartRef, type ChartSeries, type ChartTick, type LineChartProps, chartWidth, lineChartLayout } from "../../lib/chart/line-chart-layout";

export type { ChartMark, ChartRef, ChartSeries, ChartTick, LineChartProps };

const TONES = {
  red: { dot: "var(--hav-pin-expensive)", ink: "var(--hav-pin-expensive)", bg: "var(--hav-card)", border: "color-mix(in srgb, var(--hav-pin-expensive) 32%, transparent)" },
  sun: { dot: "var(--hav-sun)", ink: "#7a5600", bg: "#fff7dd", border: "#f2db98" },
  navy: { dot: "var(--hav-pin-ink)", ink: "var(--hav-pin-ink)", bg: "var(--hav-card)", border: "color-mix(in srgb, var(--hav-pin-ink) 24%, transparent)" },
} as const;
const GRID = "color-mix(in srgb, var(--hav-pin-line) 16%, transparent)";
const GRID_BASE = "color-mix(in srgb, var(--hav-pin-line) 34%, transparent)";
const MUTE = "var(--hav-fg-2)";

/** 시간표 한 칸의 진행값 — 이징을 입혀 0~1 (움직임 줄이기 · 서버 첫 그림은 ms 가 Infinity 라 1) */
const at = (ms: number, span: Span, e: EaseName = "out") => ease[e](progressAt(span, ms));
/** data-reveal 글 — 최종은 "1" · 가운데는 소수 3자리 */
const rv = (n: number) => (n >= 1 ? "1" : n <= 0 ? "0" : n.toFixed(3));

export function LineChart({ aria, x: xr, y, y2, xTicks, series, marks = [], refs = [], height = 400, heightPhone = 320, pad, padPhone, focus = null, className = "" }: LineChartProps): ReactNode {
  const { uid, box } = useChartBox();
  const W = chartWidth(useElementWidth(box, 720));
  const { phone, H, L, R, T, B, PW, X, Y, yOf, shapes, marksBySeries, labelOf, xt, sched, placedEnds, cy, numSize } = lineChartLayout({ W, x: xr, y, y2, xTicks, series, marks, height, heightPhone, pad, padPhone });
  const { ref, ms, state } = useChartTimeline<HTMLDivElement>(sched.total + 40);
  const gridA = at(ms, sched.grid);
  const axisA = at(ms, sched.axis);

  return (
    <div
      ref={(el) => {
        (box as { current: HTMLDivElement | null }).current = el;
        (ref as { current: HTMLDivElement | null }).current = el;
      }}
      className={`relative overflow-hidden rounded-[0.875rem] bg-gradient-to-b from-card to-surface-2 ring-1 ring-line/60 ring-inset ${className}`}
    >
      <svg data-testid="line-chart" data-state={state} width="100%" height={H} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} className="block overflow-visible">
        <defs>
          {shapes.map(({ s, k, minY }) => {
            const sc = sched.series[k];
            const rise = sc.area ? at(ms, sc.area) : 1;
            const hgt = B - minY + 12;
            return (
              <g key={s.id}>
                {s.area !== undefined && (
                  <>
                    <linearGradient id={`${uid}g${k}`} x1="0" x2="0" y1={minY} y2={B} gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor={s.color} stopOpacity={s.area} />
                      <stop offset="0.65" stopColor={s.color} stopOpacity={s.area * 0.28} />
                      <stop offset="1" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                    <clipPath id={`${uid}a${k}`}>
                      <rect x={0} width={W} y={B - hgt * rise} height={hgt * rise + 2} />
                    </clipPath>
                  </>
                )}
                <clipPath id={`${uid}w${k}`}>
                  <rect x={L - 8} y={0} width={Math.max(0, (PW + 16) * at(ms, sc.line, "io"))} height={H} />
                </clipPath>
                <filter id={`${uid}f${k}`} x="-20%" y="-40%" width="140%" height="200%">
                  <feDropShadow dx={0} dy={4} stdDeviation={4} floodColor={s.color} floodOpacity={s.dash ? 0.15 : 0.3} />
                </filter>
              </g>
            );
          })}
          <filter id={`${uid}dot`} x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx={0} dy={2} stdDeviation={2} floodOpacity={0.3} />
          </filter>
        </defs>

        <g data-testid="chart-grid" data-reveal={rv(gridA)} style={{ opacity: gridA }}>
          {y.ticks.map((tk, i) => (
            <line key={tk.v} x1={L} x2={R} y1={Y(tk.v)} y2={Y(tk.v)} stroke={i === 0 ? GRID_BASE : GRID} strokeWidth={i === 0 ? 1.4 : 1} />
          ))}
          {xt.map((t) => (
            <g key={t.x}>
              <line x1={X(t.x)} x2={X(t.x)} y1={T - 4} y2={B} stroke={GRID} strokeDasharray="2 4" />
              <line x1={X(t.x)} x2={X(t.x)} y1={B} y2={B + 5} stroke={GRID_BASE} strokeWidth={1.2} />
            </g>
          ))}
        </g>
        <g data-testid="chart-axis" data-reveal={rv(axisA)} style={{ opacity: axisA }} transform={`translate(0 ${(1 - axisA) * 6})`}>
          {y.ticks.map((tk) =>
            tk.t || tk.s ? (
              <g key={tk.v}>
                {tk.t && (
                  <text x={L - 10} y={Y(tk.v) + (tk.s && !phone ? -2 : 4)} textAnchor="end" fontSize={12} fontWeight={tk.on ? 700 : 400} fill={MUTE} className="font-sans">
                    {tk.t}
                  </text>
                )}
                {tk.s && !phone && (
                  <text x={L - 10} y={Y(tk.v) + 12.5} textAnchor="end" fontSize={12} fill={MUTE} className="font-sans">
                    {tk.s}
                  </text>
                )}
              </g>
            ) : null,
          )}
          {xt.map((t, k) => {
            const x = X(t.x);
            const first = k === 0 && x - L < 24;
            const last = k === xt.length - 1 && R - x < 24;
            return (
              <text key={t.x} data-testid="chart-xtick" x={first ? x - 4 : last ? x + 4 : x} y={B + (phone ? 19 : 21)} textAnchor={first ? "start" : last ? "end" : "middle"} fontSize={12} fontWeight={400} fill={MUTE} className="font-sans">
                {labelOf(t)}
              </text>
            );
          })}
        </g>

        {refs.map((rf, i) => {
          const yy = yOf(rf.axis)(rf.v);
          return <line key={i} data-testid="chart-ref" x1={L} x2={L + PW * at(ms, { at: 500, dur: 1100 }, "io")} y1={yy} y2={yy} stroke={rf.tone === "navy" ? "var(--hav-pin-ink)" : "var(--hav-pin-line)"} strokeWidth={1.6} strokeDasharray="6 5" />;
        })}

        {/* 선 하나 = 면 + 선 (면은 선 아래에 깔림) */}
        {shapes.map(({ s, k, runs, d }) => {
          const sc = sched.series[k];
          const line = at(ms, sc.line, "io");
          const rise = sc.area ? at(ms, sc.area) : 1;
          return (
            <g key={s.id} data-testid="chart-series" data-series={s.id} opacity={focus && focus !== s.id ? 0.25 : 1}>
              {s.area !== undefined &&
                runs.map((r, i) => (
                  <path key={i} data-testid="chart-area" data-reveal={rv(rise)} d={`${monotonePath(r.map((p) => [p.x, p.y]))}L${r[r.length - 1].x.toFixed(1)},${B}L${r[0].x.toFixed(1)},${B}Z`} fill={`url(#${uid}g${k})`} clipPath={`url(#${uid}a${k})`} />
                ))}
              <g clipPath={`url(#${uid}w${k})`}>
                <path data-testid="chart-line" data-reveal={rv(line)} d={d} fill="none" stroke={s.color} strokeWidth={s.width ?? (phone ? 2.6 : 3.2)} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={s.dash} filter={`url(#${uid}f${k})`} />
              </g>
            </g>
          );
        })}

        {/* 최고 · 최저 점 — 선 머리가 지나갈 때 톡 */}
        {shapes.map((sh, k) =>
          marksBySeries[k].map((m, j) => {
            const pt = sh.pts[m.index];
            const tone = TONES[m.tone];
            const e = at(ms, sched.series[k].marks[j], "back");
            const txt = phone && m.short ? m.short : m.text;
            const tw = textWidth(txt, phone ? 11 : 12, true) + 18;
            const th = phone ? 22 : 24;
            let tx = m.place === "left" ? -tw - 14 : -tw / 2;
            const ty = m.place === "below" ? 14 : m.place === "left" ? -th / 2 : -14 - th;
            // 오른쪽 끝은 "같은 높이에 걸치는 끝 말풍선들의 왼쪽 − 6" 까지만 — 꼬리표가 말풍선 위로 넘어가 겹치지 않게
            const top = pt.y + ty;
            const bottom = top + th;
            let limit = W - 4;
            placedEnds.forEach((pe, j) => {
              if (!pe.last) return;
              const bx = pe.last.x + (phone ? 12 : 16);
              const by = cy[j] - pe.en.h / 2;
              if (bottom > by - 2 && top < by + pe.en.h + 2) limit = Math.min(limit, bx - 6);
            });
            tx = Math.max(4 - pt.x, Math.min(limit - pt.x - tw, tx));
            return (
              <g key={`${sh.s.id}${j}`} data-testid="chart-mark" data-kind={m.kind} data-series={sh.s.id} data-reveal={rv(at(ms, sched.series[k].marks[j]))} transform={`translate(${pt.x} ${pt.y}) scale(${Math.max(0.0001, e)})`} opacity={e > 0 ? 1 : 0}>
                <circle r={phone ? 9 : 11} fill={tone.dot} opacity={0.18} />
                <circle r={phone ? 5 : 6.5} fill={tone.dot} stroke="var(--hav-card)" strokeWidth={2.5} filter={`url(#${uid}dot)`} />
                <rect x={tx} y={ty} width={tw} height={th} rx={12} fill={tone.bg} stroke={tone.border} strokeWidth={1.2} />
                <text x={tx + 9} y={ty + th / 2 + 4.2} fontSize={12} fontWeight={700} fill={tone.ink} className="font-sans">
                  {txt}
                </text>
              </g>
            );
          }),
        )}

        {/* 끝 값 — 큰 점 + 말풍선(큰 글자) · 숫자 카운트업 */}
        {placedEnds.map(({ en, k, last }, i) => {
          if (!last) return null;
          const s = en.s;
          const sc = sched.series[k];
          const dotE = at(ms, sc.endDot, "back");
          const halo = at(ms, { at: sc.line.at + sc.line.dur, dur: 1000 }, "lin");
          const bubE = at(ms, sc.endBubble);
          const count = at(ms, sc.endCount);
          const bx = last.x + (phone ? 12 : 16);
          const by = cy[i] - en.h / 2;
          const text = fmtNum(en.e.value * count, en.e.digits ?? 0) + (en.e.unit ?? "");
          const elbow = Math.abs(cy[i] - last.y) > 4;
          return (
            <g key={s.id} data-testid="chart-end" data-series={s.id} opacity={focus && focus !== s.id ? 0.3 : 1}>
              <circle cx={last.x} cy={last.y} r={8 + 18 * halo} fill="none" stroke={s.color} strokeWidth={2} opacity={halo > 0 && halo < 1 ? 0.5 * (1 - halo) : 0} />
              <g data-testid="chart-end-dot" data-reveal={rv(at(ms, sc.endDot))} transform={`translate(${last.x} ${last.y}) scale(${Math.max(0.0001, dotE)})`} opacity={dotE > 0 ? 1 : 0}>
                <circle r={phone ? 10 : 13} fill={s.color} opacity={0.16} />
                <circle r={phone ? 6 : 7.5} fill={s.color} stroke="var(--hav-card)" strokeWidth={3} filter={`url(#${uid}dot)`} />
              </g>
              <g data-testid="chart-end-bubble" data-reveal={rv(bubE)} opacity={bubE} transform={`translate(${(1 - bubE) * -10} 0)`}>
                {elbow ? <path d={`M${last.x + 7},${last.y} L${bx - 2},${cy[i]}`} stroke={s.color} strokeWidth={1.4} fill="none" opacity={0.6} /> : <path d={`M${bx + 1},${cy[i] - 5} L${bx - 5},${cy[i]} L${bx + 1},${cy[i] + 5}Z`} fill={s.color} />}
                <rect x={bx} y={by} width={en.w} height={en.h} rx={phone ? 8 : 12} fill={s.color} filter={`url(#${uid}f${k})`} />
                {!phone && (
                  <text x={bx + 12} y={by + 18} fontSize={12} fontWeight={600} fill="var(--hav-card)" opacity={0.85} className="font-sans">
                    {en.e.label}
                  </text>
                )}
                <text data-testid="chart-end-value" data-final={en.numTxt} data-reveal={rv(count)} x={bx + (phone ? 8 : 12)} y={by + (phone ? 18 : 40)} fontSize={numSize} fontWeight={800} fill="var(--hav-card)" className="font-display tabular-nums">
                  {text}
                </text>
              </g>
            </g>
          );
        })}

        {/* 기준선 꼬리표는 선 위에 보이도록 맨 나중에 */}
        {refs.map((rf, i) => {
          const yy = yOf(rf.axis)(rf.v);
          const txt = phone && rf.short ? rf.short : rf.text;
          const tw = textWidth(txt, 12, true) + 16;
          const lx = rf.at === "right" ? R - tw - 4 : L + 6;
          return (
            <g key={i} data-testid="chart-ref-label" opacity={at(ms, { at: 1200, dur: 500 })}>
              <rect x={lx} y={yy - 24} width={tw} height={20} rx={10} fill="var(--hav-card)" stroke={GRID_BASE} strokeWidth={1.2} />
              <text x={lx + 8} y={yy - 10} fontSize={12} fontWeight={700} fill={rf.tone === "navy" ? "var(--hav-pin-ink)" : "var(--hav-pin-line)"} className="font-sans">
                {txt}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

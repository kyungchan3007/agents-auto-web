"use client";

// 1년 흐름 — SVG 선 하나 · 최저 · 최고 · 오늘 점 (3D 리본은 나중) · 그래프 밑에 같은 숫자를 글자로 (색 · 그림만으로 전하지 않음)
//   최고 · 최저 글자는 SVG 밖 HTML 로 얹음 — SVG 안 글자는 그래프와 같이 줄어 휴대폰에서 6px 쯤으로 작아졌음 (작업 0109)
//   위아래 py-6 = 글자 자리 · 없으면 "최고" 글자가 위 기간 단추에 붙었음 (작업 0108)
import { numberText } from "@hav/shared/format";
import { useRef } from "react";
import { useElementWidth } from "../../hooks/use-element-width";
import { chartOf } from "../../lib/chart";
import { type Placed, placeExtremeLabels } from "../../lib/extreme-labels";

const W = 600;
const H_FULL = 160;
const H_COMPACT = 90;
const PAD_Y = 22; // 위아래 글자 자리 (py-6 = 24px 안)

const TONE_FILL = { cheap: "var(--hav-cheap)", normal: "var(--hav-normal)", expensive: "var(--hav-expensive-shape)" } as const;

/** average: 기준 점선(평균) 위치 · lastTone: 오늘(마지막) 점을 판정 색으로 (작업 0170 · 둘 다 없으면 예전 모양) */
/** compact: 시안 모양 — 낮은 그래프(높이 90) · 가로 기준선 3개 · 울트라마린 선 (작업 0170) */
/** extremeText: 최고 · 최저 점 옆 금액 글 (작업 0175 · 글은 통화 화면이 만듦 — 카드와 같은 값) · 없으면 compact 는 라벨 없음 · 아니면 "최고 n" 기본 글 */
export function YearChart({ rates, unitText, title = "1년 흐름", average, lastTone, compact = false, extremeText }: { rates: { date: string; baseRate: number }[]; unitText: string; title?: string; average?: number; lastTone?: "cheap" | "normal" | "expensive" | null; compact?: boolean; extremeText?: { max: string; min: string } }) {
  const H = compact ? H_COMPACT : H_FULL;
  const box = useRef<HTMLDivElement>(null);
  const pw = useElementWidth(box, W);
  const c = chartOf(rates, W, H, 10);
  if (!c) return <p className="border-t-2 border-line py-6 text-sm text-fg-2">{title}을 그릴 기록이 모자랍니다</p>;
  // 평균 점선 위치 — chartOf 와 같은 눈금(최저 ~ 최고)으로
  const lo = c.min.value;
  const hi = c.max.value;
  const avgY = average === undefined || !Number.isFinite(average) ? null : hi === lo ? H / 2 : 10 + (1 - (average - lo) / (hi - lo)) * (H - 20);
  const label = `${title} — 최저 ${c.min.date} ${fmt(c.min.value)} · 최고 ${c.max.date} ${fmt(c.max.value)} · 마지막 ${c.last.date} ${fmt(c.last.value)} ${unitText}`;
  const texts = extremeText ?? (compact ? null : { max: `최고 ${fmt(c.max.value)}`, min: `최저 ${fmt(c.min.value)}` });
  // 라벨은 화면 픽셀 기준으로 놓음 — 그래프(SVG)는 폭에 맞춰 같은 비율로 줄어듦
  const s = pw / W;
  const px = (d: { x: number; y: number }) => ({ x: d.x * s, y: d.y * s });
  const placed = texts
    ? placeExtremeLabels({ max: { ...px(c.max), text: texts.max }, min: { ...px(c.min), text: texts.min }, today: px(c.last), bounds: { left: 0, top: -PAD_Y, right: pw, bottom: H * s + PAD_Y } })
    : null;
  return (
    <div className="py-6">
      <div ref={box} className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full overflow-visible">
          {compact && [0.1, 0.5, 0.9].map((r) => <line key={r} x1={0} x2={W} y1={H * r} y2={H * r} stroke="var(--hav-line)" strokeWidth={1} vectorEffect="non-scaling-stroke" />)}
          {avgY !== null && <line x1={0} x2={W} y1={avgY} y2={avgY} stroke="var(--hav-fg-2)" strokeWidth={1.5} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />}
          <path d={c.path} fill="none" stroke={compact ? "var(--hav-cheap)" : "var(--hav-accent)"} strokeWidth={compact ? 2.5 : 2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          {texts && <circle cx={c.max.x} cy={c.max.y} r={4} fill="var(--hav-expensive-shape)" />}
          {texts && <circle cx={c.min.x} cy={c.min.y} r={4} fill="var(--hav-cheap)" />}
          <circle cx={c.last.x} cy={c.last.y} r={6} fill={lastTone ? TONE_FILL[lastTone] : "var(--hav-accent)"} stroke="var(--hav-surface)" strokeWidth={2} />
        </svg>
        {texts && placed && <Label placed={placed.max} data-testid="extreme-max" className="text-expensive" text={texts.max} />}
        {texts && placed && <Label placed={placed.min} data-testid="extreme-min" className="text-cheap" text={texts.min} />}
      </div>
    </div>
  );
}

/** 라벨 — 화면 픽셀 위치(placed)에 얹음 · 양 끝은 anchor 로 한쪽에 붙어 칸 밖으로 안 나감 */
function Label({ placed, className, text, ...rest }: { placed: Placed; className: string; text: string; "data-testid": string }) {
  const shiftX = placed.anchor === "start" ? "0%" : placed.anchor === "end" ? "-100%" : "-50%";
  return (
    <span {...rest} className={`pointer-events-none absolute text-[13px] leading-[13px] font-semibold whitespace-nowrap ${className}`} style={{ left: placed.x, top: placed.y, transform: `translateX(${shiftX})` }}>
      {text}
    </span>
  );
}

const fmt = (n: number) => numberText(n, { maximumFractionDigits: 2 });

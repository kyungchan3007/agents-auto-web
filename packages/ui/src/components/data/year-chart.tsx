// 1년 흐름 — SVG 선 하나 · 최저 · 최고 · 오늘 점 (3D 리본은 나중) · 그래프 밑에 같은 숫자를 글자로 (색 · 그림만으로 전하지 않음)
//   최고 · 최저 글자는 SVG 밖 HTML 로 얹음 — SVG 안 글자는 그래프와 같이 줄어 휴대폰에서 6px 쯤으로 작아졌음 (작업 0109)
//   위아래 py-6 = 글자 자리 · 없으면 "최고" 글자가 위 기간 단추에 붙었음 (작업 0108)
import { numberText } from "@hav/shared/format";
import { chartOf } from "../../lib/chart";

const W = 600;
const H = 160;

const TONE_FILL = { cheap: "var(--hav-cheap)", normal: "var(--hav-normal)", expensive: "var(--hav-expensive-shape)" } as const;

/** average: 기준 점선(평균) 위치 · lastTone: 오늘(마지막) 점을 판정 색으로 (작업 0170 · 둘 다 없으면 예전 모양) */
export function YearChart({ rates, unitText, title = "1년 흐름", average, lastTone }: { rates: { date: string; baseRate: number }[]; unitText: string; title?: string; average?: number; lastTone?: "cheap" | "normal" | "expensive" | null }) {
  const c = chartOf(rates, W, H, 10);
  if (!c) return <p className="border-t-2 border-line py-6 text-sm text-fg-2">{title}을 그릴 기록이 모자랍니다</p>;
  // 평균 점선 위치 — chartOf 와 같은 눈금(최저 ~ 최고)으로
  const lo = c.min.value;
  const hi = c.max.value;
  const avgY = average === undefined || !Number.isFinite(average) ? null : hi === lo ? H / 2 : 10 + (1 - (average - lo) / (hi - lo)) * (H - 20);
  const label = `${title} — 최저 ${c.min.date} ${fmt(c.min.value)} · 최고 ${c.max.date} ${fmt(c.max.value)} · 마지막 ${c.last.date} ${fmt(c.last.value)} ${unitText}`;
  return (
    <div className="py-6">
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full overflow-visible">
          {avgY !== null && <line x1={0} x2={W} y1={avgY} y2={avgY} stroke="var(--hav-fg-2)" strokeWidth={1.5} strokeDasharray="6 5" vectorEffect="non-scaling-stroke" />}
          <path d={c.path} fill="none" stroke="var(--hav-accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <circle cx={c.max.x} cy={c.max.y} r={4} fill="var(--hav-expensive)" />
          <circle cx={c.min.x} cy={c.min.y} r={4} fill="var(--hav-cheap)" />
          <circle cx={c.last.x} cy={c.last.y} r={6} fill={lastTone ? TONE_FILL[lastTone] : "var(--hav-accent)"} stroke="var(--hav-surface)" strokeWidth={2} />
        </svg>
        <Label dot={c.max} className="text-expensive" text={`최고 ${fmt(c.max.value)}`} above />
        <Label dot={c.min} className="text-cheap" text={`최저 ${fmt(c.min.value)}`} />
      </div>
    </div>
  );
}

/** 점 위치(SVG 좌표)를 % 로 바꿔 글자를 얹음 · 양 끝 점은 글자가 칸 밖으로 안 나가게 한쪽으로 붙임 */
function Label({ dot, className, text, above = false }: { dot: { x: number; y: number }; className: string; text: string; above?: boolean }) {
  const shiftX = dot.x < 80 ? "0%" : dot.x > W - 80 ? "-100%" : "-50%";
  const shiftY = above ? "calc(-100% - 8px)" : "8px";
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute text-xs font-semibold whitespace-nowrap sm:text-[13px] ${className}`}
      style={{ left: `${(dot.x / W) * 100}%`, top: `${(dot.y / H) * 100}%`, transform: `translate(${shiftX}, ${shiftY})` }}
    >
      {text}
    </span>
  );
}

const fmt = (n: number) => numberText(n, { maximumFractionDigits: 2 });

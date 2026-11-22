// 날짜별 작은 막대 — 기준일 위치에 세로 점선 · 같은 숫자를 aria-label 글로 (작업 0205 → 0303 어드민) · 좌표는 day-bars-view.ts
import type { DayHits } from "./rename-model";
import { dayBarsView } from "./day-bars-view";
import { NONE } from "./rename-text";

export function DayBars({ name, daily, dayMark }: { name: string; daily: DayHits[]; dayMark: string }) {
  const v = dayBarsView(name, daily, dayMark);
  if (!v) return <span className="m">{NONE}</span>;
  return (
    <svg role="img" aria-label={v.label} data-testid="rename-bars" viewBox="0 0 100 30" preserveAspectRatio="none" style={{ display: "block", height: 24, width: 140 }}>
      <line x1="0" x2="100" y1="29.5" y2="29.5" stroke="var(--a-line2)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
      {v.bars.map((b) => (
        <rect key={b.key} x={b.x} width={b.width} y={b.y} height={b.height} fill={b.after ? "var(--a-blue)" : "var(--a-bar2)"} />
      ))}
      {v.markX !== null && <line x1={v.markX} x2={v.markX} y1="0" y2="30" stroke="var(--a-mute)" strokeWidth={1} strokeDasharray="3 2" vectorEffect="non-scaling-stroke" />}
    </svg>
  );
}

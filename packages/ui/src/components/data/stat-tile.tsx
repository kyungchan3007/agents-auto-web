// 숫자 칸 — 이름 · 값 · 보충 (dl 안에 씀)
import type { ReactNode } from "react";

export function StatTile({ label, value, sub, className = "bg-surface-2 p-5", valueClassName = "text-lg" }: { label: ReactNode; value: ReactNode; sub?: ReactNode; className?: string; valueClassName?: string }) {
  return (
    <div className={`rounded-card ${className}`}>
      <dt className="text-xs text-fg-2">{label}</dt>
      <dd className={`mt-1 font-semibold text-fg ${valueClassName}`}>{value}</dd>
      {sub && <dd className="mt-0.5 text-xs text-fg-2">{sub}</dd>}
    </div>
  );
}

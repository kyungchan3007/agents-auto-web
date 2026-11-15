// 숫자 칸 — 이름 · 값 · 보충 (dl 안에 씀) · 작업 0168: 상자를 걷고 위 선 하나 + 큰 값 (className 으로 덮어쓰는 쪽은 그대로 됨)
import type { ReactNode } from "react";

export function StatTile({ label, value, sub, className = "border-t-2 border-line pt-3", valueClassName = "text-number" }: { label: ReactNode; value: ReactNode; sub?: ReactNode; className?: string; valueClassName?: string }) {
  return (
    <div className={className}>
      <dt className="text-small text-fg-2">{label}</dt>
      <dd className={`mt-1 font-semibold text-fg tabular-nums ${valueClassName}`}>{value}</dd>
      {sub && <dd className="mt-0.5 text-small text-fg-2">{sub}</dd>}
    </div>
  );
}

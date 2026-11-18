// /geo 막대 부품 (작업 0214 · 시안 B) — 새 의존성 없이 HTML 막대 · 막대마다 같은 숫자를 글로 함께 둠(보이는 숫자 · aria-label · 숨은 글)
import type { BarRow, DayColumn } from "../lib/geo-bars";

/** 가로 막대 줄 — 이름(7.5rem) → 막대 → 숫자 */
export function BarList({ rows, tone = "cheap" }: { rows: BarRow[]; tone?: "cheap" | "accent" }) {
  return (
    <ul className="mt-2 space-y-2">
      {rows.map((r) => (
        <li key={r.label} data-testid="bar-row" data-value={r.value} className="grid grid-cols-[7.5rem_minmax(0,1fr)_2.75rem] items-center gap-2.5 text-small">
          <span className="truncate" title={r.label}>
            {r.label}
          </span>
          <span aria-hidden className="h-3.5 overflow-hidden rounded-pill bg-surface-2">
            <i className={`block h-full rounded-pill ${tone === "accent" ? "bg-accent" : "bg-cheap"}`} style={{ width: `${r.pct}%` }} />
          </span>
          <b className="text-right font-semibold tabular-nums">{r.text}</b>
        </li>
      ))}
    </ul>
  );
}

/** 날마다 막대 — 막대 = 그날 응답 받은 질문 수 · 노란 점 = 인용 · 점선 = 측정 실패 */
export function DayBars({ columns }: { columns: DayColumn[] }) {
  return (
    <div className="mt-3">
      <ol data-testid="day-bars" className="flex h-[120px] items-end gap-1.5 border-b-2 border-line">
        {columns.map((c) => (
          <li key={c.day} data-testid="day-bar" aria-label={c.text} title={c.text} className="relative flex h-full min-w-0 flex-1 flex-col justify-end">
            {c.cited > 0 && <b aria-hidden className="mb-1 size-2.5 self-center rounded-pill bg-sun" />}
            <i aria-hidden className={`block rounded-t-[3px] ${c.failed ? "border-2 border-b-0 border-dashed border-line" : "bg-cheap"}`} style={{ height: `${c.heightPct}%` }} />
            <span className="sr-only">{c.text}</span>
          </li>
        ))}
      </ol>
      <ol aria-hidden className="mt-1 flex gap-1.5 text-[11px] text-fg-2">
        {columns.map((c) => (
          <li key={c.day} className="min-w-0 flex-1 text-center tabular-nums">
            {c.day.slice(8)}
          </li>
        ))}
      </ol>
    </div>
  );
}

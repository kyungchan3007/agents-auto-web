// 고르기 단추 — 지역 · 정렬처럼 하나를 고르는 짧은 단추 (aria-pressed)
import type { ReactNode } from "react";

const STYLE = {
  solid: { base: "font-semibold", on: "bg-accent text-on-accent", off: "text-fg-2 hover:text-fg" },
  outline: { base: "border", on: "border-fg text-fg", off: "border-line text-fg-2 hover:text-fg" },
} as const;

export function FilterChip({ active, onClick, variant = "solid", children }: { active: boolean; onClick: () => void; variant?: keyof typeof STYLE; children: ReactNode }) {
  const s = STYLE[variant];
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={`shrink-0 rounded-pill px-3 py-1 transition-colors ${s.base} ${active ? s.on : s.off}`}>
      {children}
    </button>
  );
}

// 자료 없음 칸 — 숫자를 만들지 않고 이유를 보여 줌 (FX-02)
import type { ReactNode } from "react";

export function EmptyState({ children, title = "자료 없음" }: { children: ReactNode; title?: string }) {
  return (
    <div className="rounded-card border border-line p-8">
      <p className="text-lg font-semibold text-fg">{title}</p>
      <p className="mt-2 text-sm text-fg-2">{children}</p>
    </div>
  );
}

// 이름표 달린 안내 칸 (작업 0136)
import type { ReactNode } from "react";

export function Panel({ id, label, children }: { id?: string; label: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl rounded-card bg-surface-2 p-5 ring-1 ring-line sm:p-6">
      <p id={id} className="text-xs font-semibold text-fg-2">
        {label}
      </p>
      {children}
    </div>
  );
}

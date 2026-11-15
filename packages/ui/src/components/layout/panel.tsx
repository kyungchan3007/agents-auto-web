// 이름표 달린 안내 칸 (작업 0136 · 0168: 테두리 상자를 걷고 위 선 + 이름표)
import type { ReactNode } from "react";

export function Panel({ id, label, children }: { id?: string; label: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl border-t-2 border-line pt-5">
      <p id={id} className="text-small font-semibold text-accent">
        {label}
      </p>
      {children}
    </div>
  );
}

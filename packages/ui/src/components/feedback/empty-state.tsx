// 자료 없음 칸 — 숫자를 만들지 않고 이유를 보여 줌 (FX-02) · 작업 0168: 테두리 상자 대신 위 선 + 글
import type { ReactNode } from "react";

export function EmptyState({ children, title = "자료 없음" }: { children: ReactNode; title?: string }) {
  return (
    <div className="border-t-2 border-line py-6">
      <p className="text-lg font-semibold text-fg">{title}</p>
      <p className="mt-2 text-small text-fg-2">{children}</p>
    </div>
  );
}

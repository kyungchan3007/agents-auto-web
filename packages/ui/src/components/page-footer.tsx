// 페이지 꼬리말 — 작은 안내 글
import type { ReactNode } from "react";

export function PageFooter({ width = "max-w-5xl", className = "", children }: { width?: "max-w-5xl" | "max-w-6xl"; className?: string; children: ReactNode }) {
  return (
    <footer data-surface="dark" className="border-t border-line bg-surface px-4 py-10 text-xs text-fg-2 sm:px-8">
      <div className={`mx-auto ${width} ${className}`}>{children}</div>
    </footer>
  );
}

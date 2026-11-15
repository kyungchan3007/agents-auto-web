// 바닥 띠 — 출처 한 줄 띠 (바다 청록 바탕 · 흰 글) · 작업 0168: 예전 페이지 꼬리말을 대신 (이름 · props 는 그대로)
import type { ReactNode } from "react";

export function PageFooter({ width = "max-w-5xl", className = "", children }: { width?: "max-w-5xl" | "max-w-6xl"; className?: string; children: ReactNode }) {
  return (
    <footer className="bg-accent px-4 py-6 text-small text-on-accent sm:px-8 [&_a]:text-on-accent [&_a]:underline [&_a]:underline-offset-2">
      <div className={`mx-auto ${width} ${className}`}>{children}</div>
    </footer>
  );
}

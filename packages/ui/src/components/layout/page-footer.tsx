// 바닥 띠 — 출처 한 줄 띠 (밝은 바다 청록(--hav-band) 바탕 · 짙은 남색 글) · 작업 0168: 예전 페이지 꼬리말을 대신 (이름 · props 는 그대로)
import type { ReactNode } from "react";

export function PageFooter({ width = "max-w-page", className = "", children }: { width?: "max-w-page" | "max-w-5xl" | "max-w-6xl"; className?: string; children: ReactNode }) {
  return (
    <footer className="bg-band px-4 py-6 text-small text-on-band sm:px-8 [&_a]:text-on-band [&_a]:underline [&_a]:underline-offset-2">
      <div className={`mx-auto ${width} ${className}`}>{children}</div>
    </footer>
  );
}

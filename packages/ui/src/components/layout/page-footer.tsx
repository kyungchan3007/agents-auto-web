// 바닥 띠 — 출처 한 줄 (작업 0216 · 시안 A · B: 흰 바탕 위 가는 선 아래 작은 보조 글자 · 예전 청록 띠는 없앰) · 작업 0168: 예전 페이지 꼬리말을 대신 (이름 · props 는 그대로)
import type { ReactNode } from "react";

export function PageFooter({ width = "max-w-page", className = "", children }: { width?: "max-w-page" | "max-w-5xl" | "max-w-6xl"; className?: string; children: ReactNode }) {
  return (
    <footer className="border-t border-line bg-surface px-4 py-8 text-small text-fg-2 sm:px-8 [&_a]:text-fg-2 [&_a]:underline [&_a]:underline-offset-2 [&_a]:hover:text-fg">
      <div className={`mx-auto ${width} ${className}`}>{children}</div>
    </footer>
  );
}

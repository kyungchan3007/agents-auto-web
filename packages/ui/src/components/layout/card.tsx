import type { ReactNode } from "react";

/** 요약 칸 — 상자 · 그림자 없이 위 선 하나 + 짧은 문장 (작업 0168 · 똑같은 둥근 카드 반복을 걷어 냄 · props 는 그대로) */
export function Card({ icon, title, children }: { icon?: ReactNode; title?: ReactNode; children?: ReactNode }) {
  return (
    <div className="border-t-2 border-line pt-6">
      {icon && <div className="mb-4 text-3xl text-accent">{icon}</div>}
      {title && <p className="text-lg font-semibold text-fg">{title}</p>}
      {children && <div className="mt-2 text-fg-2">{children}</div>}
    </div>
  );
}

// 작은 제목 · 큰 제목 — 페이지 머리에 반복되는 글자 모양
import type { HTMLAttributes, ReactNode } from "react";

export function Eyebrow({ className = "", children }: { className?: string; children: ReactNode }) {
  return <p className={`text-eyebrow font-semibold text-fg-2 ${className}`}>{children}</p>;
}

type TitleProps = HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "h3" | "p" };

export function Title({ as: Tag = "h2", className = "", ...rest }: TitleProps) {
  return <Tag className={`text-title font-semibold tracking-tight ${className}`} {...rest} />;
}

/** 페이지 안 작은 구역 제목 */
export function SubTitle({ className = "", ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-lg font-semibold tracking-tight ${className}`} {...rest} />;
}

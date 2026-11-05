// 글 속 링크 — 밑줄 있는 강조색
import type { AnchorHTMLAttributes } from "react";

export function TextLink({ className = "", ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a className={`text-accent underline underline-offset-2 hover:decoration-2 ${className}`} {...rest} />;
}

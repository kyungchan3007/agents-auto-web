// "다음에 볼 곳" 링크 줄 (작업 0136)
import type { ReactNode } from "react";

export function LinkRow({ children }: { children: ReactNode }) {
  return <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-accent">{children}</div>;
}

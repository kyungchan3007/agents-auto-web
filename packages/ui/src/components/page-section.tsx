// 페이지 첫 칸 — 메뉴 아래 여백 · 가운데 폭 · 작은 제목 · 큰 제목(h1) (작업 0136)
import type { ReactNode } from "react";
import { Eyebrow, Title } from "./heading";
import type { Surface } from "./section";

export function PageSection({ as: Tag = "section", surface = "dark", width, eyebrow, title, children }: { as?: "main" | "section"; surface?: Surface; width: string; eyebrow: ReactNode; title: ReactNode; children?: ReactNode }) {
  return (
    <Tag data-surface={surface} className="bg-surface px-4 pt-14 pb-24 text-fg sm:px-8 sm:pt-20">
      <div className={`mx-auto ${width}`}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <Title as="h1" className="mt-3">
          {title}
        </Title>
        {children}
      </div>
    </Tag>
  );
}

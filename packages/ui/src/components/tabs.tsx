"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";

export type TabItem = { value: string; label: string; content: ReactNode };

/** 탭 — 참고 페이지 "사진 편집 · 코딩 …" 탭 · 활성 탭 아래 밑줄 */
export function Tabs({ items, defaultValue }: { items: TabItem[]; defaultValue?: string }) {
  return (
    <BaseTabs.Root defaultValue={defaultValue ?? items[0]?.value}>
      {/* 좁은 화면은 간격을 줄이고 · 360px 아래는 끝을 흐려 옆으로 넘길 수 있다고 알림 (작업 0111) */}
      <BaseTabs.List className="relative flex gap-4 overflow-x-auto border-b border-line [scrollbar-width:none] max-[359px]:[mask-image:linear-gradient(to_right,black_85%,transparent)] sm:gap-6">
        {items.map((t) => (
          <BaseTabs.Tab
            key={t.value}
            value={t.value}
            className="shrink-0 py-3 text-sm font-semibold text-fg-2 transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-accent data-active:text-fg"
          >
            {t.label}
          </BaseTabs.Tab>
        ))}
        <BaseTabs.Indicator className="absolute bottom-0 left-(--active-tab-left) h-0.5 w-(--active-tab-width) bg-fg transition-all duration-300 ease-out-soft" />
      </BaseTabs.List>
      {items.map((t) => (
        <BaseTabs.Panel key={t.value} value={t.value} className="pt-8 text-fg-2">
          {t.content}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}

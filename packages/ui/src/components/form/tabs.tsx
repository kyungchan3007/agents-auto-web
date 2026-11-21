"use client";

import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import type { ReactNode } from "react";

export type TabItem = { value: string; label: string; content: ReactNode };

/** 탭 — 참고 페이지 "사진 편집 · 코딩 …" 탭 · 활성 탭 아래 밑줄 · 밑줄은 transform 으로 움직임(left · width 를 바꾸지 않음 · 작업 0213) */
export function Tabs({ items, defaultValue }: { items: TabItem[]; defaultValue?: string }) {
  return (
    <BaseTabs.Root defaultValue={defaultValue ?? items[0]?.value}>
      {/* 좁은 화면은 간격을 줄이고 옆으로 넘김 (끝을 흐리는 그라데이션은 새 테마에서 걷어 냄 · 작업 0168) */}
      <BaseTabs.List className="relative flex gap-4 overflow-x-auto border-b border-line [scrollbar-width:none] sm:gap-6">
        {items.map((t) => (
          <BaseTabs.Tab
            key={t.value}
            value={t.value}
            className="shrink-0 py-3 text-sm font-semibold text-fg-2 transition-colors hover:text-fg data-active:text-fg"
          >
            {t.label}
          </BaseTabs.Tab>
        ))}
        <BaseTabs.Indicator className="absolute bottom-0 left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) bg-fg transition-transform duration-300 ease-out-soft motion-reduce:transition-none" />
      </BaseTabs.List>
      {items.map((t) => (
        <BaseTabs.Panel key={t.value} value={t.value} className="pt-8 text-fg-2">
          {t.content}
        </BaseTabs.Panel>
      ))}
    </BaseTabs.Root>
  );
}

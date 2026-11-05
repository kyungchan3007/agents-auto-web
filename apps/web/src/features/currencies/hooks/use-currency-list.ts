"use client";

// 통화 목록 상태 — 찾기 · 지역 · 정렬 · 즐겨찾기 · 지금 통화 (계산은 list.ts)
import { usePathname } from "next/navigation";
import { useState } from "react";
import { type ListItem, type RegionFilter, pickedRegion, regionChips, visibleItems } from "../lib/list";
import { codeFromPath } from "../lib/route";
import type { SortId } from "../lib/sort";
import { useFavorites } from "./use-favorites";

export function useCurrentCode(): string {
  return codeFromPath(usePathname());
}

export function useCurrencyList(items: ListItem[]) {
  const current = useCurrentCode();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState<RegionFilter>("all");
  const [favs, toggleFav] = useFavorites();
  const [sort, setSort] = useState<SortId>("region");
  const picked = pickedRegion(region, favs.length);
  return {
    current,
    query,
    setQuery,
    picked,
    setRegion,
    favs,
    toggleFav,
    sort,
    setSort,
    hasChange: items.some((i) => i.change != null),
    chips: regionChips(items, favs.length),
    shown: visibleItems(items, { sort, favs, region: picked, query }),
  };
}

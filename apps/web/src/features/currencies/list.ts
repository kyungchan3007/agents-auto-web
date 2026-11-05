// 통화 목록 계산 — 지역 단추 · 보여 줄 통화 (순수 함수)
import { REGIONS, type Region, currencyRegion, groupByRegion, matchCurrency } from "@hav/shared/currency";
import type { Signal } from "@hav/shared/signal";
import { favoritesFirst } from "./favorites";
import { type SortId, sortByChange } from "./sort";

export type ListItem = { currency: string; signal: Signal | null; change: number | null };
export type RegionFilter = Region | "all" | "fav";

export function regionChips(items: ListItem[], favCount: number): { id: RegionFilter; label: string }[] {
  const regions = REGIONS.filter((r) => items.some((i) => currencyRegion(i.currency) === r.id));
  return [{ id: "all", label: "전체" }, ...(favCount > 0 ? [{ id: "fav" as const, label: `★ 즐겨찾기 ${favCount}` }] : []), ...regions];
}

/** 즐겨찾기를 다 빼서 그 묶음이 사라지면 전체로 */
export const pickedRegion = (region: RegionFilter, favCount: number): RegionFilter => (region === "fav" && favCount === 0 ? "all" : region);

/** 정렬을 고르면 그 순서 그대로 (즐겨찾기 맨 위는 기본 정렬일 때만) */
export function visibleItems(items: ListItem[], o: { sort: SortId; favs: string[]; region: RegionFilter; query: string }): ListItem[] {
  const base = groupByRegion(items).flatMap((g) => g.items);
  const ordered = o.sort === "region" ? favoritesFirst(base, o.favs) : sortByChange(base, o.sort);
  return ordered.filter((i) => (o.region === "all" || (o.region === "fav" ? o.favs.includes(i.currency) : currencyRegion(i.currency) === o.region)) && matchCurrency(i.currency, o.query));
}

// 통화 목록 계산 — 지역 단추 · 보여 줄 통화 (순수 함수)
import { REGIONS, type Region, currencyRegion, groupByRegion, matchCurrency } from "@hav/shared/currency";
import type { Signal } from "@hav/shared/signal";
import { favoritesFirst } from "./favorites";
import { type SortId, sortByChange } from "./sort";
import type { Fetched } from "@hav/shared/api";
import type { FxChanges, FxLatest } from "@hav/shared/fx";
import { rateText } from "@hav/shared/currency";

export type ListItem = { currency: string; signal: Signal | null; change: number | null; /** 90일 백분위(0~1) — 목록 핀의 근거 숫자 (없으면 판정 글자만) */ percentile?: number | null; /** 고시 단위 (엔 100 · 목록 이름 옆) — 환율을 못 받았으면 없음 */ unit?: number; /** 오늘 환율 글 "1,324.3원" (표 · 고시 단위 그대로) — 환율을 못 받았으면 없음 */ rate?: string; /** 오늘 값 · 90일 최고(1 외화당 원 · /signal) — 표의 "90일 최고보다" 계산용 · 없으면 "—" */ latest?: number | null; max?: number | null };
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

/** 통화 목록 줄 — 오늘 환율 · 신호 · 1개월 변화 · 90일 최고 (작업 0312 에 browse-layout.tsx 에서 옮김) · 못 받은 값은 null */
export function browseItems(
  latest: Fetched<FxLatest>,
  maps: { signalOf: Record<string, Signal | null>; percentileOf: Record<string, number | null>; valueOf: Record<string, { latest: number | null; max: number | null }> },
  changes: Fetched<FxChanges>,
) {
  const pct = Object.fromEntries((changes.ok ? changes.data.changes : []).map((c) => [c.currency, c.pct]));
  return (latest.ok ? latest.data.rates : []).map((r) => ({
    currency: r.currency,
    signal: maps.signalOf[r.currency] ?? null,
    change: pct[r.currency] ?? null,
    percentile: maps.percentileOf[r.currency] ?? null,
    unit: r.unit,
    rate: `${rateText(r).value}원`,
    latest: maps.valueOf[r.currency]?.latest ?? null,
    max: maps.valueOf[r.currency]?.max ?? null,
  }));
}

// 통화 상세 "다른 나라 통화 보기" 버튼 · 사이드바의 글 · 국기 · 줄 계산 (작업 0356 · 시안 10-C) — 순수 함수 · tsx 는 그리기만
// 값은 둘러보기 표와 같은 자료(ListItem)로만 — 받지 못한 값은 "—" 그대로 (지어내지 않음)
import { searchCurrencies } from "@hav/shared/currency-search";
import { currencyListLabel, currencyListName } from "../detail/detail-view";
import { type RateRow, rateRows } from "../browse/rate-table";
import type { ListItem } from "../browse/list";

export const MORE_TITLE = "다른 나라 통화 보기";
export const SIDE_TITLE = "다른 나라 통화";
export const SIDE_HINT = "90일 최고보다 많이 내린 순서 · 누르면 그 통화로 바뀝니다";
export const moreSubText = (count: number): string => `${count}개 통화 오늘 환율을 한눈에`;
export const pickedSubText = (p: { name: string; unit: number; rate: string }): string => `고른 통화 · ${p.name} ${p.unit} ${p.rate}`;

/** 버튼에 겹쳐 보이는 기본 국기 수 */
export const DEFAULT_FLAGS = 4;

/** 버튼 국기 — 고른 통화가 목록에 있으면 그 하나 · 아니면 목록 앞 네 개(적으면 있는 만큼) */
export function buttonFlags(codes: string[], picked: string | null): string[] {
  return picked !== null && codes.includes(picked) ? [picked] : codes.slice(0, DEFAULT_FLAGS);
}

export type SideRow = RateRow & { name: string; rate: string; unit: number };

/** 사이드바 줄 — 둘러보기 표와 같은 순서 · 같은 글(통화 이름 · 고시 단위 · 오늘 환율 · 90일 최고보다) */
export function sideRows(items: ListItem[]): SideRow[] {
  const byCode = new Map(items.map((i) => [i.currency, i]));
  return rateRows(items.map((i) => ({ currency: i.currency, latest: i.latest, max: i.max, signal: i.signal }))).flatMap((r) => {
    const i = byCode.get(r.currency);
    return i ? [{ ...r, name: currencyListLabel(r.currency, i.unit ?? 1), rate: i.rate ?? "—", unit: i.unit ?? 1 }] : [];
  });
}

/** 검색 — 지금 통화 검색과 같은 규칙(코드 · 이름 · 나라 · 도시) · 순서는 표 순서 그대로 · 빈 말이면 전부 */
export function filterSideRows(rows: SideRow[], query: string): SideRow[] {
  if (query.trim() === "") return rows;
  const hit = new Set(searchCurrencies(query, rows.map((r) => r.currency), rows.length).map((h) => h.code));
  return rows.filter((r) => hit.has(r.currency));
}

/** 고른 통화 줄의 "고른 통화 · 일본 엔 100 846.76원" 글 재료 */
export function pickedSub(items: ListItem[], picked: string | null): string | null {
  const i = picked ? items.find((x) => x.currency === picked) : undefined;
  return i ? pickedSubText({ name: currencyListName(i.currency), unit: i.unit ?? 1, rate: i.rate ?? "—" }) : null;
}

/** 기준 날짜 — 받은 환율 중 가장 최근 날 (없으면 null) */
export const ratesDate = (rates: { date: string }[]): string | null => rates.reduce<string | null>((m, r) => (m === null || r.date > m ? r.date : m), null);

/** 목록을 미리 내려 둘 위치 — 지금 통화 줄이 목록 한가운데 근처에 오게 (위로는 0 까지) */
export const preScrollTop = (rowTop: number, listHeight: number): number => Math.max(0, rowTop - listHeight / 3);

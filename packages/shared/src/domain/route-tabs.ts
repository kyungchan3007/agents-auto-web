// 여행 물가 "나라별 물가 노선" 탭 (작업 0360) — 탭별 노선 · 내 여행지 끼워 넣기 · 자 눈금 범위 · 고른 탭 기억 · 순수 함수
//   탭: 물가 차이 큰 곳(기본 · 지금 정책 그대로: 싼 · 비슷 · 비싼 구간마다 물가 낮은 두 나라 + 한국) · 많이 가는 곳 · 동남아 · 유럽 · 한국은 늘 기준역
//   많이 가는 곳은 공식 출국 통계 순위(docs/domain/travel-price.md 한국관광공사 데이터랩 2025년 1~12월 · 확인한 날 2026-11-25) 순서대로 물가 자료가 있는 나라만 앞 6곳 · 순위를 확인하지 못하면 이 탭을 뺌
//   물가 자료가 없는 나라는 정거장으로 만들지 않음(지어내지 않음)
import { BAND_EDGE } from "./travel";

export type RouteTabId = "spread" | "popular" | "sea" | "eu";

export const DEFAULT_TAB: RouteTabId = "spread";
export const ROUTE_TAB_KEY = "flapfx:route-tab";
/** 탭마다 나라 수(물가 차이 큰 곳은 구간 × 2) */
export const ROUTE_SIZE = 6;
export const SEA_COUNTRIES: readonly string[] = ["VNM", "THA", "MYS", "PHL", "IDN", "SGP"];
export const EU_COUNTRIES: readonly string[] = ["ESP", "ITA", "FRA", "DEU", "GBR", "CHE"];
/** 공식 순위 순서 (docs/domain/travel-price.md 순위표 1~6위 + 그다음 줄) */
export const POPULAR_RANKING: readonly string[] = ["JPN", "VNM", "USA", "THA", "PHL", "TWN", "HKG", "SGP", "MAC", "IDN"];

export type RouteTab = { id: RouteTabId; label: string; note: string };

const TABS: Record<RouteTabId, RouteTab> = {
  spread: { id: "spread", label: "물가 차이 큰 곳", note: "지금 정책 그대로: 싼 곳 · 비슷한 곳 · 비싼 곳 구간마다 물가 낮은 순으로 맨 위 두 나라 + 한국" },
  popular: { id: "popular", label: "많이 가는 곳", note: "한국인이 많이 가는 나라 · 한국관광공사 2025년 입국 통계 순위 앞 여섯 곳 + 한국" },
  sea: { id: "sea", label: "동남아", note: "동남아 여섯 나라 · 나라별 물가 + 한국" },
  eu: { id: "eu", label: "유럽", note: "유럽 여섯 나라 · 유럽 평균 대신 나라별 물가 + 한국" },
};

/** 탭 목록 — 순서 spread · popular · sea · eu · 순위가 비면(출처를 확인하지 못함) popular 탭 없음 */
export function routeTabs(ranking: readonly string[] = POPULAR_RANKING): RouteTab[] {
  return [TABS.spread, ...(ranking.length > 0 ? [TABS.popular] : []), TABS.sea, TABS.eu];
}

export type RouteRow = { country: string; name: string; relative: number };
export type RouteStop = { country: string; name: string; value: number; mine: boolean };

const KR: RouteStop = { country: "KR", name: "한국", value: 100, mine: false };
const valueOf = (r: RouteRow) => Math.round(r.relative * 100);

/** 구간(싼 · 비슷 · 비싼)마다 물가 낮은 두 나라 */
function spreadRows(rows: RouteRow[]): RouteRow[] {
  const sorted = [...rows].sort((a, b) => a.relative - b.relative);
  const cheap = sorted.filter((r) => r.relative < BAND_EDGE.cheap);
  const pricey = sorted.filter((r) => r.relative > BAND_EDGE.pricey);
  const mid = sorted.filter((r) => r.relative >= BAND_EDGE.cheap && r.relative <= BAND_EDGE.pricey);
  return [...cheap.slice(0, 2), ...mid.slice(0, 2), ...pricey.slice(0, 2)];
}

/** 노선의 나라들 — 순서 규칙에 맞춰 · 물가 자료(rows)에 있는 나라만 */
function tabRows(tab: RouteTabId, rows: RouteRow[], ranking: readonly string[]): RouteRow[] {
  const has = (c: string) => rows.find((r) => r.country === c);
  const list = (codes: readonly string[]) => codes.flatMap((c) => (has(c) ? [has(c) as RouteRow] : []));
  if (tab === "sea") return list(SEA_COUNTRIES);
  if (tab === "eu") return list(EU_COUNTRIES);
  if (tab === "popular" && ranking.length > 0) return list(ranking).slice(0, ROUTE_SIZE);
  return spreadRows(rows);
}

/** 정거장 — 값 오름차순 · 같은 값이면 한국이 앞 · 한국 포함 · 나라가 하나도 없으면 [] (한국만 있는 노선을 만들지 않음) */
export function routeOf(tab: RouteTabId, rows: RouteRow[], o: { mine?: string | null; ranking?: readonly string[] } = {}): RouteStop[] {
  const picked = tabRows(tab, rows, o.ranking ?? POPULAR_RANKING);
  const extra = o.mine && o.mine !== "KR" && !picked.some((r) => r.country === o.mine) ? rows.find((r) => r.country === o.mine) : undefined;
  const stops = [...picked, ...(extra ? [extra] : [])].map((r) => ({ country: r.country, name: r.name, value: valueOf(r), mine: r.country === o.mine }));
  if (stops.length === 0) return [];
  return [...stops, KR].sort((a, b) => a.value - b.value || (a.country === "KR" ? -1 : b.country === "KR" ? 1 : 0));
}

/** 자 눈금 범위 — spread 는 지금 그대로(30 ~ 120 · 밖이면 10 단위로 넓힘) · 나머지는 노선에 맞게(양쪽 6 여유 · 10 단위) */
export function routeScale(tab: RouteTabId, values: number[]): { lo: number; hi: number } {
  if (values.length === 0) return { lo: 30, hi: 120 };
  const [min, max] = [Math.min(...values), Math.max(...values)];
  if (tab === "spread") return { lo: Math.min(30, Math.floor(min / 10) * 10), hi: Math.max(120, Math.ceil(max / 10) * 10) };
  return { lo: Math.floor((min - 6) / 10) * 10, hi: Math.ceil((max + 6) / 10) * 10 };
}

/** 탭 목록에 있는 id 만 · 아니면 기본 탭 */
export const parseTab = (raw: string | null | undefined, tabs: RouteTab[]): RouteTabId => tabs.find((t) => t.id === raw)?.id ?? DEFAULT_TAB;

/** 저장된 탭 — 저장소가 없거나 던지면 기본 탭 */
export function readTab(storage: Pick<Storage, "getItem"> | null | undefined, tabs: RouteTab[]): RouteTabId {
  try {
    return parseTab(storage?.getItem(ROUTE_TAB_KEY), tabs);
  } catch {
    return DEFAULT_TAB;
  }
}

/** 탭 저장 — 저장소가 없거나 던지면 false */
export function writeTab(storage: Pick<Storage, "setItem"> | null | undefined, id: RouteTabId): boolean {
  if (!storage) return false;
  try {
    storage.setItem(ROUTE_TAB_KEY, id);
    return true;
  } catch {
    return false;
  }
}

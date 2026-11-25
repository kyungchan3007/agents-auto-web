// 여행 물가 노선 탭 화면 계산 (작업 0360) — 탭 · ✕ · 새로 고름의 상태와 정거장 모양 · 순수 함수 (훅은 부르기만 · tsx 는 그리기만)
//   정거장 모양은 지금 노선(price-route-view 의 RouteStop)과 같은 틀 + mine(내 여행지) · 물가 차이 큰 곳(기본)은 내 여행지가 없을 때 기존 routeStops 와 똑같음(지금 정책 · 서버 첫 그림이 안 바뀜)
import { POPULAR_RANKING, type RouteTabId, routeOf } from "@hav/shared/route-tabs";
import { type RouteStop, bandOf } from "./price-route-view";
import { rulerMaxTier, rulerTiers, rulerX } from "./ruler";

/** removed = 내 여행지를 이 노선에서 뺐나 (✕ · 그 노선에서만) */
export type RouteUi = { tab: RouteTabId; removed: boolean };
export type UiStop = RouteStop & { mine: boolean };

/** 다른 탭이면 탭을 바꾸고 뺀 것을 되살림 · 같은 탭을 다시 누르면 그대로 */
export const onTab = (ui: RouteUi, tab: RouteTabId): RouteUi => (tab === ui.tab ? ui : { tab, removed: false });

/** ✕ — 그 노선에서만 뺌 (탭 그대로) */
export const onRemove = (ui: RouteUi): RouteUi => ({ ...ui, removed: true });

/** 여행지를 새로 고르면(예산 카드 · 홈 검색) 뺐던 것이 돌아옴 · 탭 그대로 */
export const onPick = (ui: RouteUi): RouteUi => ({ ...ui, removed: false });

/** 뺐거나 고른 게 없으면 null */
export const mineOf = (picked: string | null | undefined, ui: RouteUi): string | null => (ui.removed || !picked ? null : picked);

/** "프랑스 자세히 보기" — 끝 › 는 부품이 꾸밈으로 붙임 */
export const detailText = (name: string): string => `${name} 자세히 보기`;

/** 정거장 — 값 오름차순 · 한국 side kr · 나머지는 위 · 아래 번갈아(이름표가 겹치지 않게) · index 0 부터 */
export function uiStops(tab: RouteTabId, bands: { rows: { country: string; name: string; relative: number }[] }[], mine: string | null, ranking: readonly string[] = POPULAR_RANKING): UiStop[] {
  const stops = routeOf(tab, bands.flatMap((b) => b.rows), { mine, ranking });
  let away = 0;
  return stops.map((s, index) => {
    const kr = s.country === "KR";
    const side = kr ? "kr" : away++ % 2 === 0 ? "up" : "down";
    return { country: s.country, name: s.name, value: s.value, band: kr ? "base" : bandOf(s.value), side, index, mine: s.mine };
  });
}

/** 새 노선에서 비행기 · 카드가 갈 첫 정거장 번호 — 내 여행지가 있으면 그 나라 · 없으면 0 */
export const startOf = (stops: { mine: boolean }[]): number => Math.max(0, stops.findIndex((x) => x.mine));

/** 노선이 바뀌면 달라지는 글(탭 · 정거장 구성) — 비행기 · 핀 · 칩이 새 노선으로 다시 시작하는 기준 */
export const routeKeyOf = (tab: RouteTabId, stops: { country: string }[]): string => `${tab}:${stops.map((x) => x.country).join(",")}`;

/** 몰린 핀 이름을 한 줄 더 밀어 내는 줄 높이(rem) — 핀 하나(이름 · 값 · 국기 · 줄기)의 높이 + 여유 · price-route.tsx 의 CSS 계산과 같은 값 */
export const TIER_REM = 7;

/**
 * 가로 노선 핀 줄 — 같은 쪽(위 · 아래)에서 이름이 겹치는 핀을 한 줄(tier) 더 자에서 먼 쪽으로 (휴대폰용 rulerTiers 와 같은 규칙) · 겹침이 없으면 모두 0(기존 모습 그대로)
 *   up · down = 그쪽에 더할 줄 수(자 위 · 아래 여백을 늘림)
 */
export function pinTiers(stops: UiStop[], scale: { lo: number; hi: number }, widthPx: number): { tiers: Record<string, number>; up: number; down: number } {
  const pins = stops.filter((s) => s.side !== "kr").map((s) => ({ country: s.country, name: s.name, x: rulerX(s.value, scale), side: s.side as "up" | "down" }));
  const tiers = rulerTiers(pins, widthPx);
  const maxOf = (side: "up" | "down") => rulerMaxTier(Object.fromEntries(pins.filter((p) => p.side === side).map((p) => [p.country, tiers[p.country] ?? 0])));
  return { tiers, up: maxOf("up"), down: maxOf("down") };
}

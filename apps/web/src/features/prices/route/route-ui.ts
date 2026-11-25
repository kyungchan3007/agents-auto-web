// 여행 물가 노선 탭 화면 계산 (작업 0360) — 탭 · ✕ · 새로 고름의 상태와 정거장 모양 · 순수 함수 (훅은 부르기만 · tsx 는 그리기만)
//   정거장 모양은 지금 노선(price-route-view 의 RouteStop)과 같은 틀 + mine(내 여행지) · 물가 차이 큰 곳(기본)은 내 여행지가 없을 때 기존 routeStops 와 똑같음(지금 정책 · 서버 첫 그림이 안 바뀜)
import { POPULAR_RANKING, type RouteTabId, routeOf } from "@hav/shared/route-tabs";
import { type RouteStop, bandOf } from "./price-route-view";

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

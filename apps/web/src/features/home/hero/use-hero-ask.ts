"use client";

// hero 왼쪽 입력창 · 칩 상태 (작업 0380 · 0393) — 기존 여행지 고르기(useTripSwitcher)와 같은 상태 · 같은 저장 값
//   칩 · 제안 클릭 · Enter · 보기가 모두 pick(hit) 한 함수 — 저장하고(choose) 탑승권 묶음을 그 도시로 넘김
import type { DestinationHit } from "@hav/shared/destination-search";
import type { KeyboardEvent } from "react";
import { useTripSwitcher } from "@/shared/trip/use-trip-switcher";
import { useHeroDeckValue } from "./use-hero-deck-context";
import { heroChips } from "./hero-pass";
import { airportOf } from "./hero-pick";

export function useHeroAsk() {
  const s = useTripSwitcher();
  const deck = useHeroDeckValue();
  // React 가 붙기 전에 입력칸에 쓴 글자는 칸에 남음 — 붙을 때 칸 값이 상태와 다르면 상태로 이어받아야 제안이 뜸 (작업 0394)
  const mountInput = (el: HTMLInputElement | null) => {
    if (el && el.value !== "" && el.value !== s.query) s.adopt(el.value);
  };
  const pick = (hit: DestinationHit) => {
    s.choose(hit);
    deck.pick(hit);
  };
  /** 보기 단추 · Enter — 고른 제안(없으면 맨 위 제안)으로 */
  const submit = () => {
    const hit = s.hits[s.active] ?? s.hits[0];
    if (hit) pick(hit);
  };
  return {
    mountInput,
    chips: heroChips(),
    query: s.query,
    hits: s.hits.map((hit) => ({ hit, code: airportOf(hit.city) })),
    expanded: s.expanded,
    empty: s.empty,
    active: s.active,
    ids: s.ids,
    activeId: s.activeId,
    /** 칩이 지금 보여 주는 도시인가 */
    isPicked: (hit: DestinationHit) => deck.shown?.city === hit.city && deck.shown?.country === hit.country,
    pick,
    submit,
    setActive: s.setActive,
    onChange: s.onChange,
    onKey: (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
        return;
      }
      s.onInputKey(e);
    },
  };
}

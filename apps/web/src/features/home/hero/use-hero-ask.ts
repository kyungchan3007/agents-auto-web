"use client";

// hero 왼쪽 입력창 · 칩 상태 (작업 0380) — 기존 여행지 고르기(useTripSwitcher)와 같은 상태 · 같은 저장 값을 써서 여기서 고르면 아래 탑승권 카드도 같은 나라로 바뀜
//   고르면 탑승권 묶음도 그 도시로 넘김(칩을 누르면 6초 동안 자동 넘김 멈춤)
import type { DestinationHit } from "@hav/shared/destination-search";
import type { KeyboardEvent } from "react";
import { useTripSwitcher } from "@/shared/trip/use-trip-switcher";
import { useHeroDeckValue } from "./use-hero-deck-context";
import { heroChips } from "./hero-pass";

export function useHeroAsk() {
  const s = useTripSwitcher();
  const deck = useHeroDeckValue();
  const pick = (hit: DestinationHit) => {
    s.choose(hit);
    deck.go(hit.city);
  };
  /** 보기 단추 · Enter — 고른 제안(없으면 맨 위 제안)으로 */
  const submit = () => {
    const hit = s.hits[s.active] ?? s.hits[0];
    if (hit) pick(hit);
  };
  return {
    chips: heroChips(),
    query: s.query,
    hits: s.hits,
    expanded: s.expanded,
    empty: s.empty,
    active: s.active,
    ids: s.ids,
    activeId: s.activeId,
    isPicked: s.isPicked,
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

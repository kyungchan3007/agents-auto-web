"use client";

// 카드 안에서 바로 여행지 바꾸기 상태 — 자주 가는 곳 칩 · 검색 칸(WAI-ARIA 콤보박스) · 지금 고른 곳 (작업 0217 사용자 지적 · 시트 · 버튼 없음)
// 고르면 시트와 같은 저장 값(PickedTrip · writePicked)을 쓰고 PICK_EVENT 를 보내 홈 안내판 · 숫자가 바로 바뀜 (새로고침해도 유지 · 예산은 인트로에서 고른 값을 이어 씀)
import { type DestinationHit, POPULAR_DESTINATIONS, searchDestinations } from "@hav/shared/destination-search";
import { PICK_EVENT, type PickedTrip, readPicked, writePicked } from "@hav/shared/travel";
import { type ChangeEvent, type KeyboardEvent, useId, useState } from "react";
import { usePickedTrip } from "./use-picked-trip";

export function useTripSwitcher() {
  const picked = usePickedTrip();
  const uid = useId();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const hits: DestinationHit[] = searchDestinations(query);
  const expanded = hits.length > 0;
  const empty = query.trim() !== "" && hits.length === 0;
  const ids = { list: `${uid}-list`, option: (i: number) => `${uid}-opt-${i}` };

  const choose = (hit: DestinationHit) => {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    const trip: PickedTrip = { v: 1, country: hit.country, city: hit.city, budget: readPicked(storage)?.budget ?? 0 };
    writePicked(storage, trip);
    window.dispatchEvent(new CustomEvent<PickedTrip>(PICK_EVENT, { detail: trip }));
    setQuery("");
    setActive(-1);
  };
  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!expanded) return;
      e.preventDefault();
      const n = hits.length;
      setActive(e.key === "ArrowDown" ? (active + 1) % n : (active - 1 + n) % n);
    } else if (e.key === "Enter") {
      const hit = hits[active] ?? hits[0];
      if (!hit) return;
      e.preventDefault();
      choose(hit);
    } else if (e.key === "Escape" && query !== "") {
      e.preventDefault();
      setQuery("");
      setActive(-1);
    }
  };
  return {
    picked,
    popular: POPULAR_DESTINATIONS,
    isPicked: (hit: DestinationHit) => !!picked && picked.country === hit.country && picked.city === hit.city,
    query,
    hits,
    expanded,
    empty,
    active,
    ids,
    activeId: expanded && active >= 0 ? ids.option(active) : undefined,
    choose,
    setActive,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      setActive(-1);
    },
    onInputKey,
  };
}

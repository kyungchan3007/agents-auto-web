"use client";

// 여행지 고르기 시트 상태 — 열림 · 검색 · 활성 줄 · 키보드(WAI-ARIA 콤보박스) · 초점 가둠 · 닫으면 버튼으로 초점 (작업 0201)
// 고르면 인트로와 같은 저장 값(PickedTrip · writePicked)을 쓰고 PICK_EVENT 를 보내 홈 · 여행 물가가 바로 바뀜
import { PICK_EVENT, type PickedTrip, readPicked, writePicked } from "@hav/shared/travel";
import { type ChangeEvent, type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { type DestinationHit, POPULAR_DESTINATIONS, searchDestinations } from "@hav/shared/destination-search";
import { usePickedTrip } from "./use-picked-trip";

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function usePickTrip() {
  const picked = usePickedTrip();
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const opener = useRef<HTMLElement | null>(null);
  const hits: DestinationHit[] = searchDestinations(query);
  const expanded = hits.length > 0;
  const empty = query.trim() !== "" && hits.length === 0;
  const ids = { title: `${uid}-title`, input: `${uid}-input`, list: `${uid}-list`, option: (i: number) => `${uid}-opt-${i}` };

  const show = () => {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery("");
    setActive(-1);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    // 닫으면 연 버튼으로 초점 (시트가 사라진 뒤)
    const back = opener.current;
    window.setTimeout(() => back?.focus(), 0);
  };
  const choose = (hit: DestinationHit) => {
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
    } catch {
      storage = null;
    }
    // 예산은 인트로에서 고른 값을 이어 씀 (시트에는 예산 입력이 없음 · 처음이면 0 = 탑승권에 예산 줄을 보이지 않음)
    const trip: PickedTrip = { v: 1, country: hit.country, city: hit.city, budget: readPicked(storage)?.budget ?? 0 };
    writePicked(storage, trip);
    window.dispatchEvent(new CustomEvent<PickedTrip>(PICK_EVENT, { detail: trip }));
    close();
  };

  // 열리면 검색 칸에 초점
  useEffect(() => {
    if (open) document.getElementById(ids.input)?.focus();
  }, [open, ids.input]);

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
    }
  };
  // 시트 전체 키 — Esc 로 닫기 · Tab 은 시트 안에서만 돌게
  const onDialogKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      const items = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const cur = document.activeElement;
      if (e.shiftKey && (cur === first || !e.currentTarget.contains(cur))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (cur === last || !e.currentTarget.contains(cur))) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return {
    picked,
    open,
    query,
    hits,
    expanded,
    empty,
    active,
    ids,
    popular: POPULAR_DESTINATIONS,
    activeId: expanded && active >= 0 ? ids.option(active) : undefined,
    show,
    close,
    choose,
    setActive,
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      setQuery(e.target.value);
      setActive(-1);
    },
    onInputKey,
    onDialogKey,
  };
}

/** 닫는 움직임 동안 시트를 남겨 둠 (작업 0252 · 0312 에 pick-trip.tsx 에서 옮김) — 닫혀도 closeMs 동안 남겼다가 지움 · 움직임 줄이기는 바로 지움 */
export function useSheetMounted(open: boolean, closeMs: number): boolean {
  const [mounted, setMounted] = useState(false);
  // 열리면 바로 남김(그리는 중 맞춤 — 효과 안에서 바로 바꾸지 않음) · 닫히면 움직임 시간 뒤 지움
  if (open && !mounted) setMounted(true);
  useEffect(() => {
    if (open) return;
    const ms = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : closeMs;
    const t = window.setTimeout(() => setMounted(false), ms);
    return () => window.clearTimeout(t);
  }, [open, closeMs]);
  return open || mounted;
}

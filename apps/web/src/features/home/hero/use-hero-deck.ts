"use client";

// 탑승권 넘김 · 고른 곳 상태 (작업 0393) — 칩 · 제안 · Enter · 보기가 모두 pick(hit) 한 곳으로 들어옴
//   넘김 한 번에 맨 앞 장만 out(0.65초) · 넘기는 중에 또 고르면 마지막 것만 한 칸 대기 · 이미 맨 앞인 곳을 고르면 움직임 없음 · 고르면 자동 넘김은 다시 켜지 않음 · 움직임 줄이기면 자동 넘김 없음
//   (예전: 칩이 맨 앞 도시여도 한 바퀴를 돌려 두 번 겹쳐 움직였고, 6초 뒤 자동 넘김이 다시 켜져 반복됐음)
import type { DestinationHit } from "@hav/shared/destination-search";
import type { PriceLevels } from "@hav/shared/prices";
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePickedTrip } from "@/shared/trip/use-picked-trip";
import type { RateRow, SignalRow } from "../common/destinations";
import { PASS_CITIES, type PassCard } from "./hero-pass";
import { type PickFacts, cardIdOf, countryLink, frontWith, hitOfCard, passFor, pickCardId, pickFacts } from "./hero-pick";
import { TRAVEL_COUNTRIES } from "@hav/shared/travel";

const EVERY_MS = 3600;
const OUT_MS = 650;

/** 서버(홈)에서 받아 hero 에 넘기는 값 */
export type HeroData = { rates: RateRow[]; signals: SignalRow[]; levels: PriceLevels | null; windowDays: number; month: string; pageCodes: readonly string[] };

type Snap = { order: string[]; leaving: boolean; extras: DestinationHit[]; picked: DestinationHit | null };

export type HeroDeck = {
  order: string[];
  leaving: boolean;
  /** 탑승권 — 네 도시 + 고른 덱 밖 장 · 그리는 순서는 늘 같고 자리는 order 가 정함 */
  cards: PassCard[];
  /** 사용자가 고른 장의 번호(안 골랐으면 null) */
  pickedId: string | null;
  /** 지금 보여 주는 도시 — 고른 곳 · 안 골랐으면 맨 앞 탑승권 */
  shown: DestinationHit | null;
  facts: PickFacts | null;
  /** 나라 물가 페이지 링크 — 그 나라 페이지가 없으면 null */
  link: { href: string; name: string } | null;
  /** 사용자가 골랐는가(숫자 칸의 "고른 곳" 태그) */
  mine: boolean;
  pick: (hit: DestinationHit) => void;
};

export const EMPTY_DECK: HeroDeck = { order: [], leaving: false, cards: [], pickedId: null, shown: null, facts: null, link: null, mine: false, pick: () => undefined };

export function useHeroDeck(data: HeroData): HeroDeck {
  const reduce = useReducedMotion();
  const [snap, setSnap] = useState<Snap>(() => ({ order: PASS_CITIES.map((c) => c.id), leaving: false, extras: [], picked: null }));
  const ref = useRef(snap);
  const pinned = useRef(false);
  const queued = useRef<DestinationHit | null>(null);
  const again = useRef<(hit: DestinationHit | null) => void>(() => undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const set = useCallback((next: Snap) => {
    ref.current = next;
    setSnap(next);
  }, []);

  /** 맨 앞 장만 넘기고 id 장을 앞에 — hit 가 있으면 사용자가 고른 것 */
  const run = useCallback(
    (hit: DestinationHit | null) => {
      const cur = ref.current;
      if (cur.leaving) {
        if (hit) queued.current = hit; // 마지막 것만
        return;
      }
      const id = hit ? cardIdOf(hit) : cur.order[1];
      if (!id) return;
      if (hit) pinned.current = true;
      if (cur.order[0] === id) {
        if (hit) set({ ...cur, picked: hit });
        return;
      }
      const fresh = hit && !cur.order.includes(id);
      const extras = fresh ? [...cur.extras, hit] : cur.extras;
      // 맨 앞이 사라지는 동안 고른 장이 이미 1번 자리에 있어야 엉뚱한 도시가 드러나지 않음 — [맨 앞, 고른 장, …나머지]
      const front = cur.order[0] ?? id;
      const order = hit ? [front, id, ...cur.order.filter((x) => x !== front && x !== id)] : cur.order;
      set({ order, leaving: true, extras, picked: hit ?? cur.picked });
      timer.current = setTimeout(
        () => {
          const now = ref.current;
          const order = frontWith(now.order, id);
          set({ order, leaving: false, extras: now.extras.filter((h) => order.includes(pickCardId(h))), picked: now.picked });
          const q = queued.current;
          queued.current = null;
          if (q) again.current(q);
        },
        reduce ? 0 : OUT_MS,
      );
    },
    [reduce, set],
  );

  useEffect(() => {
    again.current = run;
  }, [run]);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      if (!pinned.current) run(null);
    }, EVERY_MS);
    return () => {
      clearInterval(id);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [reduce, run]);

  // 새로고침 뒤에도 고른 곳 유지 — 저장된 값을 처음 한 번만 움직임 없이 앞에 세움
  const saved = usePickedTrip();
  const restored = useRef(false);
  useEffect(() => {
    if (!saved || restored.current) return;
    restored.current = true;
    if (pinned.current) return;
    const hit: DestinationHit = { country: saved.country, city: saved.city, label: saved.city };
    const id = cardIdOf(hit);
    const cur = ref.current;
    const fresh = !cur.order.includes(id);
    pinned.current = true;
    set({ order: frontWith(fresh ? [...cur.order, id] : cur.order, id), leaving: false, extras: fresh ? [...cur.extras, hit] : cur.extras, picked: hit });
  }, [saved, set]);

  const front = hitOfCard(snap.order[0] ?? "", snap.extras);
  const shown = snap.picked ?? front;
  const cards = [...PASS_CITIES.map((c) => hitOfCard(c.id, [])), ...snap.extras].flatMap((h) => (h ? [passFor(h, data.rates, data.signals, data.windowDays, data.month)] : []));
  const href = shown ? countryLink(shown, data.pageCodes) : null;
  return {
    order: snap.order,
    leaving: snap.leaving,
    cards,
    pickedId: snap.picked ? cardIdOf(snap.picked) : null,
    shown,
    facts: shown ? pickFacts(shown, data.rates, data.signals, data.levels, data.windowDays) : null,
    link: href ? { href, name: TRAVEL_COUNTRIES[shown?.country ?? ""]?.name ?? "" } : null,
    mine: snap.picked !== null,
    pick: (hit) => run(hit),
  };
}

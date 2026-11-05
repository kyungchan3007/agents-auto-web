"use client";

// 실시간 기록 받기 — 같은 주소의 BFF(/bff/activity)를 몇 초마다 · 새 것만(after) · 탭이 숨으면 쉼
import { ActivityList, type ActivityEvent } from "@hav/shared/activity";
import { useVisibleInterval } from "@hav/ui/hooks/use-visible-interval";
import { useCallback, useRef, useState } from "react";
import { LIVE, getJson } from "../../shared/api";
import { mergeEvents } from "./status";

export const POLL_MS = 5_000;

export type Activity = { events: ActivityEvent[]; loaded: boolean; error: string | null; now: number };

export function useActivity(): Activity {
  const [state, setState] = useState<Activity>({ events: [], loaded: false, error: null, now: 0 });
  const lastId = useRef(0);
  const tick = useCallback(async (alive: () => boolean) => {
    const r = await getJson(`/activity?limit=50${lastId.current ? `&after=${lastId.current}` : ""}`, ActivityList, LIVE);
    if (!alive()) return;
    setState((s) => {
      if (!r.ok) return { ...s, loaded: true, error: r.reason, now: Date.now() };
      const events = mergeEvents(s.events, r.data.events);
      lastId.current = events[0]?.id ?? lastId.current;
      return { events, loaded: true, error: null, now: Date.now() };
    });
  }, []);
  useVisibleInterval(tick, POLL_MS);
  return state;
}

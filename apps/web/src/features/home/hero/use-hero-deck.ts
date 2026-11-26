"use client";

// 탑승권 넘김 상태 (작업 0380) — 3.6초마다 맨 앞 장이 왼쪽 아래로 넘어가고 다음 도시가 앞으로 · 칩을 누르면 그 도시로 넘기고 6초 동안 자동 넘김 멈춤 · 움직임 줄이기면 넘김 없음(첫 장 그대로)
import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PASS_CITIES, passIdOf, rotateDeck } from "./hero-pass";

const EVERY_MS = 3600;
const HOLD_MS = 6000;
const OUT_MS = 650;

export type HeroDeck = { order: string[]; leaving: boolean; go: (city: string) => void };

export function useHeroDeck(): HeroDeck {
  const reduce = useReducedMotion();
  const [order, setOrder] = useState(() => PASS_CITIES.map((c) => c.id));
  const [leaving, setLeaving] = useState(false);
  const busy = useRef(false);
  const holdUntil = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = useCallback(
    (toId?: string) => {
      if (busy.current) return;
      busy.current = true;
      setLeaving(true);
      timer.current = setTimeout(
        () => {
          setOrder((o) => rotateDeck(o, toId));
          setLeaving(false);
          busy.current = false;
        },
        reduce ? 0 : OUT_MS,
      );
    },
    [reduce],
  );

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      if (Date.now() >= holdUntil.current) advance();
    }, EVERY_MS);
    return () => {
      clearInterval(id);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [reduce, advance]);

  const go = useCallback(
    (city: string) => {
      const id = passIdOf(city);
      if (!id) return;
      holdUntil.current = Date.now() + HOLD_MS;
      advance(id);
    },
    [advance],
  );

  return { order, leaving, go };
}

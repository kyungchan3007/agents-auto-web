"use client";

// 다시 받기 (작업 0303) — 빌드 때 값을 먼저 · period 초마다(탭이 보일 때만 셈) 또는 누르면 바로 다시 받음 · 남은 초를 함께 돌려줌
//   실패하면 앞의 값을 그대로 (pickLive) · 받는 동안 busy
import { type Fetched, pickLive } from "@hav/shared/fetched";
import { useCallback, useEffect, useRef, useState } from "react";

export function useRefresh<T>(build: Fetched<T>, load: () => Promise<Fetched<T>>, period: number) {
  const [live, setLive] = useState<Fetched<T> | null>(null);
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(period);
  const [round, setRound] = useState(0);
  const busyRef = useRef(false);
  const refresh = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const started = Date.now();
    const r = await load();
    // 너무 빨리 끝나도 받는 모습이 잠깐 보이게 (0.6초)
    await new Promise((ok) => setTimeout(ok, Math.max(0, 600 - (Date.now() - started))));
    if (r.ok) setLive(r);
    busyRef.current = false;
    setBusy(false);
    setLeft(period);
    setRound((n) => n + 1);
  }, [load, period]);
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.hidden || busyRef.current) return;
      setLeft((s) => {
        if (s <= 1) {
          void refresh();
          return period;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [refresh, period]);
  return { data: pickLive(build, live), busy, left, round, refresh };
}

export const clockText = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

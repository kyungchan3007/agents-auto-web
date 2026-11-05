"use client";

// 빌드 때 받은 값을 먼저 보여 주고 브라우저에서 새로 받기 — 실패하면 빌드 때 값을 그대로 (작업 0136)
//   load 는 바뀌지 않는 함수로 넘김 (모듈 함수)
import { type Fetched, pickLive } from "@hav/shared/fetched";
import { useCallback, useEffect, useState } from "react";
import { useVisibleInterval } from "./use-visible-interval";

/** 페이지를 열 때 한 번 */
export function useLive<T>(build: Fetched<T>, load: () => Promise<Fetched<T>>): Fetched<T> {
  const [live, setLive] = useState<Fetched<T> | null>(null);
  useEffect(() => {
    let stopped = false;
    void load().then((r) => {
      if (!stopped) setLive(r);
    });
    return () => {
      stopped = true;
    };
  }, [load]);
  return pickLive(build, live);
}

/** 탭이 보이는 동안 ms 마다 */
export function useLivePolling<T>(build: Fetched<T>, load: () => Promise<Fetched<T>>, ms: number): Fetched<T> {
  const [live, setLive] = useState<Fetched<T> | null>(null);
  const tick = useCallback(
    async (alive: () => boolean) => {
      const r = await load();
      if (alive() && r.ok) setLive(r);
    },
    [load],
  );
  useVisibleInterval(tick, ms);
  return pickLive(build, live);
}

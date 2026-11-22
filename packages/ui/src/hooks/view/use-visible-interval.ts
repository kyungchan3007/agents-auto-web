"use client";

// 탭이 보일 때만 되풀이 — 처음 한 번 · ms 마다 · 탭이 다시 보일 때 · 숨은 동안은 쉼 (작업 0136)
//   tick 은 바뀌지 않는 함수로 넘김 (useCallback · 모듈 함수) · 바뀌면 처음부터 다시 시작
import { useEffect } from "react";

export type Tick = (alive: () => boolean) => void | Promise<void>;

export function useVisibleInterval(tick: Tick, ms: number): void {
  useEffect(() => {
    let stopped = false;
    const run = () => {
      if (!document.hidden) void tick(() => !stopped);
    };
    run();
    const id = setInterval(run, ms);
    document.addEventListener("visibilitychange", run);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", run);
    };
  }, [tick, ms]);
}

// 공항 시험 장면을 붙일 자리 — three.js 는 이 훅이 실행될 때만 불러옴 (작업 0184)
import { type RefObject, useEffect, useRef } from "react";

export function useAirportScene(progress: RefObject<number>) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let stop: (() => void) | null = null;
    let gone = false;
    import("../lib/airport-model").then(({ mountAirport }) => {
      if (gone || !host.current) return;
      stop = mountAirport(host.current, progress as { current: number });
    });
    return () => {
      gone = true;
      stop?.();
    };
  }, [progress]);
  return host;
}

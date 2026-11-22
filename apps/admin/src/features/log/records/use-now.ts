"use client";

// 지금 시각 (작업 0303) — 처음 그릴 때는 null(서버 HTML 과 같게) · 브라우저에서 ms 마다 다시
import { useEffect, useState } from "react";

export function useNow(ms: number): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0); // 하이드레이션 뒤 첫 값
    const id = window.setInterval(tick, ms);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [ms]);
  return now;
}

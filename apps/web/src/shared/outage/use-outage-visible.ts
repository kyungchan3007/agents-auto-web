"use client";

// 장애 안내 표시 여부 — 페이지를 연 채로 끝 시각이 지나면 숨김
import { useEffect, useState } from "react";
import { OUTAGE } from "./outage";

export function useOutageVisible(show: boolean): boolean {
  const [on, setOn] = useState(show);
  useEffect(() => {
    if (!on || !OUTAGE) return;
    const left = Math.max(0, Date.parse(OUTAGE.until) - Date.now());
    const t = setTimeout(() => setOn(false), Math.min(left, 2 ** 31 - 1));
    return () => clearTimeout(t);
  }, [on]);
  return on;
}

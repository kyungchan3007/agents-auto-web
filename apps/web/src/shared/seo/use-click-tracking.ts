"use client";

// 문서 전체 클릭을 한 곳에서 듣기 (작업 0359) — 운영 주소에서만 · 화면 부품은 data-track 표시만 달면 됨 · 캡처 단계라 링크로 떠나기 전에 보냄
import { useEffect } from "react";
import { trackFromClick } from "./track-click";
import { useAnalyticsEnabled } from "./use-analytics-enabled";

export function useClickTracking(): void {
  const on = useAnalyticsEnabled();
  useEffect(() => {
    if (!on) return;
    document.addEventListener("click", trackFromClick, true);
    return () => document.removeEventListener("click", trackFromClick, true);
  }, [on]);
}

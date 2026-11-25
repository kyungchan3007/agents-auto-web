"use client";

// 지금 화면이 사이드바(1024px 이상)인지 시트인지 (작업 0361 2단계) — 서버 · 하이드레이션 첫 그림은 시트(미리 열려 있지 않아 보이는 것이 없음) · 폭이 바뀌면 따라감
import { useSyncExternalStore } from "react";
import { SIDE_BREAKPOINT, panelModeOf } from "./side-view";

const QUERY = `(min-width: ${SIDE_BREAKPOINT}px)`;
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

export function useSideMode() {
  const wide = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  return panelModeOf(wide ? SIDE_BREAKPOINT : SIDE_BREAKPOINT - 1);
}

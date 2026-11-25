"use client";

// 여행 물가 노선 탭 상태 (작업 0360) — 고른 탭(브라우저에만 기억) · 내 여행지(usePickedTrip) · ✕ 로 뺀 것
//   서버 첫 그림 · 하이드레이션 첫 그림 = 기본 탭 · 저장된 탭은 하이드레이션 뒤에 읽음 · 저장소가 막혀도(예외) 탭은 바뀜(이번 화면 안에서만)
//   내 여행지 = 예산 카드 · 홈 검색 칸 · 인트로에서 고른 나라 · 새로 고르면(PICK_EVENT) 뺐던 것이 돌아옴
import { type RouteTabId, readTab, routeTabs, writeTab } from "@hav/shared/route-tabs";
import { PICK_EVENT } from "@hav/shared/travel";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePickedTrip } from "@/shared/trip/use-picked-trip";
import { type RouteUi, mineOf, onPick, onRemove, onTab } from "./route-ui";

const TABS = routeTabs();
const storage = (): Storage | null => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};
const subscribe = () => () => undefined;
const stored = () => readTab(storage(), TABS);

export function useRouteTabs() {
  const saved = useSyncExternalStore(subscribe, stored, () => TABS[0].id);
  const [chosen, setChosen] = useState<RouteTabId | null>(null); // 이번 화면에서 누른 탭 (저장이 막혀도 바뀌도록)
  const [removed, setRemoved] = useState(false);
  const picked = usePickedTrip();
  const ui: RouteUi = { tab: chosen ?? saved, removed };

  // 여행지를 새로 고르면 뺐던 것이 돌아옴
  useEffect(() => {
    const on = () => setRemoved(onPick(ui).removed);
    window.addEventListener(PICK_EVENT, on);
    return () => window.removeEventListener(PICK_EVENT, on);
  });

  return {
    tabs: TABS,
    tab: ui.tab,
    note: TABS.find((t) => t.id === ui.tab)?.note ?? "",
    mine: mineOf(picked?.country, ui),
    choose: (id: RouteTabId) => {
      const next = onTab(ui, id);
      writeTab(storage(), next.tab);
      setChosen(next.tab);
      setRemoved(next.removed);
    },
    remove: () => setRemoved(onRemove(ui).removed),
  };
}

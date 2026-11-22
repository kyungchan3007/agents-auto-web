"use client";

// 즐겨찾기 브라우저 저장소 (같은 탭 · 다른 탭 모두 바로 반영 · 작업 0089) — 계산은 favorites.ts
import { useSyncExternalStore } from "react";
import { FAVORITES_KEY, parseFavorites, toggleFavorite } from "./favorites";

const listeners = new Set<() => void>();
let cache: { raw: string | null; list: string[] } = { raw: null, list: [] };

function read(): string[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(FAVORITES_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cache.raw) cache = { raw, list: parseFavorites(raw) };
  return cache.list;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => e.key === FAVORITES_KEY && fn();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

const EMPTY: string[] = [];

/** [즐겨찾기 목록, 켜고 끄기] — 서버 그림(빌드)에서는 빈 목록 */
export function useFavorites(): [string[], (code: string) => void] {
  const list = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = (code: string) => {
    const next = toggleFavorite(read(), code);
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
    } catch {
      return; // 저장 못 하면 바꾸지 않음
    }
    for (const fn of listeners) fn();
  };
  return [list, toggle];
}

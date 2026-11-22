"use client";

// 고른 통화 칩의 브라우저 저장소 (같은 탭 · 다른 탭 모두 바로 반영 · 작업 0231) — 즐겨찾기(use-favorites)와 같은 useSyncExternalStore + localStorage 패턴 · 새 키 · 계산은 recent-chips.ts
//   보기만 해서는 저장하지 않음 — 고를 때만 저장(push) · 다른 탭에서 바뀐 것은 remote(밀림 움직임 없이 바로 반영)
import { useSyncExternalStore } from "react";
import { RECENT_KEY, chipRow, parseRecent, pushRecent } from "./recent-chips";

export type RecentState = { list: string[]; /** 이 탭에서 고른 결과인지(밀림 움직임을 보임) · 다른 탭이 바꾼 것이면 false */ local: boolean };

const listeners = new Set<() => void>();
const EMPTY: RecentState = { list: [], local: false };
let cache: { raw: string | null; state: RecentState } = { raw: null, state: EMPTY };
let localMark = false; // 방금 이 탭이 저장했음

function read(): RecentState {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(RECENT_KEY);
  } catch {
    raw = null;
  }
  if (raw !== cache.raw) {
    cache = { raw, state: { list: parseRecent(raw), local: localMark } };
    localMark = false;
  }
  return cache.state;
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => e.key === RECENT_KEY && fn();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}

/** 지금 저장된 목록 (서버 그림 · 저장이 없으면 빈 목록) */
export function useRecentCurrencies(): RecentState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** 새 목록을 저장하고 같은 탭 구독자에게 알림 — 저장 못 하면 바꾸지 않음 */
export function saveRecent(next: string[]): void {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    return;
  }
  localMark = true;
  for (const fn of listeners) fn();
}

/** 지금 저장된 목록을 바로 읽음(이벤트 안에서) */
export const readRecent = (): string[] => read().list;

/** 고른 통화를 칩 줄 맨 앞에 붙여 저장 — 저장이 없으면 지금 운영 줄을 바탕으로 (목록 · 상자에서 골라도 같음 · 작업 0312 에 currency-chips.tsx 에서 옮김) */
export function commitPick(codes: string[], current: string, code: string): void {
  const stored = readRecent();
  saveRecent(pushRecent(stored.length > 0 ? stored : chipRow([], current, codes), code));
}

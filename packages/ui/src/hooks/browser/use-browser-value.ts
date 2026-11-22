"use client";

// 브라우저에서만 아는 값 — 서버 그림은 serverValue (값이 바뀌어도 알림을 받지 않음 · 작업 0136)
import { useSyncExternalStore } from "react";

const noop = () => () => {};

export function useBrowserValue<T>(read: () => T, serverValue: () => T): T {
  return useSyncExternalStore(noop, read, serverValue);
}

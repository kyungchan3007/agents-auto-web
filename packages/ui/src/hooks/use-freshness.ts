"use client";

// 기준일 신선도 — 시각은 브라우저에서만 앎 · 서버 그림은 "오늘" 로 (아무것도 안 그림)
import { useSyncExternalStore } from "react";
import { type Freshness, freshness } from "@hav/shared/freshness";

const noop = () => () => {};

export function useFreshness(date: string): { kind: Freshness["kind"]; text: string | null } {
  const kind = useSyncExternalStore(noop, () => freshness(date).kind, () => "today" as const);
  if (kind === "today") return { kind, text: null };
  const f = freshness(date);
  return { kind, text: "text" in f ? f.text : null };
}

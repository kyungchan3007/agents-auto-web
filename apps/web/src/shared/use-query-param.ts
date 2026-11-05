"use client";

// 주소의 ?이름=값 (대문자로) — 정적 페이지라 브라우저에서 읽음 · 서버 그림은 빈 글자
import { useSyncExternalStore } from "react";

const noop = () => () => {};

export function useQueryParam(name: string): string {
  return useSyncExternalStore(noop, () => new URLSearchParams(window.location.search).get(name)?.toUpperCase() ?? "", () => "");
}

"use client";

// 여행 물가 주소의 ?currency= 값 — 정적 사이트라 페이지(클라이언트)에서 읽음 (작업 0193 · useSearchParams 는 Suspense 경계 안에서만)
import { useSearchParams } from "next/navigation";

export function useCurrencyParam(): string | null {
  return useSearchParams().get("currency");
}

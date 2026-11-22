"use client";

// 소재 그림이 안 열리면 되돌림 주소(저장소 raw)로 · 그것도 없으면 "이미지 없음" 칸으로 (작업 0310 · 0312 에 marketing-page.tsx 에서 옮김)
//   상태 없이 DOM 만 바꿈 — 서버 HTML 의 그림이 손잡이보다 먼저 실패해도 ref 에서 다시 봄
import { useCallback } from "react";
import { type Draft, nextImage } from "./drafts";

function swapImage(el: HTMLImageElement, d: Pick<Draft, "imageFallback">) {
  const next = nextImage(el.getAttribute("src"), d);
  if (next) {
    el.src = next;
    return;
  }
  el.style.display = "none";
  const none = el.nextElementSibling;
  if (none instanceof HTMLElement) none.style.display = "";
}

export function useImageFallback(d: Pick<Draft, "imageFallback">) {
  const check = useCallback(
    (el: HTMLImageElement | null) => {
      if (el && el.complete && el.naturalWidth === 0) swapImage(el, d);
    },
    [d],
  );
  const onError = useCallback((e: { currentTarget: HTMLImageElement }) => swapImage(e.currentTarget, d), [d]);
  return { check, onError };
}

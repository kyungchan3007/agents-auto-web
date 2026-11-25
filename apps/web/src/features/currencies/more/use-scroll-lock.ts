"use client";

// 열린 동안 뒤 화면 잠금 (작업 0356 · 스크롤 1) — 페이지의 overflow 를 바꾸지 않고(바꾸면 scrollY 가 0 으로 튀고 스크롤바 자리로 화면이 밀림) 굴림 · 터치 이동을 막음
//   목록([data-scroll-ok]) 안은 그대로 스크롤 · 목록 끝에서 더 굴리면 페이지로 넘어가지 않게 막음 · 목록 밖(막 · 머리 · 뒤 화면)은 모두 막음 · 닫으면 풀림(원래 위치 그대로)
import { useEffect } from "react";

const listOf = (t: EventTarget | null): HTMLElement | null => (t instanceof Element ? t.closest<HTMLElement>("[data-scroll-ok]") : null);

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const onWheel = (e: WheelEvent) => {
      const list = listOf(e.target);
      if (!list) return e.preventDefault();
      const atEdge = e.deltaY < 0 ? list.scrollTop <= 0 : list.scrollTop + list.clientHeight >= list.scrollHeight - 1;
      if (atEdge) e.preventDefault();
    };
    const onTouch = (e: TouchEvent) => {
      if (!listOf(e.target)) e.preventDefault();
    };
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("touchmove", onTouch, { passive: false });
    return () => {
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("touchmove", onTouch);
    };
  }, [locked]);
}

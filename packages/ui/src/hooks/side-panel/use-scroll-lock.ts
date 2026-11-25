"use client";

// 열린 동안 뒤 화면 잠금 (작업 0356 · 스크롤 1 · 0361 에서 사이드바 공통으로 꺼냄) — 페이지의 overflow 를 바꾸지 않고(바꾸면 scrollY 가 0 으로 튀고 스크롤바 자리로 화면이 밀림) 굴림 · 터치 이동 · 키보드 스크롤 키를 막음
//   목록([data-scroll-ok]) 안은 그대로 스크롤 · 목록 끝에서 더 굴리면 페이지로 넘어가지 않게 막음 · 목록 밖(막 · 머리 · 뒤 화면)은 모두 막음 · 닫으면 풀림(원래 위치 그대로)
import { useEffect } from "react";

const SCROLL_KEYS = new Set(["PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown", " ", "Spacebar"]);

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
    // 키보드로 페이지가 움직이는 길도 막음 — 포커스가 사이드바 안(머리의 닫기 단추 · 링크)에 있어도 PageDown · 화살표 · 스페이스는 스크롤할 칸이 없으면 페이지로 넘어가므로
    //   목록 안(목록이 스스로 스크롤) · 글 입력 칸 · 단추 · 링크의 스페이스(누름)는 그대로 둠
    const onKey = (e: KeyboardEvent) => {
      if (!SCROLL_KEYS.has(e.key) || listOf(e.target)) return;
      const t = e.target instanceof Element ? e.target : null;
      if (t?.closest("input,textarea,select")) return;
      if (e.key === " " && t?.closest("button,a")) return;
      e.preventDefault();
    };
    document.addEventListener("wheel", onWheel, { passive: false });
    document.addEventListener("touchmove", onTouch, { passive: false });
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("wheel", onWheel);
      document.removeEventListener("touchmove", onTouch);
      document.removeEventListener("keydown", onKey);
    };
  }, [locked]);
}

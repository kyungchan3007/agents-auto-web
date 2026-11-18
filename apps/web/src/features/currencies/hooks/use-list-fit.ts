"use client";

// 넓은 화면(lg) 통화 목록의 높이를 줄 높이의 배수로 — 맨 아래 줄이 중간에서 잘려 보이지 않게 (작업 0212)
// 휴대폰(옆으로 넘기는 줄)에서는 건드리지 않음 · 처음(서버)에는 CSS 의 최대 높이 그대로, 붙은 뒤 줄에 맞춤
import { useEffect, useRef } from "react";
import { fitRows } from "../lib/list-fit";

const LG = 1024;
const RESERVED_REM = 12; // CSS 의 max-h: calc(100svh - 12rem) 와 같은 값

export function useListFit(count: number) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const ul = ref.current;
    if (!ul) return;
    const fit = () => {
      const row = ul.querySelector("li");
      if (window.innerWidth < LG || !row) {
        ul.style.maxHeight = "";
        return;
      }
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const h = fitRows(window.innerHeight - RESERVED_REM * rem, row.getBoundingClientRect().height);
      ul.style.maxHeight = h === null ? "" : `${h}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [count]);
  return ref;
}

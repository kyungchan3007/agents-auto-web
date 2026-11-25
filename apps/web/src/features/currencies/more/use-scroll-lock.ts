"use client";

// 열린 동안 뒤 화면 잠금 (작업 0356 · 스크롤 1) — 페이지 스크롤을 막되 scrollY 는 그대로(position:fixed 로 고정하지 않음) · 스크롤바가 사라지며 화면이 옆으로 밀리지 않게 그 폭만큼 안쪽 여백으로 보정 · 닫으면 원래대로
import { useEffect } from "react";

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const body = document.body;
    const before = { overflow: html.style.overflow, padding: body.style.paddingRight };
    const bar = window.innerWidth - html.clientWidth; // 스크롤바 폭 (겹쳐 보이는 스크롤바면 0)
    html.style.overflow = "hidden";
    if (bar > 0) body.style.paddingRight = `${bar}px`;
    return () => {
      html.style.overflow = before.overflow;
      body.style.paddingRight = before.padding;
    };
  }, [locked]);
}

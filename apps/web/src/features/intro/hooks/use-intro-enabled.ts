"use client";

// 인트로를 열지 정함 — 처음 값은 false (서버 HTML 에는 인트로가 없음) · 마운트 뒤에 폭 700 초과이고 끄기 스위치가 꺼져 있을 때만 true (작업 0185)
// 끄기 스위치: localStorage[INTRO_OFF_KEY] = "1" (e2e · 개발용 · 화면에 노출하지 않음) · 저장소가 막혀도 죽지 않음
import { INTRO_OFF_KEY } from "@hav/shared/travel";
import { useEffect, useState } from "react";

export function useIntroEnabled(): boolean {
  const [enabled, setEnabled] = useState<boolean>(false);
  useEffect(() => {
    let off = false;
    try {
      off = window.localStorage.getItem(INTRO_OFF_KEY) === "1";
    } catch {
      off = false;
    }
    const wide = window.matchMedia("(min-width: 701px)").matches;
    // 마운트 직후에 켬 (서버 HTML 과 첫 그림은 인트로 없이 같게)
    const t = window.setTimeout(() => setEnabled(wide && !off), 0);
    return () => window.clearTimeout(t);
  }, []);
  return enabled;
}

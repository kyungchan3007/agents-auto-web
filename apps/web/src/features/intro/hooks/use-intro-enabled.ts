"use client";

// 인트로를 열지 정함 — 처음 값은 false (서버 HTML 에는 인트로가 없음) · 마운트 뒤 shouldShowIntro 가 true 일 때만 (작업 0185 · 0186)
//   사이트에 들어올 때만(주소창 · 외부 링크 · 새로고침) · #위치 링크("오늘 환율" /#today) · 사이트 안 이동 · 같은 문서의 두 번째 홈에서는 띄우지 않음
// 끄기 스위치: localStorage[INTRO_OFF_KEY] = "1" (e2e · 개발용 · 화면에 노출하지 않음) · 저장소가 막혀도 죽지 않음
import { INTRO_OFF_KEY } from "@hav/shared/travel";
import { useEffect, useState } from "react";
import { INTRO_CLOSED_EVENT, shouldShowIntro } from "../lib/entry";

/** 같은 문서(화면 안 이동)에서 인트로를 이미 띄웠는지 — 모듈 변수라 화면 안 이동으로 홈이 다시 그려져도 남음 · 새로고침하면 지워짐 */
let shownThisDocument = false;

export function useIntroEnabled(): boolean {
  const [enabled, setEnabled] = useState<boolean>(false);
  useEffect(() => {
    let off = false;
    try {
      off = window.localStorage.getItem(INTRO_OFF_KEY) === "1";
    } catch {
      off = false;
    }
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    let firstPath = window.location.pathname;
    try {
      if (nav?.name) firstPath = new URL(nav.name).pathname;
    } catch {
      /* 처음 주소를 못 읽으면 지금 주소로 */
    }
    const show = shouldShowIntro({
      wide: window.matchMedia("(min-width: 701px)").matches,
      off,
      hash: window.location.hash,
      shownBefore: shownThisDocument,
      navType: nav?.type ?? "navigate",
      referrer: document.referrer,
      origin: window.location.origin,
      firstPath,
    });
    if (show) shownThisDocument = true;
    // 마운트 직후에 켬 (서버 HTML 과 첫 그림은 인트로 없이 같게)
    const t = window.setTimeout(() => setEnabled(show), 0);
    // 인트로가 닫히면(끝 · 건너뛰기) 부품을 내림 — 페이지 잠금 · 휠 · 3D 그리기가 모두 정리됨 (작업 0186)
    const close = () => setEnabled(false);
    window.addEventListener(INTRO_CLOSED_EVENT, close);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener(INTRO_CLOSED_EVENT, close);
    };
  }, []);
  return enabled;
}

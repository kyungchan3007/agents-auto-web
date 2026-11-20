"use client";

// 홈 도착지 카드 — 요약 알약으로 접어 두었다가 화면에 들어오면 카드로 펼침 (작업 0228 · 모션 13번)
//   state: "final"(지금 운영 카드 · 서버 첫 그림 · 움직임 줄이기 · 자바스크립트 꺼짐) → "pill"(알약으로 접힘) → "expanding"(펼치는 중 · t = 시작 뒤 ms) → "final"(한 번만)
//   서버가 그린 첫 그림은 data-boot 이 붙어 CSS(globals.css)가 처음부터 접어 둠(스크립트 켜짐 · 움직임 줄이기 아님일 때만) — 하이드레이션 한 프레임 뒤 boot 를 떼고 같은 모양을 인라인 값으로 이어 받음 (깜빡임 없음)
//   움직일 수 있는 브라우저에서만 마운트 직후 한 프레임 뒤 접음(armed) · 카드 윗부분이 화면에 들어오면(아래 12% 안쪽) 0.12초 머문 뒤 펼침 · 처음부터 보이면 바로
//   주소가 #today 로 들어오면(메뉴 "오늘 환율" · 공유된 링크) 접지 않고 처음부터 펼친 카드 — 같은 홈에서 hash 만 바뀌어도 접힌 상태면 바로 펼침 (작업 0233)
//   t 는 requestAnimationFrame 으로 갱신(타이머로 값을 바꾸지 않음) · 시간표는 lib/dest-motion.ts 의 pillFrame
import { useReducedMotion } from "motion/react";
import { type RefObject, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PILL_MOTION, pillTotalMs } from "../lib/dest-motion";

export type PillState = "final" | "pill" | "expanding";

const isTodayLink = () => typeof window !== "undefined" && window.location.hash === "#today";

// boot 를 떼면 문서 높이가 바뀜 — 서버 그림은 알약으로 접힌 높이라 브라우저의 첫 스크롤이 모자랄 수 있음.
// 떼고 난 다음 프레임에 #today 구역 맨 위를 한 번만 다시 맞춤 (그새 사용자가 스크롤했으면 건드리지 않음)
function releaseBootAndRealign(setBoot: (v: boolean) => void, link: boolean): () => void {
  let touched = false;
  const mark = () => {
    touched = true;
  };
  const evs = ["wheel", "touchstart", "keydown", "mousedown"] as const;
  if (link) for (const e of evs) window.addEventListener(e, mark, { passive: true, once: true });
  let raf2 = 0;
  const raf1 = requestAnimationFrame(() => {
    setBoot(false);
    if (!link) return;
    raf2 = requestAnimationFrame(() => {
      if (!touched && isTodayLink()) document.getElementById("today")?.scrollIntoView({ block: "start" });
    });
  });
  return () => {
    cancelAnimationFrame(raf1);
    cancelAnimationFrame(raf2);
    if (link) for (const e of evs) window.removeEventListener(e, mark);
  };
}

export function useDestinationsPill<T extends HTMLElement>(count: number): { ref: RefObject<T | null>; state: PillState; t: number; full: number; boot: boolean } {
  const reduce = useReducedMotion();
  const armed = useSyncExternalStore(
    () => () => {},
    () => !reduce,
    () => false,
  );
  const ref = useRef<T>(null);
  const [state, setState] = useState<PillState>("final");
  const [full, setFull] = useState(0); // 접기 전 카드 높이(px) — 펼칠 때 끝 높이
  const [t, setT] = useState(0);
  const [boot, setBoot] = useState(true); // 서버 첫 그림 ~ 하이드레이션 (CSS 가 접어 둔 동안)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!armed) {
      return releaseBootAndRealign(setBoot, isTodayLink()); // 움직임 줄이기 · 하이드레이션 전 — 접지 않고 boot 만 뗌
    }
    if (isTodayLink()) {
      // 링크로 도착 — 접지 않음(위치가 밀리지 않게) · boot 만 뗌
      return releaseBootAndRealign(setBoot, true);
    }
    let io: IntersectionObserver | null = null;
    let hold = 0;
    const onHash = () => {
      if (!isTodayLink()) return;
      io?.disconnect();
      clearTimeout(hold);
      setState((s) => (s === "pill" ? "final" : s));
    };
    window.addEventListener("hashchange", onHash);
    const raf = requestAnimationFrame(() => {
      // 접힌 채 그려졌을 수 있어 scrollHeight(내용 높이) + 테두리로 펼친 높이를 잼
      setFull(el.scrollHeight + (el.offsetHeight - el.clientHeight));
      setState("pill");
      setBoot(false);
      if (typeof IntersectionObserver === "undefined") {
        hold = window.setTimeout(() => setState("expanding"), PILL_MOTION.hold);
        return;
      }
      io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io?.disconnect();
          hold = window.setTimeout(() => setState("expanding"), PILL_MOTION.hold);
        },
        { rootMargin: "0px 0px -12% 0px" },
      );
      io.observe(el);
    });
    return () => {
      window.removeEventListener("hashchange", onHash);
      cancelAnimationFrame(raf);
      io?.disconnect();
      clearTimeout(hold);
    };
  }, [armed]);
  useEffect(() => {
    if (state !== "expanding") return;
    const t0 = performance.now();
    const total = pillTotalMs(count);
    let raf = 0;
    const loop = (now: number) => {
      const el = Math.max(0, now - t0);
      if (el >= total) {
        setState("final");
        return;
      }
      setT(el);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state, count]);
  return { ref, state, t: state === "expanding" ? t : 0, full, boot };
}

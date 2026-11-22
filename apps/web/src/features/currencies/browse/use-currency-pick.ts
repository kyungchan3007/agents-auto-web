"use client";

// 통화 고르기 — 칩 · 목록 · 더보기 상자 어디서 골라도 같은 순서 (작업 0231 · 모션 7)
//   고름 → (환율 자리가 화면 위로 벗어나 있으면) 환율 자리까지 부드럽게 올라감 → 칩 줄 맨 앞에 붙임(저장) → 클라이언트 이동(router.push · 주소 /currencies/XXX · 정적 자료 · 실행 중 API 없음)
//   움직임 줄이기면 올라감 · 칩 밀림 없이 바로 · 올라가기만 함(이미 위쪽이면 내려가지 않음) · 칩에서 골랐으면 그 칩 국기 자리를 적어 둠(국기 날아감의 출발)
import { useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { rememberSwitch, setFlyOrigin, touchSwitch, withSwitch } from "../switch/switch-memory";
import { needsScroll, scrollDuration, scrollTarget } from "../switch/switch-motion";
import { useCurrentCode } from "./use-currency-list";

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

/** 환율 자리까지 올라감 — 끝나면 resolve(true) · 이미 거의 맞거나 위쪽이면 resolve(false) */
function scrollUp(reduce: boolean): Promise<boolean> {
  const kicker = document.querySelector('[data-testid="currency-kicker"]');
  if (!kicker) return Promise.resolve(false);
  const navH = document.querySelector("header")?.getBoundingClientRect().bottom ?? 72;
  const target = scrollTarget(kicker.getBoundingClientRect().top, window.scrollY, navH);
  // 올라가기만 함 — 이미 환율 자리가 위쪽이면 그대로
  if (window.scrollY <= target || !needsScroll(window.scrollY, target)) return Promise.resolve(false);
  if (reduce) {
    window.scrollTo({ top: target, behavior: "instant" });
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const from = window.scrollY;
    const dist = target - from;
    const dur = scrollDuration(dist);
    const t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      window.scrollTo({ top: from + dist * ease(k), behavior: "instant" });
      if (k < 1) requestAnimationFrame(step);
      else resolve(true);
    };
    requestAnimationFrame(step);
  });
}

export function useCurrencyPick(codes: string[], commit: (codes: string[], current: string, code: string) => void) {
  const router = useRouter();
  const reduce = !!useReducedMotion();
  const current = useCurrentCode();
  /** 통화를 고름 — 일반 왼쪽 클릭만 가로채고(새 탭 · 키 조합은 링크 그대로) · fromEl 이 칩이면 그 국기 자리를 적어 둠 */
  const pick = async (code: string, e?: MouseEvent, fromEl?: Element | null) => {
    if (e && (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)) return;
    e?.preventDefault();
    if (code === current) return;
    const svg = fromEl?.querySelector("svg");
    if (svg) {
      const r = svg.getBoundingClientRect();
      setFlyOrigin({ x: r.x, y: r.y, width: r.width, height: r.height });
    } else setFlyOrigin(null);
    touchSwitch();
    const moved = await scrollUp(reduce);
    if (moved && !reduce) await new Promise((r) => setTimeout(r, 120));
    commit(codes, current, code); // 칩 줄 맨 앞에 붙임(저장)
    rememberSwitch(withSwitch(current, {}));
    router.push(`/currencies/${code}`, { scroll: false });
  };
  return { pick, current };
}

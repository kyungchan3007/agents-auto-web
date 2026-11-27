"use client";

// hero 캐러셀 상태 (작업 0385) — 고른 장 · 자동 넘김(setTimeout 한 개 · 남은 시간부터) · 마우스 · 초점 멈춤 · 입력하면 영구 끔 · 옆으로 밀기
//   매 프레임 상태를 바꾸지 않음 — 노란 줄은 CSS animation(지속 시간 = 장 시간 · 멈춤은 animation-play-state)이 그림
//   두 장은 home 이 서버에서 만들어 넘긴 요소라 여기 상태가 바뀌어도 hero 안은 다시 그려지지 않음
import { useReducedMotion } from "motion/react";
import { type FocusEvent, type FormEvent, type TouchEvent, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { heroOf } from "../blackfriday/bf-period";
import { type SlideId, SLIDES, isEntryField, nextSlide, prevSlide, remainingMs, slideMs, swipeDirection } from "./carousel";

const none = () => () => {};
/** 기간 안(블프)인가 — 서버 그림은 블프로 두고 붙은 뒤 지금 시각으로 맞춤 (보이는 쪽은 CSS 가 html data-hero 로 먼저 정함) */
const useBfPeriodNow = (): boolean => useSyncExternalStore(none, () => heroOf(Date.now()) === "bf", () => true);

export function useHeroCarousel() {
  const reduce = useReducedMotion();
  const inPeriod = useBfPeriodNow();
  const [shown, setShown] = useState<{ id: SlideId; epoch: number }>({ id: SLIDES[0], epoch: 0 });
  const [stopped, setStopped] = useState(false);
  const [held, setHeld] = useState(false);
  const hover = useRef(false);
  const focused = useRef(false);
  const left = useRef(slideMs(SLIDES[0]));
  const startedAt = useRef(0);
  const fresh = useRef(true);
  const touchX = useRef<number | null>(null);

  const active: SlideId = inPeriod ? shown.id : "sea";
  const auto = inPeriod && !stopped && !reduce;

  const show = useCallback((id: SlideId) => {
    fresh.current = true;
    setShown((s) => ({ id, epoch: s.epoch + 1 }));
  }, []);

  useEffect(() => {
    if (fresh.current) {
      left.current = slideMs(shown.id);
      fresh.current = false;
    }
    if (!auto || held) return;
    startedAt.current = performance.now();
    const t = setTimeout(() => show(nextSlide(shown.id)), left.current);
    return () => {
      clearTimeout(t);
      if (!fresh.current) left.current = remainingMs(shown.id, slideMs(shown.id) - left.current + (performance.now() - startedAt.current));
    };
  }, [auto, held, shown, show]);

  const hold = useCallback(() => setHeld(hover.current || focused.current), []);

  const bind = {
    onMouseEnter: () => {
      hover.current = true;
      hold();
    },
    onMouseLeave: () => {
      hover.current = false;
      hold();
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      if (isEntryField((e.target as HTMLElement).tagName)) setStopped(true);
      focused.current = true;
      hold();
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
      focused.current = false;
      hold();
    },
    onInput: (e: FormEvent<HTMLElement>) => {
      if (isEntryField((e.target as HTMLElement).tagName)) setStopped(true);
    },
    onTouchStart: (e: TouchEvent<HTMLElement>) => {
      touchX.current = e.touches[0]?.clientX ?? null;
    },
    onTouchEnd: (e: TouchEvent<HTMLElement>) => {
      const x0 = touchX.current;
      touchX.current = null;
      if (x0 === null) return;
      const dir = swipeDirection((e.changedTouches[0]?.clientX ?? x0) - x0);
      if (dir === "next") show(nextSlide(active));
      if (dir === "prev") show(prevSlide(active));
    },
  };

  return {
    active,
    epoch: shown.epoch,
    auto,
    held,
    inPeriod,
    bind,
    pick: (id: SlideId) => {
      if (id !== active) show(id);
    },
    next: () => show(nextSlide(active)),
    prev: () => show(prevSlide(active)),
  };
}

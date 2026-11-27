"use client";

// 흐르는 환율 띠의 움직임 상태 (작업 0399) — 흐름 켜짐(자바스크립트가 돌고 움직임 줄이기가 아닐 때) · 손가락으로 만지면 멈춤(떼고 2.5초 뒤 다시)
//   마우스를 올림 · 키보드 초점은 CSS(:hover · :focus-within)가 멈춤 · 자바스크립트 꺼짐 · 움직임 줄이기는 흐르지 않고 가로 스크롤만 (첫 그림 = 첫 항목부터)
import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const RESUME_MS = 2500;

export function useRateTicker() {
  const reduce = useReducedMotion();
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [held, setHeld] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const hold = () => {
    if (timer.current) clearTimeout(timer.current);
    setHeld(true);
  };
  const release = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setHeld(false), RESUME_MS);
  };
  return { run: ready && !reduce, held, bind: { onTouchStart: hold, onTouchEnd: release, onTouchCancel: release } };
}

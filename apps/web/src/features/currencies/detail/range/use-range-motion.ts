"use client";

// 1년 최저 · 최고 · 평균 카드의 움직임 — 통화를 바꿀 때 비행기가 직전 자리에서 새 자리로(왼쪽으로 가면 기수를 돌림) · 평균 눈금 · 평균 글이 직전 값에서 새 값으로 (작업 0231 · 모션 7)
//   직전 값이 없으면(처음 들어옴 · 새로 고침) 움직임 없이 최종 · 지금 값은 전환 기억에 적어 둠 · 움직임 줄이기는 바로(CSS transition-none · 카운트는 훅이 확인)
import { useCountUp } from "@hav/ui/hooks/motion/use-count-up";
import { useEffect, useState } from "react";
import { routePosition } from "./redesign";
import { planeHeading } from "../../switch/switch-motion";
import { type SwitchSnapshot } from "../../switch/switch-memory";
import { useSwitchRecord } from "../../switch/use-switch-from";

type Stats = { min: number; max: number; avg: number } | null;

export function useRangeMotion(code: string, from: SwitchSnapshot | null, stats: Stats, pos: number | null, avgPos: number | null) {
  const moving = from !== null && from.pos !== null && pos !== null && from.pos !== pos;
  const [arrived, setArrived] = useState(!moving);
  const [headingOn, setHeadingOn] = useState(moving);
  useEffect(() => {
    if (!moving) return;
    const r = requestAnimationFrame(() => setArrived(true)); // 다음 프레임에 새 자리로 — CSS 가 직전 자리에서 미끄러지게
    const t = window.setTimeout(() => setHeadingOn(false), 1500);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t);
    };
  }, [moving]);
  const oldAvgPos = from && from.avg !== null && from.min !== null && from.max !== null ? routePosition(from.avg, from.min, from.max) : null;
  const { ref: avgRef, value: avgValue } = useCountUp<HTMLParagraphElement>(stats?.avg ?? 0, { digits: 4, from: from?.avg ?? null, delayMs: 220, enabled: from !== null });
  useSwitchRecord(code, { min: stats?.min ?? null, max: stats?.max ?? null, avg: stats?.avg ?? null, pos });
  return {
    planePos: moving && !arrived ? (from?.pos ?? pos) : pos,
    avgTickPos: moving && !arrived && oldAvgPos !== null ? oldAvgPos : avgPos,
    heading: headingOn && moving ? planeHeading(from?.pos ?? null, pos) : null,
    animated: from !== null,
    avgRef,
    avgValue: stats ? avgValue : 0,
  };
}

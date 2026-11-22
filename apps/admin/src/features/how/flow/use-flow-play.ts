"use client";

// 흐름 그림 (작업 0303) — 고른 자리 · "따라가기"(단계마다 2.2초) · 단계를 누르면 그 단계로
import { reduceMotion } from "@/shared/ui/events/admin-events";
import { useEffect, useRef, useState } from "react";
import { HOW_STEPS, type NodeId } from "../common/how";

export function useFlowPlay() {
  const [picked, setPicked] = useState<NodeId | null>(null);
  const [at, setAt] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(0);
  const stop = () => {
    window.clearInterval(timer.current);
    setPlaying(false);
  };
  const light = (i: number) => {
    setAt(i);
    const s = HOW_STEPS[i];
    if (s) setPicked(s.node);
  };
  const play = () => {
    if (playing) return stop();
    let i = 0;
    light(0);
    setPlaying(true);
    timer.current = window.setInterval(
      () => {
        i += 1;
        if (i >= HOW_STEPS.length) return stop();
        light(i);
      },
      reduceMotion() ? 2600 : 2200,
    );
  };
  useEffect(() => () => window.clearInterval(timer.current), []);
  const pick = (id: NodeId) => {
    stop();
    setPicked((p) => (p === id ? null : id));
  };
  const step = (i: number) => {
    stop();
    light(i);
  };
  const lit = playing && at >= 0 ? (HOW_STEPS[at]?.node ?? null) : null;
  return { picked, at, playing, lit, play, pick, step };
}

"use client";

// 인트로 로딩 화면의 단계 시계 (작업 0194 · 시안 A) — 3D 준비(loaded)와 최소 표시 시간이 모두 되면 "어디로 떠나시나요?" → 열림 → 끝
// 시간은 모두 타이머 — 순서 계산은 lib/loading.ts · still(움직임 줄이기)이면 넘김 · 열림 없이 곧바로 페이드
import { useEffect, useState } from "react";
import { ASK_HOLD_MS, LOADING, MIN_SHOW_MS, OPEN_MS, STILL_FADE_MS, type LoadingStage, loadingRows, loadingStage } from "../lib/loading";

export function useIntroLoading(loaded: boolean, still: boolean): { stage: LoadingStage; rows: [string, string] } {
  const [minDone, setMinDone] = useState(false);
  const [second, setSecond] = useState("");
  const [asked, setAsked] = useState(false);
  const [opened, setOpened] = useState(false);
  const ready = loaded && minDone;

  // 로딩 시간표 — 첫 줄이 맞춰질 최소 표시 시간 · 둘째 줄이 차례로 바뀜
  useEffect(() => {
    const ids = [window.setTimeout(() => setMinDone(true), still ? 0 : MIN_SHOW_MS), ...LOADING.seconds.map((s) => window.setTimeout(() => setSecond(s.text), still ? 0 : s.at))];
    return () => ids.forEach((id) => window.clearTimeout(id));
  }, [still]);

  // 준비되면 "어디로…" 가 맞춰질 때까지 기다린 뒤 열림 → 열림이 끝나면 로딩 부품을 내림
  useEffect(() => {
    if (!ready) return;
    const a = window.setTimeout(() => setAsked(true), still ? 0 : ASK_HOLD_MS);
    const o = window.setTimeout(() => setOpened(true), still ? STILL_FADE_MS : ASK_HOLD_MS + OPEN_MS);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(o);
    };
  }, [ready, still]);

  const stage = loadingStage({ ready, asked, opened });
  return { stage, rows: loadingRows(stage, second) };
}

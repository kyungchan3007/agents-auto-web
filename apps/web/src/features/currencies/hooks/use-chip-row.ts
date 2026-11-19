"use client";

// 칩 줄 상태 — 저장된 고른 통화 · 5개 + 더보기 · 밀려 나가는 칩 · 밀림 · 더보기 상자 열림 (작업 0231)
//   밀려 나가는 칩은 바뀐 그 그림에서 바로 data-leaving 으로 남겨(≈0.4초) 오른쪽으로 빠지게 함 · 움직임 줄이기 · 다른 탭이 바꾼 것은 움직임 없이 바로
import { useReducedMotion } from "motion/react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { chipRow, visibleChips } from "../lib/recent-chips";
import { useChipFlip } from "./use-chip-flip";
import { useCurrentCode } from "./use-currency-list";
import { useRecentCurrencies } from "./use-recent-currencies";

export function useChipRow(codes: string[]) {
  const current = useCurrentCode();
  const { list: stored, local } = useRecentCurrencies();
  const reduce = !!useReducedMotion();
  const row = chipRow(stored, current, codes);
  const { shown, more } = visibleChips(row);
  const key = shown.join(",");
  const [prevShown, setPrevShown] = useState(shown);
  const [leaving, setLeaving] = useState<string[]>([]);
  if (key !== prevShown.join(",")) {
    // 그리는 중 바뀐 것을 알아챔(공식 방식) — 줄에서 빠진 칩이 움직임을 보일 때만 잠깐 남김
    setPrevShown(shown);
    setLeaving(local && !reduce ? prevShown.filter((c) => !shown.includes(c)) : []);
  }
  useEffect(() => {
    if (leaving.length === 0) return;
    const t = window.setTimeout(() => setLeaving([]), 420);
    return () => clearTimeout(t);
  }, [leaving]);
  const flip = useChipFlip(`${key}|${leaving.join(",")}`, local && !reduce);
  const [open, setOpen] = useState(false);
  // 준비됨 — 서버 첫 그림 · 하이드레이션 중에는 거짓, 브라우저에서 저장을 읽어 저장 순서로 그린 같은 그림에서 참 (저장이 있으면 그때까지 칩 줄을 숨김 · globals.css · 밀림 움직임 없이 바로 나타남)
  const ready = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return { current, row, shown, more, leaving, flip, open, setOpen, ready };
}

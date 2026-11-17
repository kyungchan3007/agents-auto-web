"use client";

// 출발 안내판 줄들 — 줄 글이 바뀌면 바뀐 칸만 넘어가 새 글자가 됨 (작업 0194 · 인트로 로딩 안내판)
// 처음에는 빈 칸에서 첫 글자로 넘어가고, 글이 또 바뀌면 지금 보이는 글자에서 새 글자로 · 정해진 글자판을 거침(난수 없음 · flap.ts)
// skip(움직임 줄이기)이면 넘김 없이 바로 최종 글자
import { useEffect, useRef, useState } from "react";
import { type FlipStep, cellsAt, flipDurationMs, flipPlan, toCells } from "../lib/flap";

type Anim = { from: string[]; to: string[]; plan: FlipStep[]; t0: number };
const same = (a: string[], b: string[]) => a.length === b.length && a.every((c, i) => c === b[i]);

export function useFlapRows(texts: string[], opts: { cols: number; totalMs?: number; skip?: boolean }): string[][] {
  const { cols, totalMs = 1100, skip = false } = opts;
  // 글자가 없는 줄은 "----" 가 아니라 빈 칸 (로딩 둘째 줄을 비움)
  const cellsOf = (text: string): string[] => (text.trim() === "" ? Array.from({ length: cols }, () => " ") : toCells(text, cols));
  const [shown, setShown] = useState<string[][]>(() => texts.map(() => Array.from({ length: cols }, () => " ")));
  const current = useRef<string[][]>(shown);
  const key = texts.join("\u0001");

  useEffect(() => {
    if (skip) return;
    const finals = texts.map(cellsOf);
    const t0 = performance.now();
    const anims: (Anim | null)[] = finals.map((to, i) => {
      const from = current.current[i] ?? to;
      return same(from, to) ? null : { from, to, plan: flipPlan(to, { totalMs }), t0 };
    });
    let raf = 0;
    const loop = (now: number) => {
      let active = false;
      const next = finals.map((to, i) => {
        const a = anims[i];
        if (!a) return to;
        const elapsed = now - a.t0;
        if (elapsed >= flipDurationMs(a.plan)) {
          anims[i] = null;
          return to;
        }
        active = true;
        return cellsAt(a.from, a.to, a.plan, elapsed);
      });
      current.current = next;
      setShown(next);
      if (active) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // texts 는 key 로 비교 (내용이 바뀔 때만 다시 시작)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, cols, totalMs, skip]);

  return skip ? texts.map(cellsOf) : shown;
}

"use client";

// 그래프 칸 · 그 안에서 쓰는 고유 id (작업 0312 에 line-chart.tsx · month-bars.tsx 에서 옮김) — 그라데이션 · 잘림 id 가 페이지 안에서 겹치지 않게
import { useId, useRef } from "react";

export function useChartBox() {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const box = useRef<HTMLDivElement>(null);
  return { uid, box };
}

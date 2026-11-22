"use client";

// 날마다 그래프에서 고른 막대 (작업 0303) — 마우스 · 누름 · 포커스로 고름 · 처음엔 없음
import { useState } from "react";

export function useDayPick() {
  const [on, setOn] = useState<number | null>(null);
  return { on, pick: setOn };
}

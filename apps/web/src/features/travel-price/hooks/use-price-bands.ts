"use client";

// 물가 구간 "나라 더 보기" 펼침 상태 (작업 0170)
import { useState } from "react";

export function usePriceBands() {
  const [open, setOpen] = useState(false);
  return { open, toggle: () => setOpen((v) => !v) };
}

"use client";

// 물가 구간 "나라 더 보기" 펼침 상태 (작업 0170) · 접으면 목록 머리로 돌아감 (작업 0198)
import { useState } from "react";

export const PRICE_BANDS_ID = "price-bands";

export function usePriceBands() {
  const [open, setOpen] = useState(false);
  const toggle = () => {
    if (open) {
      setOpen(false);
      // 줄어든 레이아웃에서 이동하도록 한 틱 뒤에 · 모션 줄이기 설정이면 즉시
      setTimeout(() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        document.getElementById(PRICE_BANDS_ID)?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
      }, 0);
    } else setOpen(true);
  };
  return { open, toggle };
}

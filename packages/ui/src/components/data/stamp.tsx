// 노란 도장 — "면세 한도 안" 같은 판정 도장 (직구 계산이 씀 · 고양이 그림을 대신 · 작업 0168)
// 해 노랑은 "가장 좋은 때"에만 — 그래서 좋은 판정(한도 안)에만 쓰고 나쁜 판정은 글자 색(비쌈 주홍)으로 · 살짝 기울어 도장처럼
import type { ReactNode } from "react";

export function Stamp({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span role="status" className={`inline-block -rotate-3 rounded-card border-2 border-pin-ink bg-sun px-4 py-2 font-display text-city font-normal text-pin-ink ${className}`}>
      {children}
    </span>
  );
}

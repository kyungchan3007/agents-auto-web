// 도장 — "면세 한도 안 ($200)" 같은 판정 도장 (직구 계산이 씀 · 작업 0168 · 작업 0170 Figma 05 모양으로 바꿈)
// 울트라마린 카드 위에서 쓰는 노란 윤곽 네모(모서리 6px · 읽기 전용이라 알약이 아님 · 작업 0264) · 살짝 기울어 도장처럼 · 해 노랑은 좋은 판정(한도 안)에만 쓰고 나쁜 판정은 글자(비쌈 주홍)로
import type { ReactNode } from "react";

export function Stamp({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span role="status" className={`inline-block -rotate-3 rounded-[6px] border-2 border-sun px-5 py-2 text-[1.125rem] font-semibold text-sun ${className}`}>
      {children}
    </span>
  );
}

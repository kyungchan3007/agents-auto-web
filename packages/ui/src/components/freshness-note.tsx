"use client";

// 환율 기준일 옆 한 줄 — 오늘 값이 아니면 왜인지 (작업 0095) · 빌드 그림에는 없음(시각은 브라우저에서만 앎) · 오늘 값이면 아무것도 안 그림
import { useFreshness } from "../hooks/use-freshness";

export function FreshnessNote({ date, className = "" }: { date: string; className?: string }) {
  const { kind: f, text } = useFreshness(date);
  if (f === "today") return null;
  return (
    <p role="note" className={`text-xs ${f === "late" ? "text-expensive" : "text-fg-2"} ${className}`}>
      {f === "late" ? "⚠ " : ""}
      {text}
    </p>
  );
}

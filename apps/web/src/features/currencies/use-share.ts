"use client";

// 공유 — 휴대폰은 공유 창(Web Share) · 안 되면 주소 복사 (작업 0093) · 아무것도 보내지 않음 (브라우저 기능만)
import { useState } from "react";

export function useShare({ title, text }: { title: string; text: string }) {
  const [done, setDone] = useState<"copied" | "failed" | null>(null);
  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return; // 사용자가 닫음
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setDone("copied");
    } catch {
      setDone("failed");
    }
    setTimeout(() => setDone(null), 2500);
  };
  return { share, done };
}

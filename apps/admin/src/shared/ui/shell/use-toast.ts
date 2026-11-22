"use client";

// 아래 알림 한 줄 (작업 0303 · 0312 에 admin-shell.tsx 에서 옮김) — adm-toast 이벤트를 받아 1.8초 보임
import { useEffect, useState } from "react";

export function useToast() {
  const [text, setText] = useState("");
  const [on, setOn] = useState(false);
  useEffect(() => {
    let t = 0;
    const show = (e: Event) => {
      setText(String((e as CustomEvent).detail));
      setOn(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setOn(false), 1800);
    };
    window.addEventListener("adm-toast", show);
    return () => {
      window.removeEventListener("adm-toast", show);
      window.clearTimeout(t);
    };
  }, []);
  return { text, on };
}

"use client";

// 처음 들어왔을 때 안내 — /session 으로 토큰 이름을 받아 본인(owner)이 아니고 이 브라우저에서 그 이름으로 닫은 적이 없으면 띄움 (작업 0326)
//   작업 0369: "봤음" 표시를 토큰 이름마다 따로 저장, 같은 브라우저라도 다른 회사 링크로 들어오면 다시 뜸
//   받지 못하면(401 · 404 · 네트워크 실패 · 알 수 없는 모양) 아무것도 하지 않음 — Worker 가 없는 로컬 · 정적 서버에서도 화면은 그대로
import { useCallback, useEffect, useState } from "react";
import { parseSessionName, shouldWelcome } from "./session-view";

const seenKey = (name: string): string => `adm-gate-welcome-seen:${name}`;

const seen = (name: string): boolean => {
  try {
    return window.localStorage.getItem(seenKey(name)) !== null;
  } catch {
    return false;
  }
};

export function useGateWelcome() {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    let stopped = false;
    fetch("/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        const n = parseSessionName(data);
        if (!stopped && shouldWelcome(n) && !seen(n)) setName(n);
      })
      .catch(() => undefined);
    return () => {
      stopped = true;
    };
  }, []);
  const dismiss = useCallback(() => {
    try {
      if (name) window.localStorage.setItem(seenKey(name), "1");
    } catch {
      // 저장을 못 해도 이번엔 닫음
    }
    setName(null);
  }, [name]);
  return { name, dismiss };
}

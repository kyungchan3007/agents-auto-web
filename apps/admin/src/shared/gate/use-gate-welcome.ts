"use client";

// 처음 들어왔을 때 안내 — /session 으로 토큰 이름을 받아 본인(owner)이 아니고 이 브라우저에서 닫은 적이 없으면 띄움 (작업 0326)
//   받지 못하면(401 · 404 · 네트워크 실패 · 알 수 없는 모양) 아무것도 하지 않음 — Worker 가 없는 로컬 · 정적 서버에서도 화면은 그대로
import { useCallback, useEffect, useState } from "react";
import { parseSessionName, shouldWelcome } from "./session-view";

const SEEN_KEY = "adm-gate-welcome-seen";

const seen = (): boolean => {
  try {
    return window.localStorage.getItem(SEEN_KEY) !== null;
  } catch {
    return false;
  }
};

export function useGateWelcome() {
  const [name, setName] = useState<string | null>(null);
  useEffect(() => {
    if (seen()) return;
    let stopped = false;
    fetch("/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        const n = parseSessionName(data);
        if (!stopped && shouldWelcome(n)) setName(n);
      })
      .catch(() => undefined);
    return () => {
      stopped = true;
    };
  }, []);
  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // 저장을 못 해도 이번엔 닫음
    }
    setName(null);
  }, []);
  return { name, dismiss };
}

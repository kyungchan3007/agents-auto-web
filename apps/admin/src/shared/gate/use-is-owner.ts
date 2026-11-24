"use client";

// 본인(owner) 세션인가 (작업 0339) — /session 으로 한 번 · 받지 못하면(401 · 404 · 네트워크 실패 · 알 수 없는 모양) false
//   접속 기록처럼 본인만 볼 것을 가릴 때 씀 · 받는 동안도 false(먼저 보였다 사라지지 않게)
import { useEffect, useState } from "react";
import { isOwnerName, parseSessionName } from "./session-view";

export function useIsOwner(): boolean {
  const [owner, setOwner] = useState(false);
  useEffect(() => {
    let stopped = false;
    fetch("/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: unknown) => {
        if (!stopped) setOwner(isOwnerName(parseSessionName(data)));
      })
      .catch(() => undefined);
    return () => {
      stopped = true;
    };
  }, []);
  return owner;
}

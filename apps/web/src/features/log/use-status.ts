"use client";

// 사이트 상태 받기 — 빌드 때 받은 값을 먼저 · 브라우저가 /bff/status 를 5분마다(탭이 보일 때만) (작업 0105)
//   API 도 5분 구간 캐시라 D1 읽기는 사람 수와 상관없음
import { SiteStatus as Schema, type SiteStatus } from "@hav/shared/status";
import { useEffect, useState } from "react";
import { type Fetched, getJson } from "../../shared/api";

const POLL_MS = 5 * 60_000;

export function useStatus(build: Fetched<SiteStatus>, base = "/bff"): Fetched<SiteStatus> {
  const [live, setLive] = useState<Fetched<SiteStatus> | null>(null);
  useEffect(() => {
    let stopped = false;
    const tick = async () => {
      if (document.hidden) return;
      const r = await getJson("/status", Schema, { base, timeoutMs: 8_000 });
      if (!stopped && r.ok) setLive(r);
    };
    void tick();
    const id = setInterval(tick, POLL_MS);
    const onShow = () => !document.hidden && void tick();
    document.addEventListener("visibilitychange", onShow);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onShow);
    };
  }, [base]);
  return live ?? build;
}

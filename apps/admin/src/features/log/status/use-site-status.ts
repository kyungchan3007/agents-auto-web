"use client";

// 사이트 상태 받기 (작업 0105 → 작업 0303) — 빌드 때 값을 먼저 · 5분마다(남은 시간) · 누르면 바로 · 다시 받으면 알림 한 줄
import type { SiteStatus } from "@hav/shared/status";
import { useRefresh } from "@/shared/live/use-refresh";
import { toast } from "@/shared/ui/events/admin-events";
import { useEffect, useRef } from "react";
import { type Fetched, LIVE, api } from "@hav/shared/api";

const load = () => api.status(LIVE);
const PERIOD = 300;

export function useSiteStatus(build: Fetched<SiteStatus>) {
  const s = useRefresh(build, load, PERIOD);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    toast("사이트 상태를 다시 받았습니다");
  }, [s.round]);
  return s;
}

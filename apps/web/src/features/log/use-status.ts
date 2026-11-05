"use client";

// 사이트 상태 받기 — 빌드 때 받은 값을 먼저 · 브라우저가 /bff/status 를 5분마다(탭이 보일 때만) (작업 0105)
//   API 도 5분 구간 캐시라 D1 읽기는 사람 수와 상관없음
import type { SiteStatus } from "@hav/shared/status";
import { useLivePolling } from "@hav/ui/hooks/use-live";
import { type Fetched, LIVE, api } from "../../shared/api";

const POLL_MS = 5 * 60_000;
const load = () => api.status(LIVE);

export const useStatus = (build: Fetched<SiteStatus>) => useLivePolling(build, load, POLL_MS);

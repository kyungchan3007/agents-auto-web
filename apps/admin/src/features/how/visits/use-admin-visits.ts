"use client";

// 접속 기록 받기 — 브라우저에서 /bff/admin-visits 로 한 번 · null = 받는 중 (작업 0326)
import { type Fetched, LIVE, api } from "@hav/shared/api";
import type { AdminVisits } from "@hav/shared/admin-visits";
import { useLiveOnly } from "@/shared/live/use-live-only";

const load = () => api.adminVisits(LIVE);

export const useAdminVisits = (): Fetched<AdminVisits> | null => useLiveOnly(load);
